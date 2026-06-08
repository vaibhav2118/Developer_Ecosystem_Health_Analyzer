from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Table, Text, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.app.database.session import Base

# Association table for User-Role (if many-to-many is desired, or just many-to-one. Let's do a many-to-many to be robust)
user_roles = Table(
    "user_roles",
    Base.metadata,
    Column("user_id", Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    Column("role_id", Integer, ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True),
)

# Association table for Repository-Contributor
repository_contributors = Table(
    "repository_contributors",
    Base.metadata,
    Column("repository_id", Integer, ForeignKey("repositories.id", ondelete="CASCADE"), primary_key=True),
    Column("contributor_id", Integer, ForeignKey("contributors.id", ondelete="CASCADE"), primary_key=True),
    Column("commits_count", Integer, default=0),
    Column("additions", Integer, default=0),
    Column("deletions", Integer, default=0),
)

class Role(Base):
    __tablename__ = "roles"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False, index=True)  # Admin, Analyst, Security Engineer, Executive Viewer
    description = Column(String(255), nullable=True)

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    email = Column(String(100), unique=True, nullable=True, index=True)
    password_hash = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    roles = relationship("Role", secondary=user_roles, backref="users")
    audit_logs = relationship("AuditLog", back_populates="user")

class Organization(Base):
    __tablename__ = "organizations"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    github_id = Column(Integer, unique=True, nullable=True)
    avatar_url = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    repositories = relationship("Repository", back_populates="organization", cascade="all, delete-orphan")

