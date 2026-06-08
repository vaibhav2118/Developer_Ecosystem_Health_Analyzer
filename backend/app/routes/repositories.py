from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta

from backend.app.database.session import get_db
from backend.app.database.models import (
    Repository, HealthScore, Dependency, Vulnerability, RiskAlert, ScheduledScan, User, AuditLog
)
from backend.app.auth.auth import get_current_user, RoleChecker
from backend.app.scheduler.tasks import analyze_repository_pipeline
from backend.app.analysis.forecaster import forecast_repository_metrics
from backend.app.analysis.risk_detector import evaluate_repository_risks
from backend.app.metrics.contributor import calculate_contributor_metrics
from backend.app.metrics.code_velocity import calculate_velocity_metrics
from backend.app.metrics.community import calculate_community_metrics
from backend.app.metrics.network import analyze_collaboration_network
from backend.app.analysis.comparator import compare_repositories_data

router = APIRouter(prefix="/repositories", tags=["repositories"])

class AnalyzeRequest(BaseModel):
    full_name: str # e.g. "fastapi/fastapi"
    frequency: Optional[str] = "weekly" # daily, weekly, monthly

class CompareRequest(BaseModel):
    repository_ids: List[int]

# Role checks
analyst_only = Depends(RoleChecker(["Admin", "Analyst"]))
viewer_or_above = Depends(RoleChecker(["Admin", "Analyst", "Security Engineer", "Executive Viewer"]))

