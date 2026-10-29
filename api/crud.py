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
# Helpers: Soft Delete & Lesson Edit History
# ============
def is_record_deleted(obj) -> bool:
    if not obj:
        return True
    if getattr(obj, "is_deleted", 0) == 1:
        return True
    st = (getattr(obj, "status", "") or "").strip().lower()
    if "ջնջված" in st:
        return True
    return False

def log_lesson_edit(
    db: Session,
    entity_type: str,
    entity_id: int,
    entity_name: str,
    old_lessons: int,
    new_lessons: int,
    note: str = None
):
    try:
        entry = models.LessonEditHistory(
            entity_type=entity_type,
            entity_id=entity_id,
            entity_name=entity_name or "",
            old_lessons=old_lessons or 0,
            new_lessons=new_lessons or 0,
            note=note or ""
        )
        db.add(entry)
        db.commit()
    except Exception as e:
        print("log_lesson_edit error:", e)

def get_lesson_edit_history(db: Session, entity_type: str = None, entity_id: int = None, limit: int = 30):
    try:
        q = db.query(models.LessonEditHistory)
        if entity_type:
            q = q.filter(models.LessonEditHistory.entity_type == entity_type)
        if entity_id is not None:
            q = q.filter(models.LessonEditHistory.entity_id == entity_id)
        return q.order_by(models.LessonEditHistory.id.desc()).limit(limit).all()
    except Exception as e:
        print("get_lesson_edit_history error:", e)
        return []

