import logging
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from backend.app.config import settings
from backend.app.database.session import engine, Base, SessionLocal
from backend.app.database.models import Role, User
from backend.app.auth.auth import get_password_hash
from backend.app.scheduler.tasks import start_scheduler
from backend.app.routes import auth, repositories, dashboard

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup actions
    logger.info("Initializing database schemas...")
    # Auto-create tables if they don't exist
    Base.metadata.create_all(bind=engine)
    
    # Seed roles and admin user
    seed_database()
    
    # Start APScheduler tasks
    try:
        start_scheduler()
    except Exception as e:
        logger.error(f"Failed to start APScheduler: {str(e)}")
        
    yield
    # Shutdown actions (scheduler shutdown is handled automatically, but can be added here)
    logger.info("Application shutting down.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

# CORS Middleware setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict to React Vite app domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(repositories.router, prefix=settings.API_V1_STR)
app.include_router(dashboard.router, prefix=settings.API_V1_STR)

@app.get("/")
def read_root():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "api_docs_path": "/docs"
    }

def seed_database():
    """Seeds default roles and admin credentials into database if not present."""
    db = SessionLocal()
    try:
        # 1. Seed Roles
        role_names = ["Admin", "Analyst", "Security Engineer", "Executive Viewer"]
        db_roles = {}
        for r_name in role_names:
            role = db.query(Role).filter(Role.name == r_name).first()
            if not role:
                role = Role(name=r_name, description=f"Default system {r_name} role")
                db.add(role)
                db.flush()
                logger.info(f"Seeded role: {r_name}")
            db_roles[r_name] = role
            
        # 2. Seed Admin User
        admin_uname = settings.DEFAULT_ADMIN_USERNAME
        admin = db.query(User).filter(User.username == admin_uname).first()
        if not admin:
            hashed_pwd = get_password_hash(settings.DEFAULT_ADMIN_PASSWORD)
            admin = User(
                username=admin_uname,
                email="admin@ecosystemintelligence.com",
                password_hash=hashed_pwd,
                roles=[db_roles["Admin"]]
            )
            db.add(admin)
            db.commit()
            logger.info(f"Seeded admin user: {admin_uname} with role Admin")
        else:
            db.commit()
    except Exception as e:
        db.rollback()
        logger.error(f"Error seeding database: {str(e)}")
    finally:
        db.close()
