import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import models, schemas, crud
from database import engine, get_db, SQLALCHEMY_DATABASE_URL, SessionLocal
import seed

app = FastAPI(title="CRM API")

_db_initialized = False
def init_db_if_needed():
    global _db_initialized
    if not _db_initialized:
        try:
            # Fast path for serverless cold starts: check if schema v5 is already initialized
            db_check = SessionLocal()
            try:
                if crud.get_admin(db_check, "__schema_v5_ready__"):
                    _db_initialized = True
                    return
            except Exception:
                pass
            finally:
                db_check.close()

            # Ensure columns exist in DB
            try:
                import sqlalchemy
                ddl_statements = [
                    "ALTER TABLE instructors ADD COLUMN IF NOT EXISTS rate_per_lesson INTEGER DEFAULT 0;",
                    "ALTER TABLE instructors ADD COLUMN IF NOT EXISTS custom_month_lessons INTEGER;",
                    "ALTER TABLE instructors ADD COLUMN IF NOT EXISTS status VARCHAR DEFAULT 'Ակտիվ';",
                    "ALTER TABLE instructors ADD COLUMN IF NOT EXISTS is_deleted INTEGER DEFAULT 0;",
                    "ALTER TABLE instructors ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;",
                    "ALTER TABLE courses ADD COLUMN IF NOT EXISTS total_lessons INTEGER DEFAULT 0;",
                    "ALTER TABLE courses ADD COLUMN IF NOT EXISTS status VARCHAR DEFAULT 'Ակտիվ';",
                    "ALTER TABLE courses ADD COLUMN IF NOT EXISTS is_deleted INTEGER DEFAULT 0;",
                    "ALTER TABLE courses ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;",
                    "ALTER TABLE groups ADD COLUMN IF NOT EXISTS conducted_lessons INTEGER DEFAULT 0;",
                    "ALTER TABLE groups ADD COLUMN IF NOT EXISTS last_lesson_date VARCHAR;",
                    "ALTER TABLE groups ADD COLUMN IF NOT EXISTS status VARCHAR DEFAULT 'Ակտիվ';",
                    "ALTER TABLE groups ADD COLUMN IF NOT EXISTS is_deleted INTEGER DEFAULT 0;",
                    "ALTER TABLE groups ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;",
                    "ALTER TABLE students ADD COLUMN IF NOT EXISTS course_format VARCHAR DEFAULT 'Օֆլայն';",
                    "ALTER TABLE students ADD COLUMN IF NOT EXISTS social_link VARCHAR;",
                    "ALTER TABLE students ADD COLUMN IF NOT EXISTS preferred_schedule VARCHAR;",
                    "ALTER TABLE students ADD COLUMN IF NOT EXISTS preferred_time VARCHAR;",
                    "ALTER TABLE students ADD COLUMN IF NOT EXISTS custom_lessons_attended INTEGER;",
                    "ALTER TABLE students ADD COLUMN IF NOT EXISTS is_deleted INTEGER DEFAULT 0;",
                    "ALTER TABLE students ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;",
                    "ALTER TABLE payments ADD COLUMN IF NOT EXISTS status VARCHAR DEFAULT 'Ակտիվ';",
                    "ALTER TABLE payments ADD COLUMN IF NOT EXISTS is_deleted INTEGER DEFAULT 0;",
                    "ALTER TABLE payments ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;",
                    "ALTER TABLE group_student ADD COLUMN IF NOT EXISTS initial_lessons INTEGER DEFAULT 0;",
                    "ALTER TABLE group_student ADD COLUMN IF NOT EXISTS joined_at TIMESTAMP;",
                    "ALTER TABLE group_lessons ADD COLUMN IF NOT EXISTS instructor_id INTEGER;",
                    "CREATE INDEX IF NOT EXISTS idx_students_del_status ON students (is_deleted, status);",
                    "CREATE INDEX IF NOT EXISTS idx_payments_student_del ON payments (student_id, is_deleted);",
                    "CREATE INDEX IF NOT EXISTS idx_group_student_sid ON group_student (student_id);",
                    "CREATE INDEX IF NOT EXISTS idx_group_student_gid ON group_student (group_id);",
                    "CREATE INDEX IF NOT EXISTS idx_groups_del_status ON groups (is_deleted, status);",
                    "CREATE INDEX IF NOT EXISTS idx_group_hist_gid ON group_instructor_history (group_id);",
                    "CREATE INDEX IF NOT EXISTS idx_group_hist_iid ON group_instructor_history (instructor_id);",
                    "CREATE INDEX IF NOT EXISTS idx_lesson_hist_entity ON lesson_edit_history (entity_type, entity_id);",
                ]
                with engine.connect() as conn:
                    for col_sql in ddl_statements:
                        try:
                            conn.execute(sqlalchemy.text(col_sql))
                            conn.commit()
                        except Exception:
                            conn.rollback()
                            if "IF NOT EXISTS" in col_sql:
                                try:
                                    fallback_sql = col_sql.replace("IF NOT EXISTS ", "")
                                    conn.execute(sqlalchemy.text(fallback_sql))
                                    conn.commit()
                                except Exception:
                                    conn.rollback()
            except Exception as me:
                print("Column add error:", me)

            models.Base.metadata.create_all(bind=engine)
            try:
                seed.seed()
            except Exception as e:
                print("Seed error:", e)
            db = SessionLocal()
            try:
                if not crud.get_admin(db, "admin"):
                    crud.create_admin(db, "admin", "admin123")
                # Normalize legacy student statuses without touching "Անորոշ"
                try:
                    db.query(models.Student).filter(models.Student.status.ilike("%ընթացիկ%")).update({models.Student.status: "Ընթացիկ"}, synchronize_session=False)
                    db.query(models.Student).filter(models.Student.status.ilike("%ավարտ%")).update({models.Student.status: "Արխիվ"}, synchronize_session=False)
                    db.query(models.Student).filter(
                        models.Student.status.ilike("%նոր%"),
                        ~models.Student.status.ilike("%անորոշ%")
                    ).update({models.Student.status: "Նոր"}, synchronize_session=False)
                    db.query(models.Group).update({models.Group.name: ""}, synchronize_session=False)
                    # Normalize empty string emails to None
                    db.query(models.Student).filter(models.Student.email == "").update({models.Student.email: None}, synchronize_session=False)
                    # Populate sample urgent notes & preferences once if none exist yet
                    has_urgent = db.query(models.Student).filter(
                        models.Student.urgent_notes != None,
                        models.Student.urgent_notes != ""
                    ).count()
                    if has_urgent == 0:
                        recent_sts = db.query(models.Student).order_by(models.Student.id.desc()).limit(8).all()
                        sample_urgent = [
                            ("Follow Up tomorrow", "Ցանկանում է միանալ երեկոյան խմբին", "https://instagram.com/lilia_mkh", "Երկ, Չոր", "18:30 - 20:30"),
                            ("Զանգահարել երկուշաբթի ժամը 14:00", "Հետաքրքրված է եկամտային հարկի վերադարձով", "https://facebook.com/arman.qocharyan", "Երեք, Հինգ", "19:00 - 21:00"),
                            ("Սպասում է պայմանագրին", "Ուղարկել պայմանագրի օրինակը էլ․ փոստին", "https://t.me/monika_sed", "Երկ, Չոր", "11:00 - 13:00"),
                            ("Follow Up tomorrow", "Խնդրել է զանգահարել աշխատանքային ժամից հետո", "https://instagram.com/gagik_antonyan", "Երեք, Հինգ", "18:30 - 20:30"),
                        ]
                        for idx_u, st_u in enumerate(recent_sts[:len(sample_urgent)]):
                            u_note, c_note, s_link, p_sched, p_time = sample_urgent[idx_u]
                            st_u.urgent_notes = u_note
                            st_u.comment = c_note
                            st_u.social_link = s_link
                            st_u.preferred_schedule = p_sched
                            st_u.preferred_time = p_time

                    # One-time migration: 2 lessons per week & 8 lessons per monthly fee
                    if not crud.get_admin(db, "__migrated_8_lessons_2_days__"):
                        db.query(models.Group).filter(models.Group.days == "Երկ, Չոր, Ուրբ").update(
                            {models.Group.days: "Երկ., Չրք."}, synchronize_session=False
                        )
                        db.query(models.Group).filter(models.Group.days == "Երեք, Հինգ, Շաբ").update(
                            {models.Group.days: "Երք., Հնգ."}, synchronize_session=False
                        )
                        db.query(models.Student).filter(models.Student.preferred_schedule == "Երկ, Չոր, Ուրբ").update(
                            {models.Student.preferred_schedule: "Երկ, Չոր"}, synchronize_session=False
                        )
                        db.query(models.Student).filter(models.Student.preferred_schedule == "Երեք, Հինգ, Շաբ").update(
                            {models.Student.preferred_schedule: "Երեք, Հինգ"}, synchronize_session=False
                        )
                        db.query(models.Student).filter(
                            models.Student.status == "Արխիվ",
                            models.Student.custom_lessons_attended == 24
                        ).update(
                            {models.Student.custom_lessons_attended: 16}, synchronize_session=False
                        )
                        # Scale seeded groups' conducted_lessons from 12-lesson/month scale to 8-lesson/month scale
                        lesson_scale_map = {22: 14, 18: 12, 15: 10, 14: 10, 11: 7, 9: 6, 7: 5, 5: 4, 3: 2}
                        for grp_item in db.query(models.Group).all():
                            if grp_item.conducted_lessons in lesson_scale_map:
                                new_cond = lesson_scale_map[grp_item.conducted_lessons]
                                grp_item.conducted_lessons = new_cond
                                active_h = db.query(models.GroupInstructorHistory).filter(
                                    models.GroupInstructorHistory.group_id == grp_item.id,
                                    models.GroupInstructorHistory.unassigned_date == None
                                ).first()
                                if active_h:
                                    if (active_h.start_lesson or 0) > new_cond:
                                        active_h.start_lesson = max(0, new_cond - 4)
                                    active_h.lessons_taught = max(0, new_cond - (active_h.start_lesson or 0))
                        crud.create_admin(db, "__migrated_8_lessons_2_days__", "done")

                    # Remove Sunday ("Կիր." / "Կիրակի") from group days and student preferred schedules
                    db.query(models.Group).filter(models.Group.days.ilike("%Կիր%")).update(
                        {models.Group.days: "Հնգ., Շբթ."}, synchronize_session=False
                    )
                    db.query(models.Student).filter(models.Student.preferred_schedule.ilike("%Կիր%")).update(
                        {models.Student.preferred_schedule: "Հինգ, Շաբ"}, synchronize_session=False
                    )

                    if not crud.get_admin(db, "__schema_v5_ready__"):
                        crud.create_admin(db, "__schema_v5_ready__", "done")
                    db.commit()
                except Exception as ne:
                    print("Status normalize error:", ne)
            except Exception as e:
                print("Admin create error:", e)
            finally:
                db.close()
        except Exception as e:
            print("DB Init Error:", e)
        _db_initialized = True

