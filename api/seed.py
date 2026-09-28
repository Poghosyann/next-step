import models, schemas, crud
from database import SessionLocal, engine

# Ensure tables are created
models.Base.metadata.create_all(bind=engine)

def seed():
    db = SessionLocal()
    try:
        # Check if we already have data to prevent duplicate seeding
        if crud.get_courses(db, limit=1):
            print("Database already seeded!")
            return

        print("Seeding database...")
        
        # Create Courses
        course1 = crud.create_course(db, schemas.CourseCreate(title="Python for Beginners", description="Learn Python from scratch"))
        course2 = crud.create_course(db, schemas.CourseCreate(title="Advanced FastAPI", description="Build robust APIs"))
        
        # Create Instructors
        instructor1 = crud.create_instructor(db, schemas.InstructorCreate(first_name="Jane", last_name="Doe", phone="1234567890", specialization="Python"))
        instructor2 = crud.create_instructor(db, schemas.InstructorCreate(first_name="John", last_name="Smith", phone="0987654321", specialization="FastAPI"))
        
        # Create Students
        student1 = crud.create_student(db, schemas.StudentCreate(first_name="Alice", last_name="Johnson", email="alice@example.com", phone="1112223333"))
        student2 = crud.create_student(db, schemas.StudentCreate(first_name="Bob", last_name="Williams", email="bob@example.com", phone="4445556666"))
        student3 = crud.create_student(db, schemas.StudentCreate(first_name="Charlie", last_name="Brown", email="charlie@example.com", phone="7778889999"))
        
        # Create Groups
        group1 = crud.create_group(db, schemas.GroupCreate(name="PY-101", course_id=course1.id, instructor_id=instructor1.id))
        group2 = crud.create_group(db, schemas.GroupCreate(name="FAST-201", course_id=course2.id, instructor_id=instructor2.id))
        
        # Add Students to Groups
        crud.add_students_to_group(db, group1.id, [student1.id, student2.id])
        crud.add_students_to_group(db, group2.id, [student2.id, student3.id])

        print("Seeding complete!")

    finally:
        db.close()

if __name__ == "__main__":
    seed()