# ============
# Students & Balance
# ============
def record_daily_student_snapshot(db: Session):
    try:
        import datetime
        from sqlalchemy import or_
        today_str = str(datetime.date.today())
        active_count = db.query(models.Student).filter(
            or_(models.Student.is_deleted == 0, models.Student.is_deleted == None),
            or_(models.Student.status == None, models.Student.status.notin_(["Արխիվ", "Ավարտած", "Ջնջված"]))
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
        active_payments = [
            p for p in (getattr(student, 'payments', []) or [])
            if not is_record_deleted(p)
        ]
        total_paid = sum((p.amount or 0) for p in active_payments)
        
        monthly_fee = getattr(student, 'monthly_fee', 0) or 0
        discount = getattr(student, 'discount_percent', 0) or 0
        if discount > 0:
            monthly_fee = int(round(monthly_fee * (1 - discount / 100.0)))
        gift_card = getattr(student, 'gift_card', 0) or 0
        if gift_card > 0:
            monthly_fee = max(0, monthly_fee - gift_card)
        
        lesson_cost = int(round(monthly_fee / 8.0)) if monthly_fee > 0 else 0
        
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
        all_groups = getattr(student, 'groups', []) or []
        active_groups = [grp for grp in all_groups if not is_record_deleted(grp)]

        for grp in active_groups:
            grp_conducted = getattr(grp, 'conducted_lessons', 0) or 0
            init_lessons = links_map.get(grp.id, 0)
            attended = max(0, grp_conducted - init_lessons)
            total_lessons_attended += attended
            student_groups.append({
                "group_id": grp.id,
                "group_name": "",
                "course_title": grp.course.title if (getattr(grp, 'course', None) and not is_record_deleted(grp.course)) else "",
                "days": grp.days or "",
                "start_time": grp.start_time or "",
                "end_time": grp.end_time or "",
                "group_conducted_lessons": grp_conducted,
                "initial_lessons": init_lessons,
                "student_attended_lessons": attended
            })
        
        if len(active_groups) == 0:
            custom_lessons = getattr(student, 'custom_lessons_attended', None)
            if custom_lessons is not None:
                total_lessons_attended = max(0, custom_lessons)
        
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
        student.payments = [
            p for p in (getattr(student, 'payments', []) or [])
            if not is_record_deleted(p)
        ]
        stats = calculate_student_balance(student, db=db)
        student.total_paid = stats["total_paid"]
        student.total_charged = stats["total_charged"]
        student.total_lessons_attended = stats["total_lessons_attended"]
        student.lesson_cost = stats["lesson_cost"]
        student.balance = stats["balance"]
        student.group_names = stats["group_names"]
        student.student_groups = stats["student_groups"]
        if db is not None and getattr(student, "id", None):
            student.lesson_edit_history = get_lesson_edit_history(db, "student", student.id)
        else:
            student.lesson_edit_history = []
    except Exception as e:
        print("enrich_student error:", e)
    return student

def get_student_by_email(db: Session, email: str):
    return db.query(models.Student).filter(models.Student.email == email).first()

from sqlalchemy import or_

def get_student(db: Session, student_id: int):
    st = db.query(models.Student).filter(
        models.Student.id == student_id,
        or_(models.Student.is_deleted == 0, models.Student.is_deleted == None),
        or_(models.Student.status == None, ~models.Student.status.ilike("%ջնջված%"))
    ).first()
    return enrich_student(st, db=db)

def get_students(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    search: str = None,
    status: str = None,
    course_direction: str = None,
    group_id: str = None
):
    auto_check_daily_group_lessons(db)
    query = db.query(models.Student).filter(
        or_(models.Student.is_deleted == 0, models.Student.is_deleted == None),
        or_(models.Student.status == None, ~models.Student.status.ilike("%ջնջված%"))
    )
    
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

    if group_id and group_id.strip() and group_id.strip() != "all":
        gid_str = group_id.strip()
        if gid_str == "none":
            query = query.filter(
                ~models.Student.groups.any(
                    or_(models.Group.is_deleted == 0, models.Group.is_deleted == None)
                )
            )
        elif gid_str.isdigit():
            query = query.filter(
                models.Student.groups.any(models.Group.id == int(gid_str))
            )
        
    total = query.count()
    items = query.order_by(models.Student.id.desc()).offset(skip).limit(limit).all()
    for st in items:
        try:
            enrich_student(st, db=db)
        except Exception as e:
            print("enrich error on item:", e)
    return {"total": total, "items": items}

def get_debtors(db: Session, course_direction: str = None, search: str = None):
    auto_check_daily_group_lessons(db)
    query = db.query(models.Student).filter(
        or_(models.Student.is_deleted == 0, models.Student.is_deleted == None),
        or_(models.Student.status == None, ~models.Student.status.ilike("%ջնջված%"))
    )
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
    data = student.dict()
    if not data.get("email") or not str(data.get("email")).strip():
        data["email"] = None
    else:
        data["email"] = str(data["email"]).strip()
    if not data.get("full_name") or not str(data.get("full_name")).strip():
        data["full_name"] = "Անանուն ուսանող"
    db_student = models.Student(**data, is_deleted=0)
    db.add(db_student)
    db.commit()
    db.refresh(db_student)
    record_daily_student_snapshot(db)
    return enrich_student(db_student, db=db)

def update_student(db: Session, student_id: int, student: schemas.StudentUpdate):
    import datetime
    db_student = db.query(models.Student).filter(
        models.Student.id == student_id,
        or_(models.Student.is_deleted == 0, models.Student.is_deleted == None)
    ).first()
    if db_student:
        update_data = student.dict(exclude_unset=True)
        if "email" in update_data:
            if not update_data["email"] or not str(update_data["email"]).strip():
                update_data["email"] = None
            else:
                update_data["email"] = str(update_data["email"]).strip()
        if "full_name" in update_data and (not update_data["full_name"] or not str(update_data["full_name"]).strip()):
            update_data["full_name"] = "Անանուն ուսանող"
        for key, value in update_data.items():
            setattr(db_student, key, value)
        db.commit()
        db.refresh(db_student)
        record_daily_student_snapshot(db)
        enrich_student(db_student, db=db)
    return db_student

def delete_student(db: Session, student_id: int):
    import datetime
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if student:
        student.status = "Ջնջված"
        student.is_deleted = 1
        student.deleted_at = datetime.datetime.utcnow()
        db.commit()
        db.refresh(student)
        record_daily_student_snapshot(db)
    return student

# ============
# Payments
# ============
def get_payments(db: Session, skip: int = 0, limit: int = 500):
    return (
        db.query(models.Payment)
        .join(models.Student, models.Payment.student_id == models.Student.id)
        .filter(
            or_(models.Payment.is_deleted == 0, models.Payment.is_deleted == None),
            or_(models.Payment.status == None, ~models.Payment.status.ilike("%ջնջված%")),
            or_(models.Student.is_deleted == 0, models.Student.is_deleted == None),
            or_(models.Student.status == None, ~models.Student.status.ilike("%ջնջված%"))
        )
        .order_by(models.Payment.payment_date.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

def create_payment(db: Session, payment: schemas.PaymentCreate):
    db_payment = models.Payment(**payment.dict(), status="Ակտիվ", is_deleted=0)
    db.add(db_payment)
    db.commit()
    db.refresh(db_payment)
    return db_payment

def update_payment(db: Session, payment_id: int, payment: schemas.PaymentUpdate):
    db_payment = db.query(models.Payment).filter(
        models.Payment.id == payment_id,
        or_(models.Payment.is_deleted == 0, models.Payment.is_deleted == None)
    ).first()
    if db_payment:
        update_data = payment.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_payment, key, value)
        db.commit()
        db.refresh(db_payment)
    return db_payment

def delete_payment(db: Session, payment_id: int):
    import datetime
    db_payment = db.query(models.Payment).filter(models.Payment.id == payment_id).first()
    if db_payment:
        db_payment.status = "Ջնջված"
        db_payment.is_deleted = 1
        db_payment.deleted_at = datetime.datetime.utcnow()
        db.commit()
        db.refresh(db_payment)
    return db_payment

# ============
# Courses
# ============
def get_courses(db: Session, skip: int = 0, limit: int = 100):
    return (
        db.query(models.Course)
        .filter(
            or_(models.Course.is_deleted == 0, models.Course.is_deleted == None),
            or_(models.Course.status == None, models.Course.status != "Ջնջված")
        )
        .offset(skip)
        .limit(limit)
        .all()
    )

def create_course(db: Session, course: schemas.CourseCreate):
    db_course = models.Course(**course.dict(), status="Ակտիվ", is_deleted=0)
    db.add(db_course)
    db.commit()
    db.refresh(db_course)
    return db_course

def get_course(db: Session, course_id: int):
    return (
        db.query(models.Course)
        .filter(
            models.Course.id == course_id,
            or_(models.Course.is_deleted == 0, models.Course.is_deleted == None),
            or_(models.Course.status == None, models.Course.status != "Ջնջված")
        )
        .first()
    )

def update_course(db: Session, course_id: int, course: schemas.CourseUpdate):
    db_course = db.query(models.Course).filter(
        models.Course.id == course_id,
        or_(models.Course.is_deleted == 0, models.Course.is_deleted == None)
    ).first()
    if db_course:
        update_data = course.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_course, key, value)
        db.commit()
        db.refresh(db_course)
    return db_course

def delete_course(db: Session, course_id: int):
    import datetime
    db_course = db.query(models.Course).filter(models.Course.id == course_id).first()
    if db_course:
        db_course.status = "Ջնջված"
        db_course.is_deleted = 1
        db_course.deleted_at = datetime.datetime.utcnow()
        db.commit()
        db.refresh(db_course)
    return db_course

# ============
# Instructors
# ============
import datetime
import calendar

def ensure_group_instructor_history(db: Session, grp: models.Group):
    try:
        if not grp or not grp.instructor_id:
            return
        active_hist = db.query(models.GroupInstructorHistory).filter(
            models.GroupInstructorHistory.group_id == grp.id,
            models.GroupInstructorHistory.unassigned_date == None
        ).first()
        if not active_hist:
            inst = grp.instructor
            if not inst:
                inst = db.query(models.Instructor).filter(models.Instructor.id == grp.instructor_id).first()
            inst_name = f"{inst.first_name} {inst.last_name}".strip() if inst else f"Դասախոս #{grp.instructor_id}"
            all_prev = db.query(models.GroupInstructorHistory).filter(
                models.GroupInstructorHistory.group_id == grp.id
            ).all()
            start_les = max([h.end_lesson or 0 for h in all_prev], default=0)
            conducted = grp.conducted_lessons or 0
            active_hist = models.GroupInstructorHistory(
                group_id=grp.id,
                instructor_id=grp.instructor_id,
                instructor_name=inst_name,
                assigned_date=grp.start_date or str(datetime.date.today()),
                unassigned_date=None,
                start_lesson=start_les,
                end_lesson=None,
                lessons_taught=max(0, conducted - start_les)
            )
            db.add(active_hist)
            db.commit()
    except Exception as e:
        print("ensure_group_instructor_history error:", e)

def calculate_instructor_monthly_stats(instructor, groups, db: Session = None, target_month: str = None):
    today = datetime.date.today()
    is_current_month = True
    if target_month and len(target_month.strip()) >= 7:
        try:
            parts = target_month.strip()[:7].split("-")
            t_year, t_month = int(parts[0]), int(parts[1])
            first_of_month = datetime.date(t_year, t_month, 1)
            if t_year == today.year and t_month == today.month:
                end_of_period = today
                is_current_month = True
            else:
                last_day = calendar.monthrange(t_year, t_month)[1]
                end_of_period = datetime.date(t_year, t_month, last_day)
                is_current_month = False
        except Exception:
            first_of_month = datetime.date(today.year, today.month, 1)
            end_of_period = today
            is_current_month = True
    else:
        first_of_month = datetime.date(today.year, today.month, 1)
        end_of_period = today
        is_current_month = True

    first_of_month_str = str(first_of_month)
    end_of_period_str = str(end_of_period)

    monthly_lessons = 0
    total_lessons_taught = 0
    assigned_groups = []

    group_map = {g.id: g for g in groups}

    for grp in groups:
        if grp.instructor_id == instructor.id and not is_record_deleted(grp):
            c_title = grp.course.title if (getattr(grp, 'course', None) and not is_record_deleted(grp.course)) else "Խումբ"
            label = f"{c_title} ({grp.days})" if getattr(grp, 'days', None) else c_title
            assigned_groups.append(label)

    # Calculate total lessons taught across all groups (past & current) from GroupInstructorHistory
    if db is not None:
        try:
            hist_records = db.query(models.GroupInstructorHistory).filter(
                models.GroupInstructorHistory.instructor_id == instructor.id
            ).all()
            seen_active_groups = set()
            for h in hist_records:
                grp = group_map.get(h.group_id)
                if h.unassigned_date is None and grp and not is_record_deleted(grp):
                    seen_active_groups.add(grp.id)
                    taught = max(0, (grp.conducted_lessons or 0) - (h.start_lesson or 0))
                    total_lessons_taught += taught
                else:
                    total_lessons_taught += (h.lessons_taught or 0)

            for grp in groups:
                if grp.instructor_id == instructor.id and grp.id not in seen_active_groups and not is_record_deleted(grp):
                    total_lessons_taught += (grp.conducted_lessons or 0)
        except Exception as he:
            print("hist calc error:", he)

    if end_of_period > today and not is_current_month:
        # Future month selected
        return {
            "current_month_lessons": 0,
            "current_month_salary": 0,
            "total_lessons_taught": total_lessons_taught,
            "assigned_groups": assigned_groups
        }

    # Calculate target month lessons (including lessons taught by this instructor before being reassigned)
    if db is not None:
        try:
            explicit_month_lessons = db.query(models.GroupLesson).filter(
                models.GroupLesson.instructor_id == instructor.id,
                models.GroupLesson.lesson_date >= first_of_month_str,
                models.GroupLesson.lesson_date <= end_of_period_str
            ).all()
        except Exception:
            explicit_month_lessons = []
    else:
        explicit_month_lessons = []

    groups_with_explicit = set()
    for gl in explicit_month_lessons:
        grp = group_map.get(gl.group_id)
        if grp and grp.start_date:
            try:
                parsed_start = datetime.datetime.strptime(grp.start_date[:10], "%Y-%m-%d").date()
                if parsed_start <= end_of_period:
                    monthly_lessons += 1
                    groups_with_explicit.add(grp.id)
            except Exception:
                pass

    # For groups where instructor is currently assigned or was assigned in target month without explicit instructor_id on GroupLesson
    for grp in groups:
        if grp.id in groups_with_explicit:
            continue
        if not grp.start_date:
            continue
        try:
            parsed_start = datetime.datetime.strptime(grp.start_date[:10], "%Y-%m-%d").date()
        except Exception:
            continue
        if parsed_start > end_of_period:
            continue

        inst_taught_in_grp = 0
        if db is not None:
            h_list = db.query(models.GroupInstructorHistory).filter(
                models.GroupInstructorHistory.group_id == grp.id,
                models.GroupInstructorHistory.instructor_id == instructor.id
            ).all()
            if h_list:
                for h in h_list:
                    if h.assigned_date and h.assigned_date[:10] > end_of_period_str:
                        continue
                    if h.unassigned_date is None:
                        inst_taught_in_grp += max(0, (grp.conducted_lessons or 0) - (h.start_lesson or 0))
                    elif h.unassigned_date[:10] >= first_of_month_str:
                        inst_taught_in_grp += (h.lessons_taught or 0)
            elif grp.instructor_id == instructor.id:
                inst_taught_in_grp = grp.conducted_lessons or 0
        elif grp.instructor_id == instructor.id:
            inst_taught_in_grp = grp.conducted_lessons or 0

        if inst_taught_in_grp <= 0:
            continue

        # Legacy GroupLesson rows without instructor_id
        untagged_month_lessons = [
            l for l in (grp.lessons or [])
            if getattr(l, 'instructor_id', None) is None and l.lesson_date and first_of_month_str <= l.lesson_date <= end_of_period_str
        ]
        if untagged_month_lessons and grp.instructor_id == instructor.id:
            monthly_lessons += min(inst_taught_in_grp, len(untagged_month_lessons))
        else:
            if parsed_start >= first_of_month and is_current_month:
                monthly_lessons += inst_taught_in_grp
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
                    curr = max(first_of_month, parsed_start)
                    while curr <= end_of_period:
                        if curr.weekday() in active_weekdays:
                            month_days += 1
                        curr += datetime.timedelta(days=1)
                monthly_lessons += min(inst_taught_in_grp, month_days)

    if is_current_month:
        custom_m = getattr(instructor, "custom_month_lessons", None)
        if custom_m is not None:
            diff_m = max(0, custom_m) - monthly_lessons
            monthly_lessons = max(0, custom_m)
            total_lessons_taught = max(monthly_lessons, total_lessons_taught + diff_m)

    if total_lessons_taught < monthly_lessons:
        total_lessons_taught = monthly_lessons

    rate = instructor.rate_per_lesson or 0
    return {
        "current_month_lessons": monthly_lessons,
        "current_month_salary": monthly_lessons * rate,
        "total_lessons_taught": total_lessons_taught,
        "assigned_groups": assigned_groups
    }

def enrich_instructor(instructor, groups, db: Session = None, target_month: str = None):
    if not instructor:
        return None
    stats = calculate_instructor_monthly_stats(instructor, groups, db=db, target_month=target_month)
    instructor.current_month_lessons = stats["current_month_lessons"]
    instructor.current_month_salary = stats["current_month_salary"]
    instructor.total_lessons_taught = stats["total_lessons_taught"]
    instructor.assigned_groups = stats["assigned_groups"]
    if db is not None and getattr(instructor, "id", None):
        instructor.lesson_edit_history = get_lesson_edit_history(db, "instructor", instructor.id)
    else:
        instructor.lesson_edit_history = []
    return instructor

def get_instructors(db: Session, skip: int = 0, limit: int = 100, include_deleted: bool = False, month: str = None):
    auto_check_daily_group_lessons(db)
    query = db.query(models.Instructor).filter(
        or_(models.Instructor.is_deleted == 0, models.Instructor.is_deleted == None),
        or_(models.Instructor.status == None, models.Instructor.status != "Ջնջված")
    )
    instructors = query.offset(skip).limit(limit).all()
    groups = db.query(models.Group).all()
    for grp in groups:
        ensure_group_instructor_history(db, grp)
    for inst in instructors:
        enrich_instructor(inst, groups, db=db, target_month=month)
    return instructors

def create_instructor(db: Session, instructor: schemas.InstructorCreate):
    db_instructor = models.Instructor(**instructor.dict(), status="Ակտիվ", is_deleted=0)
    db.add(db_instructor)
    db.commit()
    db.refresh(db_instructor)
    return db_instructor

def get_instructor(db: Session, instructor_id: int):
    inst = db.query(models.Instructor).filter(
        models.Instructor.id == instructor_id,
        or_(models.Instructor.is_deleted == 0, models.Instructor.is_deleted == None),
        or_(models.Instructor.status == None, models.Instructor.status != "Ջնջված")
    ).first()
    if inst:
        groups = db.query(models.Group).all()
        enrich_instructor(inst, groups, db=db)
    return inst

def update_instructor(db: Session, instructor_id: int, instructor: schemas.InstructorUpdate):
    db_instructor = db.query(models.Instructor).filter(
        models.Instructor.id == instructor_id,
        or_(models.Instructor.is_deleted == 0, models.Instructor.is_deleted == None)
    ).first()
    if db_instructor:
        groups = db.query(models.Group).all()
        old_stats = calculate_instructor_monthly_stats(db_instructor, groups, db=db)
        old_lessons = old_stats["current_month_lessons"]
        update_data = instructor.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_instructor, key, value)
        db.commit()
        db.refresh(db_instructor)
        if "custom_month_lessons" in update_data and update_data["custom_month_lessons"] is not None:
            new_l = max(0, update_data["custom_month_lessons"])
            if new_l != old_lessons:
                log_lesson_edit(
                    db,
                    "instructor",
                    db_instructor.id,
                    f"{db_instructor.first_name} {db_instructor.last_name}".strip(),
                    old_lessons,
                    new_l,
                    "Դասախոսի արված դասերի քանակի խմբագրում"
                )
        enrich_instructor(db_instructor, groups, db=db)
    return db_instructor

