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
# Students & Balance
# ============
def record_daily_student_snapshot(db: Session):
    try:
        import datetime
        today_str = str(datetime.date.today())
        active_count = db.query(models.Student).filter(
            models.Student.status.notin_(["Արխիվ", "Ավարտած"])
        ).count()
        snap = db.query(models.StudentDailySnapshot).filter(
            models.StudentDailySnapshot.snapshot_date == today_str
        ).first()
        if snap:
            snap.student_count = active_count
        else:
            snap = models.StudentDailySnapshot(snapshot_date=today_str, student_count=active_count)
            db.add(snap)
        db.commit()
    except Exception as e:
        print("record_daily_student_snapshot error:", e)

def calculate_student_balance(student, db: Session = None):
    try:
        total_paid = sum((p.amount or 0) for p in (getattr(student, 'payments', []) or []))
        
        monthly_fee = getattr(student, 'monthly_fee', 0) or 0
        discount = getattr(student, 'discount_percent', 0) or 0
        if discount > 0:
            monthly_fee = int(round(monthly_fee * (1 - discount / 100.0)))
        
        lesson_cost = int(round(monthly_fee / 12.0)) if monthly_fee > 0 else 0
        
        links_map = {}
        if db is not None and getattr(student, 'id', None):
            try:
                links = db.query(models.StudentGroupLink).filter(
                    models.StudentGroupLink.student_id == student.id
                ).all()
                for lnk in links:
                    links_map[lnk.group_id] = lnk.initial_lessons or 0
            except Exception as le:
                print("links fetch error:", le)

        total_lessons_attended = 0
        group_names = []
        student_groups = []
        groups = getattr(student, 'groups', []) or []
        for grp in groups:
            grp_conducted = getattr(grp, 'conducted_lessons', 0) or 0
            init_lessons = links_map.get(grp.id, 0)
            attended = max(0, grp_conducted - init_lessons)
            total_lessons_attended += attended
            if getattr(grp, 'name', None):
                group_names.append(grp.name)
            student_groups.append({
                "group_id": grp.id,
                "group_name": grp.name or "",
                "course_title": grp.course.title if getattr(grp, 'course', None) else "",
                "days": grp.days or "",
                "start_time": grp.start_time or "",
                "end_time": grp.end_time or "",
                "group_conducted_lessons": grp_conducted,
                "initial_lessons": init_lessons,
                "student_attended_lessons": attended
            })
        
        total_charged = total_lessons_attended * lesson_cost
        balance = total_paid - total_charged

        return {
            "total_paid": total_paid,
            "total_charged": total_charged,
            "total_lessons_attended": total_lessons_attended,
            "lesson_cost": lesson_cost,
            "balance": balance,
            "group_names": group_names,
            "student_groups": student_groups
        }
    except Exception as e:
        print("calculate_student_balance error:", e)
        return {
            "total_paid": 0,
            "total_charged": 0,
            "total_lessons_attended": 0,
            "lesson_cost": 0,
            "balance": 0,
            "group_names": [],
            "student_groups": []
        }

def enrich_student(student, db: Session = None):
    if not student:
        return None
    try:
        stats = calculate_student_balance(student, db=db)
        student.total_paid = stats["total_paid"]
        student.total_charged = stats["total_charged"]
        student.total_lessons_attended = stats["total_lessons_attended"]
        student.lesson_cost = stats["lesson_cost"]
        student.balance = stats["balance"]
        student.group_names = stats["group_names"]
        student.student_groups = stats["student_groups"]
    except Exception as e:
        print("enrich_student error:", e)
    return student

def get_student_by_email(db: Session, email: str):
    return db.query(models.Student).filter(models.Student.email == email).first()

def get_student(db: Session, student_id: int):
    st = db.query(models.Student).filter(models.Student.id == student_id).first()
    return enrich_student(st, db=db)

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
    if status and status.strip() and status.strip() != "all":
        st = status.strip()
        query = query.filter(models.Student.status.ilike(f"%{st}%"))
    if course_direction and course_direction.strip() and course_direction.strip() != "all":
        cd = course_direction.strip()
        query = query.filter(models.Student.course_direction.ilike(f"%{cd}%"))
        
    total = query.count()
    items = query.order_by(models.Student.id.desc()).offset(skip).limit(limit).all()
    for st in items:
        try:
            enrich_student(st, db=db)
        except Exception as e:
            print("enrich error on item:", e)
    return {"total": total, "items": items}

