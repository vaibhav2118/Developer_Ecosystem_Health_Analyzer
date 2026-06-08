import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
from apscheduler.schedulers.background import BackgroundScheduler
from sqlalchemy.orm import Session

from backend.app.database.session import SessionLocal
from backend.app.database.models import (
    Repository, Contributor, Commit, PullRequest, Issue, 
    Dependency, Vulnerability, HealthScore, RiskAlert, ScheduledScan, AuditLog
)
from backend.app.fetchers.github_client import GitHubClient
from backend.app.fetchers.osv_client import OSVClient
from backend.app.metrics.contributor import calculate_contributor_metrics
from backend.app.metrics.code_velocity import calculate_velocity_metrics
from backend.app.metrics.dependency import parse_dependencies, evaluate_dependency_details
from backend.app.metrics.community import calculate_community_metrics
from backend.app.metrics.network import analyze_collaboration_network
from backend.app.scoring.health_engine import calculate_health_scores
from backend.app.analysis.forecaster import forecast_repository_metrics
from backend.app.analysis.risk_detector import evaluate_repository_risks

logger = logging.getLogger(__name__)
scheduler = BackgroundScheduler()

async def analyze_repository_pipeline(db: Session, repository_id: int) -> bool:
    """
    Runs the complete evaluation pipeline for a repository:
    1. Fetches metadata and raw logs from GitHub API or Mock Engine.
    2. Populates database commits, issues, PRs, and contributors.
    3. Parses files and checks OSV vulnerabilities.
    4. Computes structural network graphs and centralities.
    5. Evaluates 5-dimensional health scores.
    6. Triggers risk assessment alarms.
    """
    repo = db.query(Repository).filter(Repository.id == repository_id).first()
    if not repo:
        logger.error(f"Repository with ID {repository_id} not found in database.")
        return False
        
    try:
        # Start logging audit event
        audit = AuditLog(
            action="scan_start",
            target_type="repository",
            target_id=str(repo.id),
            details=f"Starting scan for {repo.full_name}"
        )
        db.add(audit)
        db.commit()

        # Step 1: Initialize clients and fetch data
        gh = GitHubClient()
        osv = OSVClient()
        
        raw_data = await gh.fetch_repository_data(repo.full_name)
        
        # Step 2: Update Repository general metadata
        details = raw_data["details"]
        repo.stars = details.get("stargazers_count", repo.stars)
        repo.forks = details.get("forks_count", repo.forks)
        repo.watchers = details.get("subscribers_count", repo.watchers)
        repo.open_issues = details.get("open_issues_count", repo.open_issues)
        repo.language = details.get("language", repo.language)
        repo.description = details.get("description", repo.description)
        repo.url = details.get("html_url", repo.url)
        repo.last_scanned_at = datetime.utcnow()
        
        # Step 3: Populate Contributors
        db_contribs = []
        for c in raw_data["contributors"]:
            contrib = db.query(Contributor).filter(Contributor.username == c["login"]).first()
            if not contrib:
                contrib = Contributor(
                    github_id=c.get("id"),
                    username=c["login"],
                    avatar_url=c.get("avatar_url"),
                    email=f"{c['login']}@example.com"
                )
                db.add(contrib)
                db.flush()
            db_contribs.append(contrib)
            
        # Link contributors to repo
        repo.contributors = db_contribs
        db.flush()
        
        # Step 4: Populate Commits (Clear old to keep simple, or upsert. Let's clear old first to keep snapshots clean)
        db.query(Commit).filter(Commit.repository_id == repo.id).delete()
        for c in raw_data["commits"]:
            sha = c["sha"]
            msg = c.get("commit", {}).get("message", "")
            date_str = c.get("commit", {}).get("author", {}).get("date")
            date = datetime.strptime(date_str, "%Y-%m-%dT%H:%M:%SZ") if date_str else datetime.utcnow()
            
            author_uname = c.get("author", {}).get("login") if c.get("author") else c.get("commit", {}).get("author", {}).get("name")
            stats = c.get("stats", {})
            additions = stats.get("additions", 0)
            deletions = stats.get("deletions", 0)
            
            commit = Commit(
                repository_id=repo.id,
                sha=sha,
                author_username=author_uname,
                author_email=c.get("commit", {}).get("author", {}).get("email"),
                date=date,
                message=msg,
                additions=additions,
                deletions=deletions
            )
            db.add(commit)
            
        # Step 5: Populate PRs & Issues
        db.query(PullRequest).filter(PullRequest.repository_id == repo.id).delete()
        for pr in raw_data["prs"]:
            created_dt = parse_github_date(pr.get("created_at"))
            closed_dt = parse_github_date(pr.get("closed_at"))
            merged_dt = parse_github_date(pr.get("merged_at"))
            
            # Compute hours
            review_hrs = None
            merge_hrs = None
            if created_dt:
                if merged_dt:
                    merge_hrs = (merged_dt - created_dt).total_seconds() / 3600.0
                    review_hrs = merge_hrs * 0.7
                elif closed_dt:
                    review_hrs = (closed_dt - created_dt).total_seconds() / 3600.0
                    
            db_pr = PullRequest(
                repository_id=repo.id,
                number=pr["number"],
                title=pr["title"],
                state=pr["state"],
                creator_username=pr.get("user", {}).get("login", "unknown"),
                created_at=created_dt or datetime.utcnow(),
                closed_at=closed_dt,
                merged_at=merged_dt,
                comments_count=pr.get("comments", 0),
                review_comments_count=pr.get("review_comments", 0),
                review_time_hours=review_hrs,
                merge_time_hours=merge_hrs
            )
            db.add(db_pr)
            
        db.query(Issue).filter(Issue.repository_id == repo.id).delete()
        for issue in raw_data["issues"]:
            created_dt = parse_github_date(issue.get("created_at"))
            closed_dt = parse_github_date(issue.get("closed_at"))
            
            res_hrs = None
            first_resp = None
            if created_dt:
                if closed_dt:
                    res_hrs = (closed_dt - created_dt).total_seconds() / 3600.0
                if issue.get("comments", 0) > 0:
                    first_resp = 4.0 # estimation
                    
            db_issue = Issue(
                repository_id=repo.id,
                number=issue["number"],
                title=issue["title"],
                state=issue["state"],
                creator_username=issue.get("user", {}).get("login", "unknown"),
                created_at=created_dt or datetime.utcnow(),
                closed_at=closed_dt,
                comments_count=issue.get("comments", 0),
                first_response_time_hours=first_resp,
                resolution_time_hours=res_hrs
            )
            db.add(db_issue)
            
        db.flush()

        # Step 6: Parse dependencies & check OSV vulnerabilities
        db.query(Dependency).filter(Dependency.repository_id == repo.id).delete()
        
        parsed_deps = parse_dependencies(raw_data["dependency_files"])
        evaluated_deps = []
        for dep in parsed_deps:
            details_dep = evaluate_dependency_details(dep)
            
            # Check OSV vulnerabilities
            vulns = await osv.check_vulnerability(dep["name"], dep["version"], dep["type"])
            vuln_score = 0.0
            
            # Calculate vulnerability exposure subscore
            # Critical = 30 points, High = 20, Medium = 10, Low = 5
            for v in vulns:
                sev = v["severity"].upper()
                if sev == "CRITICAL": vuln_score += 30.0
                elif sev == "HIGH": vuln_score += 20.0
                elif sev == "MEDIUM": vuln_score += 10.0
                else: vuln_score += 5.0
                
            db_dep = Dependency(
                repository_id=repo.id,
                name=dep["name"],
                version=dep["version"],
                file_path=dep["file_path"],
                type=dep["type"],
                latest_version=details_dep.get("latest_version"),
                release_date=details_dep.get("release_date"),
                age_days=details_dep.get("age_days"),
                popularity=details_dep.get("popularity"),
                maintenance_activity=details_dep.get("maintenance_activity"),
                staleness_score=details_dep.get("staleness_score", 0.0),
                vulnerability_score=min(100.0, vuln_score),
                license=details_dep.get("license", "MIT")
            )
            db.add(db_dep)
            db.flush()
            
            # Save vulnerability records
            for v in vulns:
                db_vuln = Vulnerability(
                    dependency_id=db_dep.id,
                    osv_id=v["osv_id"],
                    title=v["title"],
                    summary=v["summary"],
                    details=v["details"],
                    severity=v["severity"],
                    cvss_score=v["cvss_score"],
                    fixed_in=v.get("fixed_in"),
                    affected_versions=v.get("affected_versions")
                )
                db.add(db_vuln)
                
            details_dep["vulnerability_score"] = min(100.0, vuln_score)
            evaluated_deps.append(details_dep)
            
        db.flush()

        # Step 7: Run Metrics Engines
        commits_list = []
        for c in raw_data["commits"]:
            commits_list.append(c)
            
        contributors_list = []
        for c in raw_data["contributors"]:
            contributors_list.append(c)
            
        # Re-fetch commits and issues/PRs from raw to verify
        # Call metric builders
        c_metrics = calculate_contributor_metrics(commits_list, contributors_list)
        v_metrics = calculate_velocity_metrics(commits_list, raw_data["prs"], raw_data["issues"])
        
        # README quality parsing
        # Try to find a readme in dependency files (we can mock it in raw_data if not found)
        readme_content = raw_data["dependency_files"].get("README.md", "## Welcome to Project\n### Installation\nRun npm install\n### Usage\nRun code\n### License\nMIT")
        com_metrics = calculate_community_metrics(
            raw_data["issues"], 
            raw_data["prs"], 
            readme_content, 
            repo.stars, 
            repo.forks
        )
        
        net_metrics = analyze_collaboration_network(commits_list, contributors_list)
        
        # Step 8: Scoring Engine
        scores = calculate_health_scores(
            c_metrics,
            v_metrics,
            evaluated_deps,
            com_metrics,
            net_metrics
        )
        
        # Save HealthScore snapshot
        hs = HealthScore(
            repository_id=repo.id,
            overall_score=scores["overall_score"],
            activity_score=scores["activity_score"],
            community_score=scores["community_score"],
            security_score=scores["security_score"],
            sustainability_score=scores["sustainability_score"],
            maintainability_score=scores["maintainability_score"],
            confidence_interval_low=scores["confidence_interval_low"],
            confidence_interval_high=scores["confidence_interval_high"]
        )
        db.add(hs)
        
        # Step 9: Alert Detection
        db.query(RiskAlert).filter(RiskAlert.repository_id == repo.id, RiskAlert.is_resolved == False).delete()
        alerts = evaluate_repository_risks(
            c_metrics,
            v_metrics,
            evaluated_deps,
            com_metrics,
            scores["overall_score"]
        )
        
        for alert in alerts:
            db_alert = RiskAlert(
                repository_id=repo.id,
                type=alert["type"],
                severity=alert["severity"],
                message=alert["message"],
                description=alert["description"],
                recommendation=alert["recommendation"]
            )
            db.add(db_alert)
            
        # Log successful completion audit
        audit_success = AuditLog(
            action="scan_success",
            target_type="repository",
            target_id=str(repo.id),
            details=f"Successfully scanned {repo.full_name}. Overall Score: {scores['overall_score']}"
        )
        db.add(audit_success)
        
        db.commit()
        logger.info(f"Pipeline completed successfully for repository: {repo.full_name}")
        return True

    except Exception as e:
        db.rollback()
        logger.error(f"Failed to scan repository {repo.full_name}: {str(e)}", exc_info=True)
        # Log failure audit
        try:
            audit_fail = AuditLog(
                action="scan_failed",
                target_type="repository",
                target_id=str(repo.id),
                details=f"Failed scan for {repo.full_name}. Error: {str(e)}"
            )
            db.add(audit_fail)
            db.commit()
        except Exception:
            pass
        return False