# Allow requests from the frontend SPA and landing page
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this!
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def db_init_middleware(request, call_next):
    init_db_if_needed()
    response = await call_next(request)
    return response

@app.post("/api/login")
def login(req: schemas.LoginRequest, db: Session = Depends(get_db)):
    admin = crud.get_admin(db, req.username)
    if admin and admin.password == req.password:
        return {"token": "fake-jwt-token-123"}
    raise HTTPException(status_code=401, detail="Invalid credentials")

@app.get("/api/debug-db")
def debug_db():
    try:
        with engine.connect() as conn:
            import sqlalchemy
            result = conn.execute(sqlalchemy.text("SELECT 1")).fetchone()
            return {"status": "connected", "result": result[0], "url": SQLALCHEMY_DATABASE_URL[:20] + "..."}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.put("/api/settings/password")
def change_password(req: schemas.PasswordChange, db: Session = Depends(get_db)):
    admin = crud.get_admin(db, "admin")
    if admin and admin.password == req.current_password:
        crud.update_admin_password(db, "admin", req.new_password)
        return {"ok": True}
    raise HTTPException(status_code=400, detail="Invalid current password")

@app.get("/api/stats")
def get_stats(db: Session = Depends(get_db)):
    import datetime
    from sqlalchemy import func, or_
    non_deleted_student_filter = [
        or_(models.Student.is_deleted == 0, models.Student.is_deleted == None),
        or_(models.Student.status == None, ~models.Student.status.ilike("%ջնջված%"))
    ]
    students_count = db.query(models.Student).filter(*non_deleted_student_filter).count()
    courses_count = db.query(models.Course).filter(
        or_(models.Course.is_deleted == 0, models.Course.is_deleted == None),
        or_(models.Course.status == None, models.Course.status != "Ջնջված")
    ).count()
    instructors_count = db.query(models.Instructor).filter(
        or_(models.Instructor.is_deleted == 0, models.Instructor.is_deleted == None),
        or_(models.Instructor.status == None, models.Instructor.status != "Ջնջված")
    ).count()

    # Calculate expected monthly revenue only for active (non-archived, non-deleted) students, taking discount & gift_card into account
    active_students = db.query(models.Student).filter(
        *non_deleted_student_filter,
        or_(models.Student.status == None, models.Student.status.notin_(["Արխիվ", "Ավարտած", "Ջնջված"]))
    ).all()
    monthly_revenue = 0
    for st in active_students:
        fee = st.monthly_fee or 0
        disc = st.discount_percent or 0
        if disc > 0:
            fee = int(round(fee * (1 - disc / 100.0)))
        gc = st.gift_card or 0
        if gc > 0:
            fee = max(0, fee - gc)
        monthly_revenue += fee

    # Calculate actual payments received in the current calendar month
    today = datetime.date.today()
    first_of_month_dt = datetime.datetime(today.year, today.month, 1)
    actual_month_revenue = (
        db.query(func.sum(models.Payment.amount))
        .join(models.Student, models.Payment.student_id == models.Student.id)
        .filter(
            models.Payment.payment_date >= first_of_month_dt,
            or_(models.Payment.is_deleted == 0, models.Payment.is_deleted == None),
            or_(models.Payment.status == None, ~models.Payment.status.ilike("%ջնջված%")),
            *non_deleted_student_filter
        )
        .scalar() or 0
    )

    debts_info = crud.get_debtors(db)
    total_debt_amount = debts_info.get("total_debt_amount", 0)
    total_debtors = debts_info.get("total_debtors", 0)
    daily_trend = crud.get_monthly_student_trend(db, days_count=8)
    
    return {
        "total_students": students_count,
        "active_students": len(active_students),
        "active_courses": courses_count,
        "instructors": instructors_count,
        "monthly_revenue": monthly_revenue,
        "actual_month_revenue": actual_month_revenue,
        "total_debt_amount": total_debt_amount,
        "total_debtors": total_debtors,
        "daily_trend": daily_trend
    }