def update_instructor_lessons(db: Session, instructor_id: int, lessons_count: int):
    db_instructor = db.query(models.Instructor).filter(
        models.Instructor.id == instructor_id,
        or_(models.Instructor.is_deleted == 0, models.Instructor.is_deleted == None)
    ).first()
    if not db_instructor:
        return None
    groups = db.query(models.Group).all()
    old_stats = calculate_instructor_monthly_stats(db_instructor, groups, db=db)
    old_lessons = old_stats["current_month_lessons"]
    new_lessons = max(0, lessons_count)
    db_instructor.custom_month_lessons = new_lessons
    db.commit()
    db.refresh(db_instructor)
    log_lesson_edit(
        db,
        "instructor",
        db_instructor.id,
        f"{db_instructor.first_name} {db_instructor.last_name}".strip(),
        old_lessons,
        new_lessons,
        "Դասախոսի արված դասերի քանակի խմբագրում"
    )
    return enrich_instructor(db_instructor, groups, db=db)

def delete_instructor(db: Session, instructor_id: int):
    db_instructor = db.query(models.Instructor).filter(models.Instructor.id == instructor_id).first()
    if db_instructor:
        db_instructor.status = "Ջնջված"
        db_instructor.is_deleted = 1
        db_instructor.deleted_at = datetime.datetime.utcnow()
        today_str = str(datetime.date.today())
        active_hists = db.query(models.GroupInstructorHistory).filter(
            models.GroupInstructorHistory.instructor_id == instructor_id,
            models.GroupInstructorHistory.unassigned_date == None
        ).all()
        for ah in active_hists:
            grp = db.query(models.Group).filter(models.Group.id == ah.group_id).first()
            conducted = (grp.conducted_lessons or 0) if grp else (ah.start_lesson or 0)
            ah.unassigned_date = today_str
            ah.end_lesson = conducted
            ah.lessons_taught = max(0, conducted - (ah.start_lesson or 0))
        # Unassign from active groups so deleted instructor doesn't show in frontend
        assigned_grps = db.query(models.Group).filter(models.Group.instructor_id == instructor_id).all()
        for g in assigned_grps:
            g.instructor_id = None
        db.commit()
        db.refresh(db_instructor)
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
        groups = db.query(models.Group).filter(
            or_(models.Group.is_deleted == 0, models.Group.is_deleted == None),
            or_(models.Group.status == None, models.Group.status != "Ջնջված")
        ).all()
        changed = False

        for grp in groups:
            ensure_group_instructor_history(db, grp)
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
                        gl = models.GroupLesson(
                            group_id=grp.id,
                            instructor_id=grp.instructor_id,
                            lesson_date=today_str
                        )
                        db.add(gl)
                        active_hist = db.query(models.GroupInstructorHistory).filter(
                            models.GroupInstructorHistory.group_id == grp.id,
                            models.GroupInstructorHistory.unassigned_date == None
                        ).first()
                        if active_hist:
                            active_hist.lessons_taught = max(0, grp.conducted_lessons - (active_hist.start_lesson or 0))
                        changed = True

        if changed:
            db.commit()
    except Exception as e:
        print("Auto check lessons error:", e)

