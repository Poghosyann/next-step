from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime

# =================
# Course Schemas
# =================
class CourseBase(BaseModel):
    title: str
    description: Optional[str] = None

class CourseCreate(CourseBase):
    pass

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

class InstructorCreate(InstructorBase):
    pass

class Instructor(InstructorBase):
    id: int
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
    phone: str
    email: EmailStr
    monthly_fee: Optional[int] = 0
    discount_percent: Optional[int] = 0
    gift_card: Optional[int] = 0
    source: Optional[str] = None
    comment: Optional[str] = None
    urgent_notes: Optional[str] = None

class StudentCreate(StudentBase):
    pass

class Student(StudentBase):
    id: int
    created_at: datetime
    payments: List['Payment'] = []
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
    payment_date: datetime
    class Config:
        orm_mode = True

# =================
# Group Schemas
# =================
class GroupBase(BaseModel):
    name: str
    course_id: int
    instructor_id: Optional[int] = None
    start_date: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    days: Optional[str] = None
    notes: Optional[str] = None

class GroupCreate(GroupBase):
    pass

class Group(GroupBase):
    id: int
    course: Optional[Course] = None
    instructor: Optional[Instructor] = None
    students: List[Student] = []
    class Config:
        orm_mode = True

# =================
# Extra operations
# =================
class GroupStudentAdd(BaseModel):
    student_ids: List[int]
