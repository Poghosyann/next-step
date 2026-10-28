from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime

class LoginRequest(BaseModel):
    username: str
    password: str

# =================
# Course Schemas
# =================
class CourseBase(BaseModel):
    title: str
    description: Optional[str] = None
    total_lessons: Optional[int] = 0

class CourseCreate(BaseModel):
    title: str
    description: Optional[str] = None
    total_lessons: Optional[int] = 0

class CourseUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    total_lessons: Optional[int] = None

class Course(CourseBase):
    id: int
    class Config:
        orm_mode = True

# =================
# Instructor Schemas
# =================
class InstructorBase(BaseModel):
    first_name: str
    last_name: str
    phone: str
    specialization: Optional[str] = None
    rate_per_lesson: Optional[int] = 0

class InstructorCreate(InstructorBase):
    pass

class InstructorUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    specialization: Optional[str] = None
    rate_per_lesson: Optional[int] = None

class Instructor(InstructorBase):
    id: int
    status: Optional[str] = "Ակտիվ"
    is_deleted: Optional[int] = 0
    deleted_at: Optional[datetime] = None
    current_month_lessons: Optional[int] = 0
    current_month_salary: Optional[int] = 0
    total_lessons_taught: Optional[int] = 0
    assigned_groups: Optional[List[str]] = []
    class Config:
        orm_mode = True

# =================
# Student Schemas
# =================
class StudentBase(BaseModel):
    full_name: str
    course_direction: Optional[str] = None
    course_format: Optional[str] = None
    location: Optional[str] = None
    status: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    monthly_fee: Optional[int] = 0
    discount_percent: Optional[int] = 0
    gift_card: Optional[int] = 0
    source: Optional[str] = None
    comment: Optional[str] = None
    urgent_notes: Optional[str] = None
    custom_lessons_attended: Optional[int] = None

class StudentCreate(StudentBase):
    pass

class StudentUpdate(BaseModel):
    full_name: Optional[str] = None
    course_direction: Optional[str] = None
    course_format: Optional[str] = None
    location: Optional[str] = None
    status: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    monthly_fee: Optional[int] = None
    discount_percent: Optional[int] = None
    gift_card: Optional[int] = None
    source: Optional[str] = None
    comment: Optional[str] = None
    urgent_notes: Optional[str] = None
    custom_lessons_attended: Optional[int] = None

class StudentGroupDetail(BaseModel):
    group_id: int
    group_name: str
    course_title: Optional[str] = None
    days: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    group_conducted_lessons: int = 0
    initial_lessons: int = 0
    student_attended_lessons: int = 0

class StudentGroupOffsetUpdate(BaseModel):
    initial_lessons: Optional[int] = None
    attended_lessons: Optional[int] = None

class Student(StudentBase):
    id: int
    is_deleted: Optional[int] = 0
    deleted_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    payments: List['Payment'] = []
    total_paid: Optional[int] = 0
    total_charged: Optional[int] = 0
    total_lessons_attended: Optional[int] = 0
    lesson_cost: Optional[int] = 0
    balance: Optional[int] = 0
    group_names: Optional[List[str]] = []
    student_groups: Optional[List[StudentGroupDetail]] = []
    class Config:
        orm_mode = True

class PaymentBase(BaseModel):
    student_id: int
    amount: int
    method: Optional[str] = None
    notes: Optional[str] = None

class PaymentCreate(PaymentBase):
    pass

class Payment(PaymentBase):
    id: int
    payment_date: Optional[datetime] = None
    class Config:
        orm_mode = True

from typing import Generic, TypeVar
T = TypeVar('T')

class PaginatedResponse(BaseModel, Generic[T]):
    total: int
    items: List[T]

# =================
# Group Schemas
# =================
class GroupInstructorHistoryItem(BaseModel):
    id: Optional[int] = None
    group_id: int
    instructor_id: Optional[int] = None
    instructor_name: str
    assigned_date: Optional[str] = None
    unassigned_date: Optional[str] = None
    start_lesson: int = 0
    end_lesson: Optional[int] = None
    lessons_taught: int = 0
    is_current: bool = False
    class Config:
        orm_mode = True

class GroupBase(BaseModel):
    name: str
    course_id: int
    instructor_id: Optional[int] = None
    start_date: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    days: Optional[str] = None
    notes: Optional[str] = None
    conducted_lessons: Optional[int] = 0
    last_lesson_date: Optional[str] = None

class GroupCreate(GroupBase):
    pass

class GroupUpdate(BaseModel):
    name: Optional[str] = None
    course_id: Optional[int] = None
    instructor_id: Optional[int] = None
    start_date: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    days: Optional[str] = None
    notes: Optional[str] = None
    conducted_lessons: Optional[int] = None
    last_lesson_date: Optional[str] = None
    status: Optional[str] = None

class Group(GroupBase):
    id: int
    status: Optional[str] = "Ակտիվ"
    is_deleted: Optional[int] = 0
    deleted_at: Optional[datetime] = None
    course: Optional[Course] = None
    instructor: Optional[Instructor] = None
    students: List[Student] = []
    completed_lessons: Optional[int] = 0
    remaining_lessons: Optional[int] = 0
    progress_percent: Optional[int] = 0
    is_started: Optional[bool] = False
    instructor_history_list: Optional[List[GroupInstructorHistoryItem]] = []
    class Config:
        orm_mode = True

# =================
# Extra operations
# =================
class GroupStudentAdd(BaseModel):
    student_ids: List[int]

class PasswordChange(BaseModel):
    current_password: str
    new_password: str

class DebtsSummary(BaseModel):
    total_debtors: int
    total_debt_amount: int
    items: List[Student]