def enrich_group(grp, db: Session = None):
    if not grp:
        return None
    progress = calculate_group_progress(grp)
    grp.is_started = progress["is_started"]
    grp.completed_lessons = progress["completed_lessons"]
    grp.remaining_lessons = progress["remaining_lessons"]
    grp.progress_percent = progress["progress_percent"]

    if getattr(grp, "instructor", None) and is_record_deleted(grp.instructor):
        grp.instructor = None
        grp.instructor_id = None

    if getattr(grp, "course", None) and is_record_deleted(grp.course):
        grp.course = None

    active_students = [st for st in (getattr(grp, 'students', []) or []) if not is_record_deleted(st)]
    for st in active_students:
        try:
            enrich_student(st, db=db)
        except Exception:
            pass
    grp.students = active_students

    deleted_inst_ids = set()
    if db is not None:
        try:
            del_insts = db.query(models.Instructor.id).filter(
                or_(models.Instructor.is_deleted == 1, models.Instructor.status == "Ջնջված")
            ).all()
            deleted_inst_ids = {r[0] for r in del_insts}
        except Exception:
            pass

    history_items = []
    try:
        raw_hist = getattr(grp, 'instructor_history', []) or []
        if db is not None and not raw_hist:
            ensure_group_instructor_history(db, grp)
            raw_hist = db.query(models.GroupInstructorHistory).filter(
                models.GroupInstructorHistory.group_id == grp.id
            ).order_by(models.GroupInstructorHistory.id.asc()).all()
        else:
            raw_hist = sorted(raw_hist, key=lambda x: x.id or 0)

        for h in raw_hist:
            if h.instructor_id in deleted_inst_ids:
                continue
            is_curr = h.unassigned_date is None
            taught = max(0, (grp.conducted_lessons or 0) - (h.start_lesson or 0)) if is_curr else (h.lessons_taught or 0)
            history_items.append({
                "id": h.id,
                "group_id": grp.id,
                "instructor_id": h.instructor_id,
                "instructor_name": h.instructor_name or "",
                "assigned_date": h.assigned_date,
                "unassigned_date": h.unassigned_date,
                "start_lesson": h.start_lesson or 0,
                "end_lesson": h.end_lesson,
                "lessons_taught": taught,
                "is_current": is_curr
            })
    except Exception as he:
        print("enrich_group history error:", he)

    grp.instructor_history_list = history_items
    if db is not None and getattr(grp, "id", None):
        grp.lesson_edit_history = get_lesson_edit_history(db, "group", grp.id)
    else:
        grp.lesson_edit_history = []
    return grp

