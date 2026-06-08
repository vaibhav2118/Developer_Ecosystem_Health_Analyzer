from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from backend.app.config import settings

# Create engine
# Attempt PostgreSQL connection; fall back to local SQLite if it fails
db_url = settings.DATABASE_URL
try:
    if "postgresql" in db_url:
        # Test connection with a short timeout (2s)
        test_engine = create_engine(db_url, pool_pre_ping=True, connect_args={"connect_timeout": 2})
        with test_engine.connect() as conn:
            pass
        engine = test_engine
    else:
        engine = create_engine(db_url, pool_pre_ping=True)
except Exception:
    import sys
    print("PostgreSQL connection failed. Falling back to local SQLite database: sqlite:///./ecosystem_intel.db", file=sys.stderr)
    db_url = "sqlite:///./ecosystem_intel.db"
    engine = create_engine(
        db_url, 
        connect_args={"check_same_thread": False}
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Dependency to get db session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
