import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import models, schemas, crud
from database import engine, get_db
import seed

app = FastAPI(title="CRM API")

@app.on_event("startup")
def startup_event():
    models.Base.metadata.create_all(bind=engine)
    seed.seed()

# Allow requests from the frontend SPA and landing page
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this!
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/login")
def login(req: schemas.LoginRequest, db: Session = Depends(get_db)):
    # Hardcoded test admin, in production check DB
    if req.username == "admin" and req.password == "admin123":
        return {"token": "fake-jwt-token-123"}
    raise HTTPException(status_code=401, detail="Invalid credentials")

@app.post("/api/students", response_model=schemas.Student)
def create_student(student: schemas.StudentCreate, db: Session = Depends(get_db)):
    """Endpoint for landing page and CRM to create students"""
    db_student = crud.get_student_by_email(db, email=student.email)
    if db_student:
        raise HTTPException(status_code=400, detail="Email already registered")
    return crud.create_student(db=db, student=student)

@app.get("/api/students", response_model=schemas.PaginatedResponse[schemas.Student])
def read_students(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_students(db, skip=skip, limit=limit)

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

@app.get("/api/payments", response_model=list[schemas.Payment])
def read_payments(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_payments(db, skip=skip, limit=limit)

@app.post("/api/payments", response_model=schemas.Payment)
def create_payment(payment: schemas.PaymentCreate, db: Session = Depends(get_db)):
    return crud.create_payment(db=db, payment=payment)


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
def read_instructors(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_instructors(db, skip=skip, limit=limit)

@app.put("/api/instructors/{instructor_id}", response_model=schemas.Instructor)
def update_instructor(instructor_id: int, instructor: schemas.InstructorUpdate, db: Session = Depends(get_db)):
    updated = crud.update_instructor(db, instructor_id, instructor)
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
def read_groups(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_groups(db, skip=skip, limit=limit)

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