def get_groups(db: Session, skip: int = 0, limit: int = 100, include_deleted: bool = False):
    auto_check_daily_group_lessons(db)
    query = db.query(models.Group).filter(
        or_(models.Group.is_deleted == 0, models.Group.is_deleted == None),
        or_(models.Group.status == None, models.Group.status != "Ջնջված")
    )
    groups = query.offset(skip).limit(limit).all()
    for grp in groups:
        enrich_group(grp, db=db)
    return groups

def get_group(db: Session, group_id: int):
    grp = db.query(models.Group).filter(
        models.Group.id == group_id,
        or_(models.Group.is_deleted == 0, models.Group.is_deleted == None),
        or_(models.Group.status == None, models.Group.status != "Ջնջված")
    ).first()
    return enrich_group(grp, db=db)

def conduct_group_lesson(db: Session, group_id: int):
    grp = db.query(models.Group).filter(models.Group.id == group_id).first()
    if not grp or is_record_deleted(grp):
        return None
    ensure_group_instructor_history(db, grp)
    today_str = str(datetime.date.today())
    old_c = grp.conducted_lessons or 0
    grp.conducted_lessons = old_c + 1
    grp.last_lesson_date = today_str
    gl = models.GroupLesson(
        group_id=grp.id,
        instructor_id=grp.instructor_id,
        lesson_date=today_str
    )
    db.add(gl)
    active_hist = db.query(models.GroupInstructorHistory).filter(
        models.GroupInstructorHistory.group_id == grp.id,
        models.GroupInstructorHistory.unassigned_date == None
    ).first()
    if active_hist:
        active_hist.lessons_taught = max(0, grp.conducted_lessons - (active_hist.start_lesson or 0))
    db.commit()
    db.refresh(grp)
    grp_course_label = grp.course.title if getattr(grp, 'course', None) else "Խումբ"
    log_lesson_edit(db, "group", grp.id, grp_course_label, old_c, grp.conducted_lessons, "Խմբի դասի ավելացում (+1)")
    return enrich_group(grp, db=db)

