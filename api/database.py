from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker
import os

db_url = os.environ.get("POSTGRES_URL") or os.environ.get("DATABASE_URL")
if db_url:
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)
    if "sslmode=require" not in db_url and "supabase" not in db_url:
        db_url += "?sslmode=require" if "?" not in db_url else "&sslmode=require"
    SQLALCHEMY_DATABASE_URL = db_url
else:
    sqlite_path = "/tmp/crm.db" if os.getenv("VERCEL") else "./crm.db"
    SQLALCHEMY_DATABASE_URL = f"sqlite:///{sqlite_path}"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    connect_args={"check_same_thread": False} if SQLALCHEMY_DATABASE_URL.startswith("sqlite") else {}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
