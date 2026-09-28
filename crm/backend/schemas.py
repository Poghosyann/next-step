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
    first_name: str
    last_name: str
    email: EmailStr
    phone: str

class StudentCreate(StudentBase):
    pass

class Student(StudentBase):
    id: int
    created_at: datetime
    class Config:
        orm_mode = True

# =================
# Group Schemas
# =================
class GroupBase(BaseModel):
    name: str
    course_id: int
    instructor_id: Optional[int] = None

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
