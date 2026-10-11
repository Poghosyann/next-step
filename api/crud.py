from sqlalchemy.orm import Session
import models, schemas

# ============
# Admin
# ============
def get_admin(db: Session, username: str):
    return db.query(models.Admin).filter(models.Admin.username == username).first()

def create_admin(db: Session, username: str, password: str):
    db_admin = models.Admin(username=username, password=password)
    db.add(db_admin)
    db.commit()
    db.refresh(db_admin)
    return db_admin

def update_admin_password(db: Session, username: str, new_password: str):
    admin = get_admin(db, username)
    if admin:
        admin.password = new_password
        db.commit()
        db.refresh(admin)
        return admin
    return None

# ============
# Students
# ============
def get_student_by_email(db: Session, email: str):
    return db.query(models.Student).filter(models.Student.email == email).first()

def get_student(db: Session, student_id: int):
    return db.query(models.Student).filter(models.Student.id == student_id).first()

from sqlalchemy import or_

def get_students(db: Session, skip: int = 0, limit: int = 100, search: str = None, status: str = None, course_direction: str = None):
    query = db.query(models.Student)
    
    if search and search.strip():
        search_filter = f"%{search.strip()}%"
        query = query.filter(
            or_(
                models.Student.full_name.ilike(search_filter),
                models.Student.email.ilike(search_filter),
                models.Student.phone.ilike(search_filter)
            )
        )
    if status and status.strip():
        st = status.strip()
        query = query.filter(models.Student.status.ilike(f"%{st}%"))
    if course_direction and course_direction.strip():
        cd = course_direction.strip()
        query = query.filter(models.Student.course_direction.ilike(f"%{cd}%"))
        
    total = query.count()
    items = query.order_by(models.Student.id.desc()).offset(skip).limit(limit).all()
    return {"total": total, "items": items}

def create_student(db: Session, student: schemas.StudentCreate):
    db_student = models.Student(**student.dict())
    db.add(db_student)
    db.commit()
    db.refresh(db_student)
    return db_student

def update_student(db: Session, student_id: int, student: schemas.StudentUpdate):
    db_student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if db_student:
        update_data = student.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_student, key, value)
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

def get_course(db: Session, course_id: int):
    return db.query(models.Course).filter(models.Course.id == course_id).first()

def update_course(db: Session, course_id: int, course: schemas.CourseUpdate):
    db_course = db.query(models.Course).filter(models.Course.id == course_id).first()
    if db_course:
        update_data = course.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_course, key, value)
        db.commit()
        db.refresh(db_course)
    return db_course

def delete_course(db: Session, course_id: int):
    db_course = db.query(models.Course).filter(models.Course.id == course_id).first()
    if db_course:
        db.delete(db_course)
        db.commit()
    return db_course

# ============
# Instructors
# ============
import datetime

def calculate_instructor_monthly_stats(instructor, groups):
    today = datetime.date.today()
    first_of_month = datetime.date(today.year, today.month, 1)

    day_patterns = [
        (0, ['երկ']),
        (1, ['երք', 'երեք']),
        (2, ['չրք', 'չոր']),
        (3, ['հնգ', 'հինգ']),
        (4, ['ուրբ', 'ուբթ', 'ուր']),
        (5, ['շբթ', 'շաբ']),
        (6, ['կիր']),
    ]

    total_lessons = 0
    assigned_groups = []

    for grp in groups:
        if grp.instructor_id != instructor.id:
            continue
        if grp.name:
            assigned_groups.append(grp.name)
        if not grp.days or not grp.start_date:
            continue
        
        try:
            parsed_start = datetime.datetime.strptime(grp.start_date[:10], "%Y-%m-%d").date()
        except Exception:
            continue

        # Group is only active if start_date <= today
        if parsed_start > today:
            continue

        group_days_str = grp.days.lower()
        active_weekdays = set()
        for w_idx, patterns in day_patterns:
            if any(p in group_days_str for p in patterns):
                active_weekdays.add(w_idx)
        
        if not active_weekdays:
            continue

        course_total = grp.course.total_lessons if (grp.course and grp.course.total_lessons) else None

        # Trace lessons from parsed_start to today
        curr = parsed_start
        lifetime_count = 0
        while curr <= today:
            if curr.weekday() in active_weekdays:
                lifetime_count += 1
                if course_total and lifetime_count > course_total:
                    break
                if curr >= first_of_month:
                    total_lessons += 1
            curr += datetime.timedelta(days=1)

    rate = instructor.rate_per_lesson or 0
    return {
        "current_month_lessons": total_lessons,
        "current_month_salary": total_lessons * rate,
        "assigned_groups": assigned_groups
    }

def enrich_instructor(instructor, groups):
    if not instructor:
        return None
    stats = calculate_instructor_monthly_stats(instructor, groups)
    instructor.current_month_lessons = stats["current_month_lessons"]
    instructor.current_month_salary = stats["current_month_salary"]
    instructor.assigned_groups = stats["assigned_groups"]
    return instructor