def parse_github_date(date_str: str) -> Optional[datetime]:
    if not date_str:
        return None
    try:
        return datetime.strptime(date_str, "%Y-%m-%dT%H:%M:%SZ")
    except Exception:
        try:
            return datetime.strptime(date_str.split(".")[0], "%Y-%m-%dT%H:%M:%S")
        except Exception:
            return None

def trigger_scheduled_scans():
    """APScheduler execution entry point: scans pending/due repositories."""
    logger.info("Starting scheduled repository scans...")
    db = SessionLocal()
    try:
        scans = db.query(ScheduledScan).filter(ScheduledScan.next_run <= datetime.utcnow()).all()
        for scan in scans:
            scan.status = "running"
            db.commit()
            
            # We run the pipeline synchronously within this task runner thread
            import asyncio
            success = asyncio.run(analyze_repository_pipeline(db, scan.repository_id))
            
            # Set next run frequency
            now = datetime.utcnow()
            if scan.frequency == "daily":
                scan.next_run = now + timedelta(days=1)
            elif scan.frequency == "weekly":
                scan.next_run = now + timedelta(weeks=1)
            else: # monthly
                scan.next_run = now + timedelta(days=30)
                
            scan.last_run = now
            scan.status = "completed" if success else "failed"
            if not success:
                scan.error_message = "Scan pipeline failed. Check logs."
            else:
                scan.error_message = None
            db.commit()
    except Exception as e:
        logger.error(f"Error executing scheduled scan job: {str(e)}")
    finally:
        db.close()

def start_scheduler():
    # Execute scan check every 15 minutes
    scheduler.add_job(trigger_scheduled_scans, 'interval', minutes=15, id='repo_scan_job')
    scheduler.start()
    logger.info("APScheduler initialized and running.")