def revert_group_lesson(db: Session, group_id: int):
    grp = db.query(models.Group).filter(models.Group.id == group_id).first()
    if not grp or is_record_deleted(grp):
        return None
    ensure_group_instructor_history(db, grp)
    current = grp.conducted_lessons or 0
    if current > 0:
        grp.conducted_lessons = current - 1
        last_gl = db.query(models.GroupLesson).filter(models.GroupLesson.group_id == group_id).order_by(models.GroupLesson.id.desc()).first()
        if last_gl:
            db.delete(last_gl)
        active_hist = db.query(models.GroupInstructorHistory).filter(
            models.GroupInstructorHistory.group_id == grp.id,
            models.GroupInstructorHistory.unassigned_date == None
        ).first()
        if active_hist:
            if grp.conducted_lessons < (active_hist.start_lesson or 0):
                active_hist.start_lesson = grp.conducted_lessons
            active_hist.lessons_taught = max(0, grp.conducted_lessons - (active_hist.start_lesson or 0))
        db.commit()
        db.refresh(grp)
        grp_course_label = grp.course.title if getattr(grp, 'course', None) else "Խումբ"
        log_lesson_edit(db, "group", grp.id, grp_course_label, current, grp.conducted_lessons, "Խմբի դասի նվազեցում (-1)")
    return enrich_group(grp, db=db)

