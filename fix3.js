const fs = require('fs');
let c = fs.readFileSync('api/index.py', 'utf8');
const oldText = c.substring(c.indexOf('def init_db_if_needed():'), c.indexOf('_db_initialized = True', c.indexOf('def init_db_if_needed():')) + 22);

const newText = `def init_db_if_needed():
    global _db_initialized
    if not _db_initialized:
        try:
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
        except Exception as e:
            print("DB Init Error:", e)
        _db_initialized = True`;

if(oldText.length > 50) {
  c = c.replace(oldText, newText);
  if(!c.includes('def debug_db():')) {
    c = c.replace('@app.post("/api/login")', `@app.get("/api/debug-db")
def debug_db():
    try:
        with engine.connect() as conn:
            import sqlalchemy
            result = conn.execute(sqlalchemy.text("SELECT 1")).fetchone()
            return {"status": "connected", "result": result[0], "url": str(SQLALCHEMY_DATABASE_URL)[:20]}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.post("/api/login")`);
  }
  fs.writeFileSync('api/index.py', c);
  console.log('Fixed api/index.py');
} else {
  console.log('Could not find old text');
}
