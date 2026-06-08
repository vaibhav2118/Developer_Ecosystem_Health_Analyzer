from typing import Dict, Any, List

def evaluate_repository_risks(
    contributor_metrics: Dict[str, Any],
    velocity_metrics: Dict[str, Any],
    dependency_metrics: List[Dict[str, Any]],
    community_metrics: Dict[str, Any],
    overall_health: float
) -> List[Dict[str, Any]]:
    """
    Evaluates repository metrics and automatically raises risk alerts.
    Risk types: contributor_departure, dependency, security, maintenance, bus_factor
    Severities: Info, Low, Medium, High, Critical
    """
    alerts = []

    # 1. Bus Factor Risk
    bus_factor = contributor_metrics.get("bus_factor", 1)
    if bus_factor <= 1:
        alerts.append({
            "type": "bus_factor",
            "severity": "Critical",
            "message": "Critical Bus Factor risk detected.",
            "description": "A single contributor account represents over 50% of the repository's commit activity. If this individual leaves, the project's sustainability will be severely compromised.",
            "recommendation": "Onboard additional core maintainers, document processes, and distribute code reviews to reduce key person dependency."
        })
    elif bus_factor <= 2:
        alerts.append({
            "type": "bus_factor",
            "severity": "High",
            "message": "High Bus Factor vulnerability.",
            "description": "Two contributors represent the vast majority of project commits, exposing the codebase to transition risks.",
            "recommendation": "Promote active external contributors to maintainers and set up structured pairing sessions."
        })

    # 2. Security Risk (Vulnerabilities found)
    has_critical_vuln = False
    has_high_vuln = False
    vuln_count = 0
    
    for dep in dependency_metrics:
        # Check if the mock/live dependency has positive vulnerability scores or matching vulnerabilities
        # Let's count them
        vuln_score = dep.get("vulnerability_score", 0.0)
        if vuln_score >= 20.0:
            has_critical_vuln = True
            vuln_count += 1
        elif vuln_score >= 10.0:
            has_high_vuln = True
            vuln_count += 1
        elif vuln_score > 0.0:
            vuln_count += 1
            
    if has_critical_vuln:
        alerts.append({
            "type": "security",
            "severity": "Critical",
            "message": f"Critical security vulnerabilities detected ({vuln_count} package risks).",
            "description": "Dependencies mapped to this repository are flagged with active, high-exploit CVE entries in the OSV database.",
            "recommendation": "Immediately update the affected packages (e.g. bump minimist or lodash) and run audit verification pipelines."
        })
    elif has_high_vuln:
        alerts.append({
            "type": "security",
            "severity": "High",
            "message": f"High security vulnerability in repository dependencies.",
            "description": "Outdated packages contain known security vulnerabilities that could compromise the runtime environment.",
            "recommendation": "Review dependency logs, execute npm audit or pip-audit, and patch to the fixed version."
        })

    # 3. Dependency Risk (Staleness score)
    total_staleness = sum(d.get("staleness_score", 0.0) for d in dependency_metrics)
    avg_staleness = total_staleness / len(dependency_metrics) if dependency_metrics else 0.0
    
    if avg_staleness > 50.0:
        alerts.append({
            "type": "dependency",
            "severity": "Medium",
            "message": "Highly outdated dependency manifests.",
            "description": f"The project's dependency manifest has an average staleness score of {round(avg_staleness, 1)}%. Multiple libraries are several major versions behind.",
            "recommendation": "Schedule dependency upgrades in your upcoming sprint. Implement automated lockfile upgrade tools like Dependabot."
        })

    # 4. Inactive Maintenance / Churn Risks
    churn = contributor_metrics.get("churn_rate", 0.0)
    retention = contributor_metrics.get("retention_rate", 100.0)
    slope = velocity_metrics.get("commit_frequency_trend_slope", 0.0)
    
    if churn > 0.35:
        alerts.append({
            "type": "contributor_departure",
            "severity": "High",
            "message": f"Elevated contributor churn rate ({int(churn * 100)}%).",
            "description": "More contributors are departing or becoming inactive than joining the repository, which points to community attrition.",
            "recommendation": "Reach out to departing contributors for feedback, simplify local environment setups, and triage issues to retain developers."
        })
        
    if slope < -2.0:
        alerts.append({
            "type": "maintenance",
            "severity": "Medium",
            "message": "Decline in commit velocity detected.",
            "description": "Weekly commits have dropped significantly over the past 8 weeks, suggesting a potential maintenance slowdown.",
            "recommendation": "Review open PRs backlog and assign triage managers to unblock contributors."
        })

    # 5. General Low Health Score Alert
    if overall_health < 50.0:
        alerts.append({
            "type": "maintenance",
            "severity": "High",
            "message": "Repository health falls below acceptable threshold.",
            "description": f"The aggregated project health score has dropped to {overall_health}, indicating multi-dimensional risks across sustainability and maintenance.",
            "recommendation": "Execute an OSPO review, audit dependencies, and ensure the core team allocates dedicated maintenance hours."
        })

    return alerts