def get_instructors(db: Session, skip: int = 0, limit: int = 100):
    instructors = db.query(models.Instructor).offset(skip).limit(limit).all()
    groups = db.query(models.Group).all()
    for inst in instructors:
        enrich_instructor(inst, groups)
    return instructors

def create_instructor(db: Session, instructor: schemas.InstructorCreate):
    db_instructor = models.Instructor(**instructor.dict())
    db.add(db_instructor)
    db.commit()
    db.refresh(db_instructor)
    return db_instructor

def get_instructor(db: Session, instructor_id: int):
    inst = db.query(models.Instructor).filter(models.Instructor.id == instructor_id).first()
    if inst:
        groups = db.query(models.Group).filter(models.Group.instructor_id == instructor_id).all()
        enrich_instructor(inst, groups)
    return inst

def update_instructor(db: Session, instructor_id: int, instructor: schemas.InstructorUpdate):
    db_instructor = db.query(models.Instructor).filter(models.Instructor.id == instructor_id).first()
    if db_instructor:
        update_data = instructor.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_instructor, key, value)
        db.commit()
        db.refresh(db_instructor)
    return db_instructor

def delete_instructor(db: Session, instructor_id: int):
    db_instructor = db.query(models.Instructor).filter(models.Instructor.id == instructor_id).first()
    if db_instructor:
        db.delete(db_instructor)
        db.commit()
    return db_instructor

# ============
# Groups
# ============
def calculate_group_progress(grp):
    today = datetime.date.today()
    total_course_lessons = grp.course.total_lessons if (grp.course and grp.course.total_lessons) else 0

    if not grp.start_date:
        return {
            "is_started": False,
            "completed_lessons": 0,
            "remaining_lessons": total_course_lessons,
            "progress_percent": 0
        }
    
    try:
        parsed_start = datetime.datetime.strptime(grp.start_date[:10], "%Y-%m-%d").date()
    except Exception:
        return {
            "is_started": False,
            "completed_lessons": 0,
            "remaining_lessons": total_course_lessons,
            "progress_percent": 0
        }

    if parsed_start > today:
        return {
            "is_started": False,
            "completed_lessons": 0,
            "remaining_lessons": total_course_lessons,
            "progress_percent": 0
        }

    day_patterns = [
        (0, ['երկ']),
        (1, ['երք', 'երեք']),
        (2, ['չրք', 'չոր']),
        (3, ['հնգ', 'հինգ']),
        (4, ['ուրբ', 'ուբթ', 'ուր']),
        (5, ['շբթ', 'շաբ']),
        (6, ['կիր']),
    ]
    group_days_str = (grp.days or "").lower()
    active_weekdays = set()
    for w_idx, patterns in day_patterns:
        if any(p in group_days_str for p in patterns):
            active_weekdays.add(w_idx)

    completed = 0
    if active_weekdays:
        curr = parsed_start
        while curr <= today:
            if curr.weekday() in active_weekdays:
                completed += 1
                if total_course_lessons > 0 and completed >= total_course_lessons:
                    break
            curr += datetime.timedelta(days=1)

    rem = max(0, total_course_lessons - completed) if total_course_lessons > 0 else 0
    pct = round((completed / total_course_lessons) * 100) if total_course_lessons > 0 else 0
    if pct > 100:
        pct = 100

    return {
        "is_started": True,
        "completed_lessons": completed,
        "remaining_lessons": rem,
        "progress_percent": pct
    }

def enrich_group(grp):
    if not grp:
        return None
    progress = calculate_group_progress(grp)
    grp.is_started = progress["is_started"]
    grp.completed_lessons = progress["completed_lessons"]
    grp.remaining_lessons = progress["remaining_lessons"]
    grp.progress_percent = progress["progress_percent"]
    return grp

def get_groups(db: Session, skip: int = 0, limit: int = 100):
    groups = db.query(models.Group).offset(skip).limit(limit).all()
    for grp in groups:
        enrich_group(grp)
    return groups

def get_group(db: Session, group_id: int):
    grp = db.query(models.Group).filter(models.Group.id == group_id).first()
    return enrich_group(grp)

def create_group(db: Session, group: schemas.GroupCreate):
    db_group = models.Group(**group.dict())
    db.add(db_group)
    db.commit()
    db.refresh(db_group)
    return enrich_group(db_group)

def update_group(db: Session, group_id: int, group: schemas.GroupUpdate):
    db_group = db.query(models.Group).filter(models.Group.id == group_id).first()
    if db_group:
        update_data = group.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_group, key, value)
        db.commit()
        db.refresh(db_group)
        enrich_group(db_group)
    return db_group

def delete_group(db: Session, group_id: int):
    db_group = db.query(models.Group).filter(models.Group.id == group_id).first()
    if db_group:
        db.delete(db_group)
        db.commit()
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