def get_debtors(db: Session, course_direction: str = None, search: str = None):
    query = db.query(models.Student)
    if course_direction and course_direction.strip():
        query = query.filter(models.Student.course_direction.ilike(f"%{course_direction.strip()}%"))
    if search and search.strip():
        sf = f"%{search.strip()}%"
        query = query.filter(
            or_(
                models.Student.full_name.ilike(sf),
                models.Student.phone.ilike(sf),
                models.Student.email.ilike(sf)
            )
        )
    all_students = query.all()
    debtors = []
    total_debt_amount = 0
    for st in all_students:
        enrich_student(st, db=db)
        if (st.balance or 0) < 0:
            debtors.append(st)
            total_debt_amount += abs(st.balance)
    
    debtors.sort(key=lambda s: s.balance)
    return {
        "total_debtors": len(debtors),
        "total_debt_amount": total_debt_amount,
        "items": debtors
    }

def create_student(db: Session, student: schemas.StudentCreate):
    db_student = models.Student(**student.dict())
    db.add(db_student)
    db.commit()
    db.refresh(db_student)
    record_daily_student_snapshot(db)
    return enrich_student(db_student, db=db)

def update_student(db: Session, student_id: int, student: schemas.StudentUpdate):
    db_student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if db_student:
        update_data = student.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_student, key, value)
        db.commit()
        db.refresh(db_student)
        record_daily_student_snapshot(db)
        enrich_student(db_student, db=db)
    return db_student