def create_group(db: Session, group: schemas.GroupCreate):
    data = group.dict()
    data["name"] = ""
    if data.get("conducted_lessons") is None:
        data["conducted_lessons"] = 0
    if not data.get("last_lesson_date"):
        data["last_lesson_date"] = str(datetime.date.today())
    db_group = models.Group(**data, status="Ակտիվ", is_deleted=0)
    db.add(db_group)
    db.commit()
    db.refresh(db_group)
    ensure_group_instructor_history(db, db_group)
    return enrich_group(db_group, db=db)

def update_group(db: Session, group_id: int, group: schemas.GroupUpdate):
    db_group = db.query(models.Group).filter(
        models.Group.id == group_id,
        or_(models.Group.is_deleted == 0, models.Group.is_deleted == None)
    ).first()
    if db_group:
        ensure_group_instructor_history(db, db_group)
        old_instructor_id = db_group.instructor_id
        old_conducted = db_group.conducted_lessons or 0
        update_data = group.dict(exclude_unset=True)
        update_data["name"] = ""
        new_instructor_id = update_data.get("instructor_id", old_instructor_id)
        
        for key, value in update_data.items():
            setattr(db_group, key, value)
        db.commit()
        db.refresh(db_group)

        today_str = str(datetime.date.today())
        conducted = db_group.conducted_lessons or 0
        grp_course_label = db_group.course.title if getattr(db_group, 'course', None) else "Խումբ"

        if conducted != old_conducted:
            log_lesson_edit(
                db,
                "group",
                db_group.id,
                grp_course_label,
                old_conducted,
                conducted,
                "Խմբի արված դասերի քանակի խմբագրում"
            )

        if new_instructor_id != old_instructor_id:
            # Close previous instructor's active history record, preserving their lessons taught
            active_hist = db.query(models.GroupInstructorHistory).filter(
                models.GroupInstructorHistory.group_id == db_group.id,
                models.GroupInstructorHistory.unassigned_date == None
            ).first()
            if active_hist:
                active_hist.unassigned_date = today_str
                active_hist.end_lesson = conducted
                active_hist.lessons_taught = max(0, conducted - (active_hist.start_lesson or 0))
            
            # Open new history record for the new instructor starting at current conducted_lessons
            if new_instructor_id:
                new_inst = db.query(models.Instructor).filter(models.Instructor.id == new_instructor_id).first()
                inst_name = f"{new_inst.first_name} {new_inst.last_name}".strip() if new_inst else f"Դասախոս #{new_instructor_id}"
                new_hist = models.GroupInstructorHistory(
                    group_id=db_group.id,
                    instructor_id=new_instructor_id,
                    instructor_name=inst_name,
                    assigned_date=today_str,
                    unassigned_date=None,
                    start_lesson=conducted,
                    end_lesson=None,
                    lessons_taught=0
                )
                db.add(new_hist)
            db.commit()
            db.refresh(db_group)
        else:
            # Update current instructor's lessons_taught if conducted_lessons was edited
            active_hist = db.query(models.GroupInstructorHistory).filter(
                models.GroupInstructorHistory.group_id == db_group.id,
                models.GroupInstructorHistory.unassigned_date == None
            ).first()
            if active_hist:
                old_inst_taught = active_hist.lessons_taught or 0
                if conducted < (active_hist.start_lesson or 0):
                    active_hist.start_lesson = conducted
                new_inst_taught = max(0, conducted - (active_hist.start_lesson or 0))
                active_hist.lessons_taught = new_inst_taught
                db.commit()
                if conducted != old_conducted and active_hist.instructor_id:
                    log_lesson_edit(
                        db,
                        "instructor",
                        active_hist.instructor_id,
                        active_hist.instructor_name,
                        old_inst_taught,
                        new_inst_taught,
                        "Խմբի դասերի խմբագրմամբ դասախոսի դասերի փոփոխություն"
                    )

        enrich_group(db_group, db=db)
    return db_group

def delete_group(db: Session, group_id: int):
    db_group = db.query(models.Group).filter(models.Group.id == group_id).first()
    if db_group:
        # Preserve attended lessons for students in this group before marking group deleted
        for st in (getattr(db_group, 'students', []) or []):
            try:
                stats = calculate_student_balance(st, db=db)
                st.custom_lessons_attended = stats["total_lessons_attended"]
            except Exception:
                pass
        db_group.status = "Ջնջված"
        db_group.is_deleted = 1
        db_group.deleted_at = datetime.datetime.utcnow()
        today_str = str(datetime.date.today())
        conducted = db_group.conducted_lessons or 0
        active_hist = db.query(models.GroupInstructorHistory).filter(
            models.GroupInstructorHistory.group_id == db_group.id,
            models.GroupInstructorHistory.unassigned_date == None
        ).first()
        if active_hist:
            active_hist.unassigned_date = today_str
            active_hist.end_lesson = conducted
            active_hist.lessons_taught = max(0, conducted - (active_hist.start_lesson or 0))
        db.commit()
        db.refresh(db_group)
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
    return enrich_group(group, db=db)

