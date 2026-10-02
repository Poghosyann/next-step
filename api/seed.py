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
        
        # Create 10000 Students for scale testing
        print("Creating 10,000 test students (this may take a minute)...")
        new_students = []
        for i in range(1, 10001):
            new_students.append(models.Student(
                full_name=f"Ուսանող {i}", 
                email=f"student{i}@example.com", 
                phone=f"+37477{str(i).zfill(6)}", 
                course_direction="Python Web & ML Advanced" if i % 2 == 0 else "React Advanced",
                status="Ընթացիկ ուսանող" if i % 3 == 0 else "Ավարտած",
                monthly_fee=95000 if i % 2 == 0 else 85000
            ))
            
            # Commit in batches of 1000 to save memory
            if i % 1000 == 0:
                db.bulk_save_objects(new_students)
                db.commit()
                new_students = []
        
        # Get a couple of students for groups
        student1 = db.query(models.Student).filter(models.Student.email == "student1@example.com").first()
        student2 = db.query(models.Student).filter(models.Student.email == "student2@example.com").first()
        student3 = db.query(models.Student).filter(models.Student.email == "student3@example.com").first()
        
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