def delete_student(db: Session, student_id: int):
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if student:
        db.delete(student)
        db.commit()
        record_daily_student_snapshot(db)
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
    first_of_month_str = str(first_of_month)

    total_lessons = 0
    assigned_groups = []

    for grp in groups:
        if grp.instructor_id != instructor.id:
            continue
        if grp.name:
            assigned_groups.append(grp.name)
        if not grp.start_date:
            continue
        
        try:
            parsed_start = datetime.datetime.strptime(grp.start_date[:10], "%Y-%m-%d").date()
        except Exception:
            continue

        # Group is only active if start_date <= today
        if parsed_start > today:
            continue

        # If group has explicit recorded lesson dates
        monthly_lessons = [l for l in (grp.lessons or []) if l.lesson_date and l.lesson_date >= first_of_month_str]
        if monthly_lessons:
            total_lessons += len(monthly_lessons)
        else:
            # Fallback based on conducted_lessons
            conducted = grp.conducted_lessons or 0
            if conducted > 0:
                if parsed_start >= first_of_month:
                    total_lessons += conducted
                else:
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
                    
                    month_days = 0
                    if active_weekdays:
                        curr = first_of_month
                        while curr <= today:
                            if curr.weekday() in active_weekdays:
                                month_days += 1
                            curr += datetime.timedelta(days=1)
                    total_lessons += min(conducted, month_days)

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
            "completed_lessons": grp.conducted_lessons or 0,
            "remaining_lessons": total_course_lessons,
            "progress_percent": 0
        }
    
    try:
        parsed_start = datetime.datetime.strptime(grp.start_date[:10], "%Y-%m-%d").date()
    except Exception:
        return {
            "is_started": False,
            "completed_lessons": grp.conducted_lessons or 0,
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

    completed = grp.conducted_lessons or 0
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

def auto_check_daily_group_lessons(db: Session):
    today = datetime.date.today()
    today_str = str(today)

    day_patterns = [
        (0, ['երկ']),
        (1, ['երք', 'երեք']),
        (2, ['չրք', 'չոր']),
        (3, ['հնգ', 'հինգ']),
        (4, ['ուրբ', 'ուբթ', 'ուր']),
        (5, ['շբթ', 'շաբ']),
        (6, ['կիր']),
    ]

    try:
        groups = db.query(models.Group).all()
        changed = False

        for grp in groups:
            if not grp.start_date or not grp.days:
                continue
            try:
                parsed_start = datetime.datetime.strptime(grp.start_date[:10], "%Y-%m-%d").date()
            except Exception:
                continue

            if parsed_start > today:
                continue

            group_days_str = (grp.days or "").lower()
            is_today_scheduled = False
            for w_idx, patterns in day_patterns:
                if any(p in group_days_str for p in patterns):
                    if today.weekday() == w_idx:
                        is_today_scheduled = True
                        break

            if is_today_scheduled:
                if grp.last_lesson_date != today_str:
                    course_total = grp.course.total_lessons if (grp.course and grp.course.total_lessons) else 9999
                    current = grp.conducted_lessons or 0
                    if current < course_total:
                        grp.conducted_lessons = current + 1
                        grp.last_lesson_date = today_str
                        gl = models.GroupLesson(group_id=grp.id, lesson_date=today_str)
                        db.add(gl)
                        changed = True

        if changed:
            db.commit()
    except Exception as e:
        print("Auto check lessons error:", e)

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
    auto_check_daily_group_lessons(db)
    groups = db.query(models.Group).offset(skip).limit(limit).all()
    for grp in groups:
        enrich_group(grp)
    return groups

def get_group(db: Session, group_id: int):
    grp = db.query(models.Group).filter(models.Group.id == group_id).first()
    return enrich_group(grp)

def conduct_group_lesson(db: Session, group_id: int):
    grp = db.query(models.Group).filter(models.Group.id == group_id).first()
    if not grp:
        return None
    today_str = str(datetime.date.today())
    grp.conducted_lessons = (grp.conducted_lessons or 0) + 1
    grp.last_lesson_date = today_str
    gl = models.GroupLesson(group_id=grp.id, lesson_date=today_str)
    db.add(gl)
    db.commit()
    db.refresh(grp)
    return enrich_group(grp)

def revert_group_lesson(db: Session, group_id: int):
    grp = db.query(models.Group).filter(models.Group.id == group_id).first()
    if not grp:
        return None
    current = grp.conducted_lessons or 0
    if current > 0:
        grp.conducted_lessons = current - 1
        last_gl = db.query(models.GroupLesson).filter(models.GroupLesson.group_id == group_id).order_by(models.GroupLesson.id.desc()).first()
        if last_gl:
            db.delete(last_gl)
        db.commit()
        db.refresh(grp)
    return enrich_group(grp)

def create_group(db: Session, group: schemas.GroupCreate):
    data = group.dict()
    if data.get("conducted_lessons") is None:
        data["conducted_lessons"] = 0
    if not data.get("last_lesson_date"):
        data["last_lesson_date"] = str(datetime.date.today())
    db_group = models.Group(**data)
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
    
    existing_links = db.query(models.StudentGroupLink).filter(
        models.StudentGroupLink.group_id == group_id
    ).all()
    existing_student_ids = {lnk.student_id for lnk in existing_links}
    target_student_ids = set(student_ids)

    # Remove students no longer in the list
    for lnk in existing_links:
        if lnk.student_id not in target_student_ids:
            db.delete(lnk)

    # Add newly assigned students with initial_lessons = group.conducted_lessons
    grp_conducted = group.conducted_lessons or 0
    for sid in target_student_ids:
        if sid not in existing_student_ids:
            new_link = models.StudentGroupLink(
                group_id=group_id,
                student_id=sid,
                initial_lessons=grp_conducted
            )
            db.add(new_link)
    
    db.commit()
    db.refresh(group)
    return enrich_group(group)

def update_student_group_offset(db: Session, student_id: int, group_id: int, initial_lessons: int):
    lnk = db.query(models.StudentGroupLink).filter(
        models.StudentGroupLink.student_id == student_id,
        models.StudentGroupLink.group_id == group_id
    ).first()
    if not lnk:
        return None
    lnk.initial_lessons = max(0, initial_lessons)
    db.commit()
    return get_student(db, student_id)

def get_monthly_student_trend(db: Session, days_count: int = 30):
    import datetime
    record_daily_student_snapshot(db)
    today = datetime.date.today()
    start_date = today - datetime.timedelta(days=days_count - 1)

    all_students = db.query(models.Student).all()
    snapshots = db.query(models.StudentDailySnapshot).filter(
        models.StudentDailySnapshot.snapshot_date >= str(start_date - datetime.timedelta(days=1))
    ).all()
    snap_map = {s.snapshot_date: s.student_count for s in snapshots}

    def reconstruct_count_for_day(d: datetime.date):
        d_str = str(d)
        if d_str in snap_map:
            return snap_map[d_str]
        cnt = 0
        for st in all_students:
            st_date = None
            if getattr(st, 'created_at', None):
                try:
                    st_date = st.created_at.date()
                except Exception:
                    pass
            if st_date is None or st_date <= d:
                cnt += 1
        return cnt

    result = []
    prev_count = reconstruct_count_for_day(start_date - datetime.timedelta(days=1))

    for i in range(days_count):
        curr_day = start_date + datetime.timedelta(days=i)
        curr_count = reconstruct_count_for_day(curr_day)
        diff = curr_count - prev_count
        status = "down" if diff < 0 else "up_or_same"
        result.append({
            "date": str(curr_day),
            "label": curr_day.strftime("%d.%m"),
            "count": curr_count,
            "diff": diff,
            "status": status
        })
        prev_count = curr_count

    return result