def update_student_group_offset(
    db: Session,
    student_id: int,
    group_id: int,
    initial_lessons: int = None,
    attended_lessons: int = None
):
    lnk = db.query(models.StudentGroupLink).filter(
        models.StudentGroupLink.student_id == student_id,
        models.StudentGroupLink.group_id == group_id
    ).first()
    if not lnk:
        return None
    grp = db.query(models.Group).filter(models.Group.id == group_id).first()
    st = db.query(models.Student).filter(models.Student.id == student_id).first()
    grp_conducted = (grp.conducted_lessons or 0) if grp else 0
    old_attended = max(0, grp_conducted - (lnk.initial_lessons or 0))

    if attended_lessons is not None:
        # User specified directly how many lessons this student attended in this group
        lnk.initial_lessons = grp_conducted - max(0, attended_lessons)
    elif initial_lessons is not None:
        lnk.initial_lessons = max(0, initial_lessons)

    db.commit()
    new_attended = max(0, grp_conducted - (lnk.initial_lessons or 0))
    if st and new_attended != old_attended:
        log_lesson_edit(
            db,
            "student",
            st.id,
            st.full_name,
            old_attended,
            new_attended,
            "Ուսանողի դասերի խմբագրում խմբում"
        )
    return get_student(db, student_id)

def update_student_total_lessons(db: Session, student_id: int, total_lessons: int):
    st = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not st or is_record_deleted(st):
        return None
    old_stats = calculate_student_balance(st, db=db)
    old_lessons = old_stats["total_lessons_attended"]
    target_lessons = max(0, total_lessons)
    active_groups = [g for g in (getattr(st, 'groups', []) or []) if not is_record_deleted(g)]
    if len(active_groups) == 0:
        st.custom_lessons_attended = target_lessons
        db.commit()
    else:
        # Adjust the first group's initial_lessons so total attended across groups equals target_lessons
        links = db.query(models.StudentGroupLink).filter(
            models.StudentGroupLink.student_id == student_id
        ).all()
        links_map = {l.group_id: l for l in links}
        other_groups_attended = 0
        first_grp = active_groups[0]
        for grp in active_groups[1:]:
            grp_cond = grp.conducted_lessons or 0
            lnk = links_map.get(grp.id)
            init_l = (lnk.initial_lessons or 0) if lnk else 0
            other_groups_attended += max(0, grp_cond - init_l)
        
        needed_in_first = max(0, target_lessons - other_groups_attended)
        first_cond = first_grp.conducted_lessons or 0
        first_lnk = links_map.get(first_grp.id)
        if first_lnk:
            first_lnk.initial_lessons = first_cond - needed_in_first
            db.commit()
    if target_lessons != old_lessons:
        log_lesson_edit(
            db,
            "student",
            st.id,
            st.full_name,
            old_lessons,
            target_lessons,
            "Ուսանողի արված դասերի քանակի խմբագրում"
        )
    return get_student(db, student_id)

def get_monthly_student_trend(db: Session, days_count: int = 8):
    import datetime
    record_daily_student_snapshot(db)
    today = datetime.date.today()
    weeks_count = days_count if days_count <= 16 else 8
    current_monday = today - datetime.timedelta(days=today.weekday())
    first_monday = current_monday - datetime.timedelta(weeks=weeks_count - 1)

    all_students = db.query(models.Student).all()
    snapshots = db.query(models.StudentDailySnapshot).filter(
        models.StudentDailySnapshot.snapshot_date >= str(first_monday - datetime.timedelta(days=7))
    ).all()
    snap_map = {s.snapshot_date: s.student_count for s in snapshots}

    def reconstruct_count_for_day(d: datetime.date):
        d_str = str(d)
        if d_str in snap_map:
            return snap_map[d_str]
        cnt = 0
        for st in all_students:
            if getattr(st, 'status', None) in ["Արխիվ", "Ավարտած", "Ջնջված"]:
                continue
            st_date = None
            if getattr(st, 'created_at', None):
                try:
                    st_date = st.created_at.date()
                except Exception:
                    pass
            del_date = None
            if getattr(st, 'is_deleted', 0) and getattr(st, 'deleted_at', None):
                try:
                    del_date = st.deleted_at.date()
                except Exception:
                    pass
            if (st_date is None or st_date <= d) and (del_date is None or d < del_date):
                cnt += 1
        return cnt

    result = []
    prev_sunday = first_monday - datetime.timedelta(days=1)
    prev_count = reconstruct_count_for_day(prev_sunday)

    for w in range(weeks_count):
        week_start = first_monday + datetime.timedelta(weeks=w)
        week_end = min(today, week_start + datetime.timedelta(days=6))
        curr_count = reconstruct_count_for_day(week_end)
        diff = curr_count - prev_count
        status = "down" if diff < 0 else "up_or_same"
        label = f"{week_start.strftime('%d.%m')}-{week_end.strftime('%d.%m')}"
        result.append({
            "date": f"{week_start.strftime('%d.%m.%Y')} - {week_end.strftime('%d.%m.%Y')}",
            "label": label,
            "count": curr_count,
            "diff": diff,
            "status": status
        })
        prev_count = curr_count

    return result