@app.post("/api/students", response_model=schemas.Student)
def create_student(student: schemas.StudentCreate, db: Session = Depends(get_db)):
    """Endpoint for landing page and CRM to create students"""
    clean_email = student.email.strip() if (student.email and student.email.strip()) else None
    if clean_email:
        db_student = crud.get_student_by_email(db, email=clean_email)
        if db_student:
            if getattr(db_student, 'is_deleted', 0) or (db_student.status and "ջնջված" in db_student.status.lower()):
                db_student.email = f"{db_student.email} (ջնջված #{db_student.id})"
                db.commit()
            else:
                raise HTTPException(status_code=400, detail="Email already registered")
    return crud.create_student(db=db, student=student)

from typing import Optional

@app.get("/api/students", response_model=schemas.PaginatedResponse[schemas.Student])
def read_students(
    skip: int = 0, 
    limit: int = 100, 
    search: Optional[str] = None,
    status: Optional[str] = None,
    course_direction: Optional[str] = None,
    group_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    return crud.get_students(
        db,
        skip=skip,
        limit=limit,
        search=search,
        status=status,
        course_direction=course_direction,
        group_id=group_id
    )

@app.get("/api/students/{student_id}", response_model=schemas.Student)
def read_student(student_id: int, db: Session = Depends(get_db)):
    student = crud.get_student(db, student_id=student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student

@app.delete("/api/students/{student_id}")
def delete_student(student_id: int, db: Session = Depends(get_db)):
    deleted = crud.delete_student(db, student_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Student not found")
    return {"ok": True}

@app.put("/api/students/{student_id}", response_model=schemas.Student)
def update_student(student_id: int, student: schemas.StudentUpdate, db: Session = Depends(get_db)):
    updated = crud.update_student(db, student_id, student)
    if not updated:
        raise HTTPException(status_code=404, detail="Student not found")
    return updated

@app.put("/api/students/{student_id}/groups/{group_id}", response_model=schemas.Student)
def update_student_group_offset_endpoint(
    student_id: int,
    group_id: int,
    payload: schemas.StudentGroupOffsetUpdate,
    db: Session = Depends(get_db)
):
    updated = crud.update_student_group_offset(
        db,
        student_id,
        group_id,
        initial_lessons=payload.initial_lessons,
        attended_lessons=payload.attended_lessons
    )
    if not updated:
        raise HTTPException(status_code=404, detail="Student-group link not found")
    return updated

@app.put("/api/students/{student_id}/lessons", response_model=schemas.Student)
def update_student_lessons_endpoint(
    student_id: int,
    payload: schemas.StudentGroupOffsetUpdate,
    db: Session = Depends(get_db)
):
    target = payload.attended_lessons if payload.attended_lessons is not None else (payload.initial_lessons or 0)
    updated = crud.update_student_total_lessons(db, student_id, target)
    if not updated:
        raise HTTPException(status_code=404, detail="Student not found")
    return updated

@app.get("/api/payments", response_model=list[schemas.Payment])
def read_payments(skip: int = 0, limit: int = 500, db: Session = Depends(get_db)):
    return crud.get_payments(db, skip=skip, limit=limit)

@app.post("/api/payments", response_model=schemas.Payment)
def create_payment(payment: schemas.PaymentCreate, db: Session = Depends(get_db)):
    return crud.create_payment(db=db, payment=payment)

@app.put("/api/payments/{payment_id}", response_model=schemas.Payment)
def update_payment(payment_id: int, payment: schemas.PaymentUpdate, db: Session = Depends(get_db)):
    updated = crud.update_payment(db, payment_id, payment)
    if not updated:
        raise HTTPException(status_code=404, detail="Payment not found")
    return updated

@app.delete("/api/payments/{payment_id}")
def delete_payment(payment_id: int, db: Session = Depends(get_db)):
    deleted = crud.delete_payment(db, payment_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Payment not found")
    return {"ok": True}


@app.post("/api/courses", response_model=schemas.Course)
def create_course(course: schemas.CourseCreate, db: Session = Depends(get_db)):
    return crud.create_course(db=db, course=course)

@app.get("/api/courses", response_model=list[schemas.Course])
def read_courses(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_courses(db, skip=skip, limit=limit)

@app.put("/api/courses/{course_id}", response_model=schemas.Course)
def update_course(course_id: int, course: schemas.CourseUpdate, db: Session = Depends(get_db)):
    updated = crud.update_course(db, course_id, course)
    if not updated:
        raise HTTPException(status_code=404, detail="Course not found")
    return updated

@app.delete("/api/courses/{course_id}")
def delete_course(course_id: int, db: Session = Depends(get_db)):
    deleted = crud.delete_course(db, course_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Course not found")
    return {"ok": True}

@app.post("/api/instructors", response_model=schemas.Instructor)
def create_instructor(instructor: schemas.InstructorCreate, db: Session = Depends(get_db)):
    return crud.create_instructor(db=db, instructor=instructor)

@app.get("/api/instructors", response_model=list[schemas.Instructor])
def read_instructors(
    skip: int = 0,
    limit: int = 100,
    include_deleted: bool = False,
    month: Optional[str] = None,
    db: Session = Depends(get_db)
):
    return crud.get_instructors(db, skip=skip, limit=limit, include_deleted=include_deleted, month=month)

@app.put("/api/instructors/{instructor_id}", response_model=schemas.Instructor)
def update_instructor(instructor_id: int, instructor: schemas.InstructorUpdate, db: Session = Depends(get_db)):
    updated = crud.update_instructor(db, instructor_id, instructor)
    if not updated:
        raise HTTPException(status_code=404, detail="Instructor not found")
    return updated

@app.put("/api/instructors/{instructor_id}/lessons", response_model=schemas.Instructor)
def update_instructor_lessons_endpoint(
    instructor_id: int,
    payload: schemas.StudentGroupOffsetUpdate,
    db: Session = Depends(get_db)
):
    target = payload.attended_lessons if payload.attended_lessons is not None else (payload.initial_lessons or 0)
    updated = crud.update_instructor_lessons(db, instructor_id, target)
    if not updated:
        raise HTTPException(status_code=404, detail="Instructor not found")
    return updated

@app.delete("/api/instructors/{instructor_id}")
def delete_instructor(instructor_id: int, db: Session = Depends(get_db)):
    deleted = crud.delete_instructor(db, instructor_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Instructor not found")
    return {"ok": True}

@app.post("/api/groups", response_model=schemas.Group)
def create_group(group: schemas.GroupCreate, db: Session = Depends(get_db)):
    return crud.create_group(db=db, group=group)

@app.get("/api/groups", response_model=list[schemas.Group])
def read_groups(skip: int = 0, limit: int = 100, include_deleted: bool = False, db: Session = Depends(get_db)):
    return crud.get_groups(db, skip=skip, limit=limit, include_deleted=include_deleted)

@app.put("/api/groups/{group_id}", response_model=schemas.Group)
def update_group(group_id: int, group: schemas.GroupUpdate, db: Session = Depends(get_db)):
    updated = crud.update_group(db, group_id, group)
    if not updated:
        raise HTTPException(status_code=404, detail="Group not found")
    return updated

@app.delete("/api/groups/{group_id}")
def delete_group(group_id: int, db: Session = Depends(get_db)):
    deleted = crud.delete_group(db, group_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Group not found")
    return {"ok": True}

@app.post("/api/groups/{group_id}/students", response_model=schemas.Group)
def add_students_to_group(group_id: int, request: schemas.GroupStudentAdd, db: Session = Depends(get_db)):
    group = crud.add_students_to_group(db, group_id, request.student_ids)
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    return group

@app.post("/api/groups/{group_id}/conduct-lesson", response_model=schemas.Group)
def conduct_lesson(group_id: int, db: Session = Depends(get_db)):
    grp = crud.conduct_group_lesson(db, group_id)
    if not grp:
        raise HTTPException(status_code=404, detail="Group not found")
    return grp

@app.post("/api/groups/{group_id}/revert-lesson", response_model=schemas.Group)
def revert_lesson(group_id: int, db: Session = Depends(get_db)):
    grp = crud.revert_group_lesson(db, group_id)
    if not grp:
        raise HTTPException(status_code=404, detail="Group not found")
    return grp

@app.get("/api/debts", response_model=schemas.DebtsSummary)
def read_debts(
    course_direction: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    return crud.get_debtors(db, course_direction=course_direction, search=search)

@app.get("/api/lesson-edit-history", response_model=list[schemas.LessonEditHistoryItem])
def read_lesson_edit_history(
    entity_type: Optional[str] = None,
    entity_id: Optional[int] = None,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    return crud.get_lesson_edit_history(db, entity_type=entity_type, entity_id=entity_id, limit=limit)

@app.post("/api/reset-demo-data")
def reset_demo_data_endpoint():
    seed.seed(force_reset=True)
    return {"ok": True, "message": "Demo data reset and seeded successfully"}


