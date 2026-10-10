const fs = require('fs');

let c = fs.readFileSync('api/index.py', 'utf8');

c = c.replace('from database import engine, get_db', 'from database import engine, get_db, SQLALCHEMY_DATABASE_URL, SessionLocal');

const oldInit = `def init_db_if_needed():
    global _db_initialized
    if not _db_initialized:
        models.Base.metadata.create_all(bind=engine)
        try:
            seed.seed()
        except Exception as e:
            print("Seed error:", e)
        db = SessionLocal()
        try:
            if not crud.get_admin(db, "admin"):
                crud.create_admin(db, "admin", "admin123")
        except Exception as e:
            print("Admin create error:", e)
        finally:
            db.close()
        _db_initialized = True`;

const newInit = `def init_db_if_needed():
    global _db_initialized
    if not _db_initialized:
        try:
            models.Base.metadata.create_all(bind=engine)
            seed.seed()
            db = SessionLocal()
            try:
                if not crud.get_admin(db, "admin"):
                    crud.create_admin(db, "admin", "admin123")
            finally:
                db.close()
        except Exception as e:
            print("DB Init Error:", e)
        _db_initialized = True`;

c = c.replace(oldInit, newInit);

if (!c.includes('def debug_db():')) {
  c = c.replace('@app.put("/api/settings/password")', `@app.get("/api/debug-db")
def debug_db():
    try:
        with engine.connect() as conn:
            import sqlalchemy
            result = conn.execute(sqlalchemy.text("SELECT 1")).fetchone()
            return {"status": "connected", "result": result[0], "url": SQLALCHEMY_DATABASE_URL[:20] + "..."}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.put("/api/settings/password")`);
}

fs.writeFileSync('api/index.py', c);
console.log('done');
