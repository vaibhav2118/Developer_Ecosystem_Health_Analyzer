from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
import os

from backend.app.database.session import get_db
from backend.app.database.models import (
    Repository, HealthScore, Dependency, Vulnerability, RiskAlert, Report, User, AuditLog
)
from backend.app.auth.auth import get_current_user, RoleChecker
from backend.app.reports.generator import generate_pdf_report
from backend.app.routes.repositories import get_repository_details

router = APIRouter(tags=["dashboard"])

class CreateReportRequest(BaseModel):
    repository_id: int
    name: str

# Role checks
admin_only = Depends(RoleChecker(["Admin"]))
analyst_or_above = Depends(RoleChecker(["Admin", "Analyst"]))
viewer_or_above = Depends(RoleChecker(["Admin", "Analyst", "Security Engineer", "Executive Viewer"]))

@router.get("/dashboard")
def get_dashboard_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns aggregated ecosystem metrics (total repositories, stars, alerts, and average health score).
    """
    total_repos = db.query(Repository).count()
    total_stars = db.query(Repository).with_entities(Repository.stars).all()
    stars_sum = sum(s[0] for s in total_stars) if total_stars else 0
    
    total_forks = db.query(Repository).with_entities(Repository.forks).all()
    forks_sum = sum(f[0] for f in total_forks) if total_forks else 0
    
    active_alerts = db.query(RiskAlert).filter(RiskAlert.is_resolved == False).count()
    
    # Calculate average health score across all repositories
    scores_query = db.query(HealthScore).distinct(HealthScore.repository_id).order_by(HealthScore.repository_id, HealthScore.date.desc()).all()
    overall_sum = sum(s.overall_score for s in scores_query)
    overall_avg = overall_sum / len(scores_query) if scores_query else 0.0
    
    # Repository health categorization
    repo_list = db.query(Repository).all()
    health_distribution = {"high": 0, "medium": 0, "low": 0}
    for r in repo_list:
        latest = db.query(HealthScore).filter(HealthScore.repository_id == r.id).order_by(HealthScore.date.desc()).first()
        if latest:
            if latest.overall_score >= 75:
                health_distribution["high"] += 1
            elif latest.overall_score >= 50:
                health_distribution["medium"] += 1
            else:
                health_distribution["low"] += 1
        else:
            health_distribution["medium"] += 1

    # Fetch recent audit logs for the dashboard dashboard
    recent_audits = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(10).all()
    audits_data = [{
        "id": a.id,
        "username": a.username or "system",
        "action": a.action,
        "target_type": a.target_type,
        "details": a.details,
        "created_at": a.created_at
    } for a in recent_audits]

    return {
        "total_repositories": total_repos,
        "total_stars": stars_sum,
        "total_forks": forks_sum,
        "active_alerts": active_alerts,
        "average_health_score": round(overall_avg, 1),
        "health_distribution": health_distribution,
        "recent_activity": audits_data
    }

@router.get("/alerts")
def get_all_alerts(
    severity: Optional[str] = None,
    type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns list of all active repository alerts.
    """
    query = db.query(RiskAlert).filter(RiskAlert.is_resolved == False)
    if severity:
        query = query.filter(RiskAlert.severity == severity.capitalize())
    if type:
        query = query.filter(RiskAlert.type == type)
        
    alerts = query.all()
    results = []
    for a in alerts:
        repo = db.query(Repository).filter(Repository.id == a.repository_id).first()
        results.append({
            "id": a.id,
            "repository_id": a.repository_id,
            "repository_name": repo.full_name if repo else "unknown",
            "type": a.type,
            "severity": a.severity,
            "message": a.message,
            "description": a.description,
            "recommendation": a.recommendation,
            "created_at": a.created_at
        })
    return results

@router.get("/reports")
def list_reports(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lists generated reports.
    """
    reports = db.query(Report).order_by(Report.created_at.desc()).all()
    results = []
    for r in reports:
        repo = db.query(Repository).filter(Repository.id == r.repository_id).first()
        results.append({
            "id": r.id,
            "repository_name": repo.full_name if repo else "unknown",
            "name": r.name,
            "type": r.type,
            "status": r.status,
            "created_at": r.created_at
        })
    return results

@router.post("/reports")
def create_report(
    payload: CreateReportRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Generates a new PDF report.
    """
    repo = db.query(Repository).filter(Repository.id == payload.repository_id).first()
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")
        
    # Get all details to pass to generator
    details = get_repository_details(repo.id, db, current_user)
    
    # Setup output file path
    filename = f"report_{repo.name}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.pdf"
    output_dir = os.path.join(os.getcwd(), "artifacts", "reports")
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, filename)
    
    # Save Report record in DB
    report_record = Report(
        repository_id=repo.id,
        name=payload.name,
        type="pdf",
        status="pending",
        file_path=output_path
    )
    db.add(report_record)
    db.flush()
    
    try:
        generate_pdf_report(
            repo_name=repo.full_name,
            scores=details["scores"] or {"overall_score": 50},
            contributor_metrics=details["contributor_metrics"],
            velocity_metrics=details["velocity_metrics"],
            dependency_metrics=details["dependencies"],
            risk_alerts=details["alerts"],
            output_path=output_path
        )
        report_record.status = "completed"
        db.commit()
    except Exception as e:
        report_record.status = "failed"
        db.commit()
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {str(e)}")
        
    return {
        "message": "Report generated successfully",
        "report_id": report_record.id,
        "name": report_record.name,
        "status": "completed"
    }

@router.get("/reports/download/{id}")
def download_report(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Downloads the compiled PDF file.
    """
    report = db.query(Report).filter(Report.id == id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report record not found")
        
    if report.status != "completed" or not report.file_path or not os.path.exists(report.file_path):
        raise HTTPException(status_code=400, detail="Report file not available")
        
    return FileResponse(
        path=report.file_path,
        filename=os.path.basename(report.file_path),
        media_type="application/pdf"
    )

@router.get("/audit-logs")
def get_audit_logs(
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["Admin", "Analyst"]))
):
    """
    Returns the complete system audit logs (Admin and Analyst role only).
    """
    logs = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(100).all()
    return [{
        "id": l.id,
        "user_id": l.user_id,
        "username": l.username or "system",
        "action": l.action,
        "target_type": l.target_type,
        "target_id": l.target_id,
        "details": l.details,
        "ip_address": l.ip_address,
        "created_at": l.created_at
    } for l in logs]