@router.post("/analyze", status_code=status.HTTP_202_ACCEPTED)
async def analyze_repository(
    payload: AnalyzeRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Registers a repository in the database and triggers the analysis pipeline asynchronously.
    """
    # Verify format
    parts = payload.full_name.split("/")
    if len(parts) != 2 or not parts[0] or not parts[1]:
        raise HTTPException(status_code=400, detail="Repository name must be in the format 'owner/repo'")
        
    full_name = payload.full_name.strip()
    
    # Check if repository already registered
    repo = db.query(Repository).filter(Repository.full_name == full_name).first()
    if not repo:
        repo = Repository(
            name=parts[1],
            full_name=full_name,
            last_scanned_at=None
        )
        db.add(repo)
        db.flush()
        
    # Setup or update scheduled scan
    scan = db.query(ScheduledScan).filter(ScheduledScan.repository_id == repo.id).first()
    if not scan:
        scan = ScheduledScan(
            repository_id=repo.id,
            frequency=payload.frequency,
            next_run=datetime.utcnow()
        )
        db.add(scan)
    else:
        scan.frequency = payload.frequency
        scan.next_run = datetime.utcnow()
        
    db.commit()
    db.refresh(repo)
    
    # Log audit event
    audit = AuditLog(
        user_id=current_user.id,
        username=current_user.username,
        action="request_analysis",
        target_type="repository",
        target_id=str(repo.id),
        details=f"User requested analysis for {full_name}"
    )
    db.add(audit)
    db.commit()

    # Trigger background pipeline
    background_tasks.add_task(analyze_repository_pipeline, db, repo.id)
    
    return {
        "message": "Repository analysis successfully scheduled in background.",
        "repository_id": repo.id,
        "full_name": repo.full_name,
        "status": "pending"
    }

@router.get("", response_model=List[dict])
def list_repositories(
    search: Optional[str] = None,
    language: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns a list of analyzed repositories.
    """
    query = db.query(Repository)
    if search:
        query = query.filter(Repository.full_name.ilike(f"%{search}%"))
    if language:
        query = query.filter(Repository.language.ilike(f"%{language}%"))
        
    repos = query.all()
    results = []
    
    for r in repos:
        # Get latest health score
        latest_score = db.query(HealthScore).filter(HealthScore.repository_id == r.id).order_by(HealthScore.date.desc()).first()
        alerts_count = db.query(RiskAlert).filter(RiskAlert.repository_id == r.id, RiskAlert.is_resolved == False).count()
        
        results.append({
            "id": r.id,
            "name": r.name,
            "full_name": r.full_name,
            "description": r.description,
            "stars": r.stars,
            "forks": r.forks,
            "watchers": r.watchers,
            "open_issues": r.open_issues,
            "language": r.language,
            "last_scanned_at": r.last_scanned_at,
            "health_score": latest_score.overall_score if latest_score else None,
            "alerts_count": alerts_count
        })
    return results

@router.get("/{id}")
def get_repository_details(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns full metrics, score history, vulnerability lists, network nodes, and scikit-learn forecasts.
    """
    repo = db.query(Repository).filter(Repository.id == id).first()
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")
        
    latest_score = db.query(HealthScore).filter(HealthScore.repository_id == repo.id).order_by(HealthScore.date.desc()).first()
    alerts = db.query(RiskAlert).filter(RiskAlert.repository_id == repo.id, RiskAlert.is_resolved == False).all()
    
    # Re-assemble metrics for detailed sections from database relations
    commits = repo.commits
    prs = repo.pull_requests
    issues = repo.issues
    
    # Form contributor lists
    contributors_list = []
    for c in repo.contributors:
        contributors_list.append({"login": c.username, "avatar_url": c.avatar_url, "contributions": 10})
        
    c_metrics = calculate_contributor_metrics(
        [{"author": {"login": c.author_username}, "commit": {"author": {"date": c.date.strftime("%Y-%m-%dT%H:%M:%SZ")}}} for c in commits],
        contributors_list
    )
    
    v_metrics = calculate_velocity_metrics(
        [{"commit": {"author": {"date": c.date.strftime("%Y-%m-%dT%H:%M:%SZ")}}} for c in commits],
        [{"number": pr.number, "created_at": pr.created_at.strftime("%Y-%m-%dT%H:%M:%SZ"), "closed_at": pr.closed_at.strftime("%Y-%m-%dT%H:%M:%SZ") if pr.closed_at else None, "merged_at": pr.merged_at.strftime("%Y-%m-%dT%H:%M:%SZ") if pr.merged_at else None, "comments": pr.comments_count, "review_comments": pr.review_comments_count} for pr in prs],
        [{"number": issue.number, "created_at": issue.created_at.strftime("%Y-%m-%dT%H:%M:%SZ"), "closed_at": issue.closed_at.strftime("%Y-%m-%dT%H:%M:%SZ") if issue.closed_at else None, "comments": issue.comments_count} for issue in issues]
    )
    
    # Parse dependencies from DB
    dependencies_list = []
    for d in repo.dependencies:
        # Check vulnerabilities
        vulns = db.query(Vulnerability).filter(Vulnerability.dependency_id == d.id).all()
        vulns_data = [{
            "osv_id": v.osv_id,
            "title": v.title,
            "summary": v.summary,
            "details": v.details,
            "severity": v.severity,
            "cvss_score": v.cvss_score,
            "fixed_in": v.fixed_in
        } for v in vulns]
        
        dependencies_list.append({
            "name": d.name,
            "version": d.version,
            "file_path": d.file_path,
            "type": d.type,
            "latest_version": d.latest_version,
            "age_days": d.age_days,
            "popularity": d.popularity,
            "maintenance_activity": d.maintenance_activity,
            "staleness_score": d.staleness_score,
            "vulnerability_score": d.vulnerability_score,
            "license": d.license,
            "vulnerabilities": vulns_data
        })
        
    net_metrics = analyze_collaboration_network(
        [{"author": {"login": c.author_username}} for c in commits],
        contributors_list
    )
    
    # Community
    com_metrics = calculate_community_metrics(
        [{"comments": issue.comments_count, "state": issue.state} for issue in issues],
        [{"user": {"login": pr.creator_username}} for pr in prs],
        "## Welcome",
        repo.stars,
        repo.forks
    )
    
    # Forecasts (12 weeks)
    weekly_counts = v_metrics.get("weekly_commit_counts", [5, 6, 8, 4, 10, 12, 11, 8])
    current_health = latest_score.overall_score if latest_score else 50.0
    forecasts = forecast_repository_metrics(weekly_counts, current_health)

    # Score history
    history = db.query(HealthScore).filter(HealthScore.repository_id == repo.id).order_by(HealthScore.date.asc()).all()
    score_history = [{
        "date": h.date,
        "overall_score": h.overall_score,
        "activity_score": h.activity_score,
        "community_score": h.community_score,
        "security_score": h.security_score,
        "sustainability_score": h.sustainability_score,
        "maintainability_score": h.maintainability_score
    } for h in history]

    return {
        "id": repo.id,
        "name": repo.name,
        "full_name": repo.full_name,
        "description": repo.description,
        "stars": repo.stars,
        "forks": repo.forks,
        "watchers": repo.watchers,
        "open_issues": repo.open_issues,
        "language": repo.language,
        "url": repo.url,
        "last_scanned_at": repo.last_scanned_at,
        "scores": {
            "overall_score": latest_score.overall_score if latest_score else 0.0,
            "activity_score": latest_score.activity_score if latest_score else 0.0,
            "community_score": latest_score.community_score if latest_score else 0.0,
            "security_score": latest_score.security_score if latest_score else 0.0,
            "sustainability_score": latest_score.sustainability_score if latest_score else 0.0,
            "maintainability_score": latest_score.maintainability_score if latest_score else 0.0,
            "confidence_interval_low": latest_score.confidence_interval_low if latest_score else 0.0,
            "confidence_interval_high": latest_score.confidence_interval_high if latest_score else 0.0,
        } if latest_score else None,
        "score_history": score_history,
        "alerts": [{
            "id": a.id,
            "type": a.type,
            "severity": a.severity,
            "message": a.message,
            "description": a.description,
            "recommendation": a.recommendation,
            "created_at": a.created_at
        } for a in alerts],
        "contributor_metrics": c_metrics,
        "velocity_metrics": v_metrics,
        "dependencies": dependencies_list,
        "community_metrics": com_metrics,
        "network_metrics": net_metrics,
        "forecasts": forecasts
    }

@router.post("/compare")
def compare_repositories(
    payload: CompareRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Compares selected repositories side-by-side.
    """
    repos_data = []
    for r_id in payload.repository_ids:
        repo_details = get_repository_details(r_id, db, current_user)
        repos_data.append(repo_details)
        
    return compare_repositories_data(repos_data)
