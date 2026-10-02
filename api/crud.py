from sqlalchemy.orm import Session
import models, schemas

# ============
# Students
# ============
def get_student_by_email(db: Session, email: str):
    return db.query(models.Student).filter(models.Student.email == email).first()

def get_student(db: Session, student_id: int):
    return db.query(models.Student).filter(models.Student.id == student_id).first()

def get_students(db: Session, skip: int = 0, limit: int = 100):
    total = db.query(models.Student).count()
    items = db.query(models.Student).order_by(models.Student.id.desc()).offset(skip).limit(limit).all()
    return {"total": total, "items": items}

def create_student(db: Session, student: schemas.StudentCreate):
    db_student = models.Student(**student.dict())
    db.add(db_student)
    db.commit()
    db.refresh(db_student)
    return db_student

def delete_student(db: Session, student_id: int):
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if student:
        db.delete(student)
        db.commit()
    return student

# ============
# Payments
# ============
def get_payments(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Payment).order_by(models.Payment.payment_date.desc()).offset(skip).limit(limit).all()

def create_payment(db: Session, payment: schemas.PaymentCreate):
    db_payment = models.Payment(**payment.dict())
    db.add(db_payment)
    db.commit()
    db.refresh(db_payment)
    return db_payment

# ============
# Courses
# ============
def get_courses(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Course).offset(skip).limit(limit).all()

def create_course(db: Session, course: schemas.CourseCreate):
    db_course = models.Course(**course.dict())
    db.add(db_course)
    db.commit()
    db.refresh(db_course)
    return db_course

# ============
# Instructors
# ============
def get_instructors(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Instructor).offset(skip).limit(limit).all()

def create_instructor(db: Session, instructor: schemas.InstructorCreate):
    db_instructor = models.Instructor(**instructor.dict())
    db.add(db_instructor)
    db.commit()
    db.refresh(db_instructor)
    return db_instructor

# ============
# Groups
# ============
def get_groups(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Group).offset(skip).limit(limit).all()

def get_group(db: Session, group_id: int):
    return db.query(models.Group).filter(models.Group.id == group_id).first()

def create_group(db: Session, group: schemas.GroupCreate):
    db_group = models.Group(**group.dict())
    db.add(db_group)
    db.commit()
    db.refresh(db_group)
    return db_group

def add_students_to_group(db: Session, group_id: int, student_ids: list[int]):
    group = db.query(models.Group).filter(models.Group.id == group_id).first()
    if not group:
        return None
    
    students = db.query(models.Student).filter(models.Student.id.in_(student_ids)).all()
    for student in students:
        if student not in group.students:
            group.students.append(student)
    
    db.commit()
    db.refresh(group)
    return group
