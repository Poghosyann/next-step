from sqlalchemy import Column, Integer, String, ForeignKey, Table, DateTime
from sqlalchemy.orm import relationship
from database import Base
import datetime

# Many-to-Many association table for Group <-> Student
group_student_table = Table(
    'group_student', Base.metadata,
    Column('group_id', Integer, ForeignKey('groups.id'), primary_key=True),
    Column('student_id', Integer, ForeignKey('students.id'), primary_key=True)
)

class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(String)

    groups = relationship("Group", back_populates="course")


class Instructor(Base):
    __tablename__ = "instructors"

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String)
    last_name = Column(String)
    phone = Column(String)
    specialization = Column(String)

    groups = relationship("Group", back_populates="instructor")


class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String)
    course_direction = Column(String)
    course_format = Column(String)
    location = Column(String)
    status = Column(String)
    phone = Column(String)
    email = Column(String, unique=True, index=True)
    monthly_fee = Column(Integer)
    discount_percent = Column(Integer)
    gift_card = Column(Integer)
    source = Column(String)
    comment = Column(String)
    urgent_notes = Column(String)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    groups = relationship("Group", secondary=group_student_table, back_populates="students")
    payments = relationship("Payment", back_populates="student")

class Group(Base):
    __tablename__ = "groups"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"))
    instructor_id = Column(Integer, ForeignKey("instructors.id"))
    
    start_date = Column(String)
    start_time = Column(String)
    end_time = Column(String)
    days = Column(String) # Comma separated like "Երկ., Չոր., Ուրբ."
    notes = Column(String)

    course = relationship("Course", back_populates="groups")
    instructor = relationship("Instructor", back_populates="groups")
    students = relationship("Student", secondary=group_student_table, back_populates="groups")

class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"))
    amount = Column(Integer)
    payment_date = Column(DateTime, default=datetime.datetime.utcnow)
    method = Column(String)
    notes = Column(String)

    student = relationship("Student", back_populates="payments")
