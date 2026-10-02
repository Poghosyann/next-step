import models, schemas, crud
from database import SessionLocal, engine

def seed():
    # Ensure tables are created
    models.Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # Check if we already have data to prevent duplicate seeding
        if crud.get_courses(db, limit=1):
            print("Database already seeded!")
            return

        print("Seeding database...")
        
        # Create Courses
        course1 = crud.create_course(db, schemas.CourseCreate(title="Ֆինանսական հաշվառում", description="Հաշվապահության հիմունքներ"))
        course2 = crud.create_course(db, schemas.CourseCreate(title="Հարկային հաշվառում", description="ՀՀ հարկային օրենսդրություն"))
        
        # Create Instructors
        instructor1 = crud.create_instructor(db, schemas.InstructorCreate(first_name="Անահիտ", last_name="Գրիգորյան", phone="+37444000000", specialization="Ֆինանսական հաշվառում"))
        instructor2 = crud.create_instructor(db, schemas.InstructorCreate(first_name="Արմեն", last_name="Պետրոսյան", phone="+37499000000", specialization="Հարկային հաշվառում"))
        
        # Create 20 Students for scale testing
        print("Creating 20 test students...")
        new_students = []
        for i in range(1, 21):
            new_students.append(models.Student(
                full_name=f"Ուսանող {i}", 
                email=f"student{i}@example.com", 
                phone=f"+37477{str(i).zfill(6)}", 
                course_direction="Ֆինանսական հաշվառում" if i % 2 == 0 else "Հարկային հաշվառում",
                status="Ընթացիկ ուսանող" if i % 3 == 0 else "Ավարտած",
                monthly_fee=95000 if i % 2 == 0 else 85000
            ))
            
            if i % 20 == 0:
                db.bulk_save_objects(new_students)
                db.commit()
                new_students = []
        
        # Get a couple of students for groups
        student1 = db.query(models.Student).filter(models.Student.email == "student1@example.com").first()
        student2 = db.query(models.Student).filter(models.Student.email == "student2@example.com").first()
        student3 = db.query(models.Student).filter(models.Student.email == "student3@example.com").first()
        
        # Create Groups
        group1 = crud.create_group(db, schemas.GroupCreate(name="ՖՀ-101", course_id=course1.id, instructor_id=instructor1.id))
        group2 = crud.create_group(db, schemas.GroupCreate(name="ՀՀ-201", course_id=course2.id, instructor_id=instructor2.id))
        
        # Add Students to Groups
        crud.add_students_to_group(db, group1.id, [student1.id, student2.id])
        crud.add_students_to_group(db, group2.id, [student2.id, student3.id])

        print("Seeding complete!")

    finally:
        db.close()

if __name__ == "__main__":
    seed()