class Repository(Base):
    __tablename__ = "repositories"
    
    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="SET NULL"), nullable=True)
    name = Column(String(100), nullable=False)
    full_name = Column(String(200), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    url = Column(String(255), nullable=True)
    stars = Column(Integer, default=0)
    forks = Column(Integer, default=0)
    watchers = Column(Integer, default=0)
    open_issues = Column(Integer, default=0)
    language = Column(String(50), nullable=True)
    last_scanned_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    organization = relationship("Organization", back_populates="repositories")
    contributors = relationship("Contributor", secondary=repository_contributors, backref="repositories")
    commits = relationship("Commit", back_populates="repository", cascade="all, delete-orphan")
    pull_requests = relationship("PullRequest", back_populates="repository", cascade="all, delete-orphan")
    issues = relationship("Issue", back_populates="repository", cascade="all, delete-orphan")
    dependencies = relationship("Dependency", back_populates="repository", cascade="all, delete-orphan")
    health_scores = relationship("HealthScore", back_populates="repository", cascade="all, delete-orphan")
    risk_alerts = relationship("RiskAlert", back_populates="repository", cascade="all, delete-orphan")
    scheduled_scans = relationship("ScheduledScan", back_populates="repository", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="repository", cascade="all, delete-orphan")

class Contributor(Base):
    __tablename__ = "contributors"
    
    id = Column(Integer, primary_key=True, index=True)
    github_id = Column(Integer, unique=True, nullable=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    email = Column(String(100), nullable=True)
    avatar_url = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Commit(Base):
    __tablename__ = "commits"
    
    id = Column(Integer, primary_key=True, index=True)
    repository_id = Column(Integer, ForeignKey("repositories.id", ondelete="CASCADE"), nullable=False)
    sha = Column(String(100), unique=True, nullable=False, index=True)
    author_username = Column(String(100), nullable=True)
    author_email = Column(String(100), nullable=True)
    date = Column(DateTime, nullable=False)
    message = Column(Text, nullable=True)
    additions = Column(Integer, default=0)
    deletions = Column(Integer, default=0)
    
    repository = relationship("Repository", back_populates="commits")

class PullRequest(Base):
    __tablename__ = "pull_requests"
    
    id = Column(Integer, primary_key=True, index=True)
    repository_id = Column(Integer, ForeignKey("repositories.id", ondelete="CASCADE"), nullable=False)
    number = Column(Integer, nullable=False)
    title = Column(String(255), nullable=False)
    state = Column(String(50), default="open") # open, closed, merged
    creator_username = Column(String(100), nullable=False)
    created_at = Column(DateTime, nullable=False)
    closed_at = Column(DateTime, nullable=True)
    merged_at = Column(DateTime, nullable=True)
    comments_count = Column(Integer, default=0)
    review_comments_count = Column(Integer, default=0)
    review_time_hours = Column(Float, nullable=True)
    merge_time_hours = Column(Float, nullable=True)
    
    repository = relationship("Repository", back_populates="pull_requests")

class Issue(Base):
    __tablename__ = "issues"
    
    id = Column(Integer, primary_key=True, index=True)
    repository_id = Column(Integer, ForeignKey("repositories.id", ondelete="CASCADE"), nullable=False)
    number = Column(Integer, nullable=False)
    title = Column(String(255), nullable=False)
    state = Column(String(50), default="open") # open, closed
    creator_username = Column(String(100), nullable=False)
    created_at = Column(DateTime, nullable=False)
    closed_at = Column(DateTime, nullable=True)
    comments_count = Column(Integer, default=0)
    first_response_time_hours = Column(Float, nullable=True)
    resolution_time_hours = Column(Float, nullable=True)
    
    repository = relationship("Repository", back_populates="issues")

class Dependency(Base):
    __tablename__ = "dependencies"
    
    id = Column(Integer, primary_key=True, index=True)
    repository_id = Column(Integer, ForeignKey("repositories.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(150), nullable=False, index=True)
    version = Column(String(50), nullable=False)
    file_path = Column(String(255), nullable=False) # e.g. requirements.txt, package.json
    type = Column(String(50), nullable=False) # python, npm, maven, go
    latest_version = Column(String(50), nullable=True)
    release_date = Column(DateTime, nullable=True)
    age_days = Column(Integer, nullable=True)
    popularity = Column(Integer, nullable=True) # stars or downloads
    maintenance_activity = Column(String(50), nullable=True) # active, inactive
    staleness_score = Column(Float, default=0.0) # 0 to 100
    vulnerability_score = Column(Float, default=0.0) # 0 to 100
    license = Column(String(100), nullable=True)
    
    repository = relationship("Repository", back_populates="dependencies")
    vulnerabilities = relationship("Vulnerability", back_populates="dependency", cascade="all, delete-orphan")

class Vulnerability(Base):
    __tablename__ = "vulnerabilities"
    
    id = Column(Integer, primary_key=True, index=True)
    dependency_id = Column(Integer, ForeignKey("dependencies.id", ondelete="CASCADE"), nullable=False)
    osv_id = Column(String(100), nullable=False, index=True)
    title = Column(String(255), nullable=True)
    summary = Column(Text, nullable=True)
    details = Column(Text, nullable=True)
    severity = Column(String(50), default="UNKNOWN")  # LOW, MEDIUM, HIGH, CRITICAL, UNKNOWN
    cvss_score = Column(Float, nullable=True)
    fixed_in = Column(String(50), nullable=True)
    affected_versions = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    dependency = relationship("Dependency", back_populates="vulnerabilities")

class HealthScore(Base):
    __tablename__ = "health_scores"
    
    id = Column(Integer, primary_key=True, index=True)
    repository_id = Column(Integer, ForeignKey("repositories.id", ondelete="CASCADE"), nullable=False)
    date = Column(DateTime, default=datetime.utcnow, index=True)
    overall_score = Column(Float, nullable=False)
    activity_score = Column(Float, nullable=False)
    community_score = Column(Float, nullable=False)
    security_score = Column(Float, nullable=False)
    sustainability_score = Column(Float, nullable=False)
    maintainability_score = Column(Float, nullable=False)
    confidence_interval_low = Column(Float, nullable=True)
    confidence_interval_high = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    repository = relationship("Repository", back_populates="health_scores")

class RiskAlert(Base):
    __tablename__ = "risk_alerts"
    
    id = Column(Integer, primary_key=True, index=True)
    repository_id = Column(Integer, ForeignKey("repositories.id", ondelete="CASCADE"), nullable=False)
    type = Column(String(50), nullable=False)  # contributor_departure, dependency, security, maintenance, bus_factor
    severity = Column(String(50), nullable=False)  # Info, Low, Medium, High, Critical
    message = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    recommendation = Column(Text, nullable=True)
    is_resolved = Column(Boolean, default=False)
    resolved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    repository = relationship("Repository", back_populates="risk_alerts")

class ScheduledScan(Base):
    __tablename__ = "scheduled_scans"
    
    id = Column(Integer, primary_key=True, index=True)
    repository_id = Column(Integer, ForeignKey("repositories.id", ondelete="CASCADE"), nullable=False)
    frequency = Column(String(50), nullable=False)  # daily, weekly, monthly
    last_run = Column(DateTime, nullable=True)
    next_run = Column(DateTime, nullable=True)
    status = Column(String(50), default="pending")  # pending, running, completed, failed
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    repository = relationship("Repository", back_populates="scheduled_scans")

class Report(Base):
    __tablename__ = "reports"
    
    id = Column(Integer, primary_key=True, index=True)
    repository_id = Column(Integer, ForeignKey("repositories.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    type = Column(String(50), nullable=False)  # pdf, html
    status = Column(String(50), default="pending")  # pending, completed, failed
    file_path = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    repository = relationship("Repository", back_populates="reports")

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    username = Column(String(100), nullable=True)
    action = Column(String(100), nullable=False)
    target_type = Column(String(50), nullable=True)
    target_id = Column(String(50), nullable=True)
    details = Column(Text, nullable=True)
    ip_address = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="audit_logs")
