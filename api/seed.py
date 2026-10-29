import datetime
import models, schemas, crud
from database import SessionLocal, engine

SEED_MARKER_USERNAME = "__seed_v3_no_group_names__"

def seed(force_reset: bool = False):
    models.Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        marker = crud.get_admin(db, SEED_MARKER_USERNAME)
        if marker and not force_reset:
            return

        print("Resetting and seeding realistic CRM dataset (50 students, 10 groups, 3 instructors, 3 courses)...")

        # 1. Clear existing test data in safe foreign-key order
        try:
            db.query(models.LessonEditHistory).delete(synchronize_session=False)
            db.query(models.GroupInstructorHistory).delete(synchronize_session=False)
            db.query(models.GroupLesson).delete(synchronize_session=False)
            db.query(models.Payment).delete(synchronize_session=False)
            db.query(models.StudentGroupLink).delete(synchronize_session=False)
            db.query(models.StudentDailySnapshot).delete(synchronize_session=False)
            db.query(models.Group).delete(synchronize_session=False)
            db.query(models.Student).delete(synchronize_session=False)
            db.query(models.Instructor).delete(synchronize_session=False)
            db.query(models.Course).delete(synchronize_session=False)
            db.commit()
        except Exception as clear_err:
            db.rollback()
            print("Clear error:", clear_err)

        # Ensure admin exists
        if not crud.get_admin(db, "admin"):
            crud.create_admin(db, "admin", "admin123")

        today = datetime.date.today()
        today_str = str(today)

        # 2. Create 3 Courses
        c_fin = models.Course(
            title="Ֆինանսական հաշվառում",
            description="Հաշվապահական հաշվառման հիմունքներ, հաշվային պլան, ֆինանսական հաշվետվություններ և գործնական խնդիրներ",
            total_lessons=24,
            status="Ակտիվ",
            is_deleted=0
        )
        c_tax = models.Course(
            title="Հարկային հաշվառում",
            description="ՀՀ հարկային օրենսգիրք, ԱԱՀ, շահութահարկ, շրջանառության հարկ, e-Invoicing և հաշվետվությունների ներկայացում",
            total_lessons=16,
            status="Ակտիվ",
            is_deleted=0
        )
        c_1c = models.Course(
            title="1C ՀԾ ծրագրեր",
            description="ՀԾ-Հաշվապահ և 1C 8.3 ծրագրերի խորացված գործնական կիրառում իրական կազմակերպության օրինակով",
            total_lessons=16,
            status="Ակտիվ",
            is_deleted=0
        )
        db.add_all([c_fin, c_tax, c_1c])
        db.commit()
        db.refresh(c_fin)
        db.refresh(c_tax)
        db.refresh(c_1c)

        # 3. Create 3 Instructors
        inst1 = models.Instructor(
            first_name="Անահիտ",
            last_name="Գրիգորյան",
            phone="+374 91 45 23 18",
            specialization="Ֆինանսական հաշվառում, 1C ՀԾ ծրագրեր",
            rate_per_lesson=6000,
            status="Ակտիվ",
            is_deleted=0
        )
        inst2 = models.Instructor(
            first_name="Արմեն",
            last_name="Պետրոսյան",
            phone="+374 99 78 12 45",
            specialization="Հարկային հաշվառում, Ֆինանսական հաշվառում",
            rate_per_lesson=7000,
            status="Ակտիվ",
            is_deleted=0
        )
        inst3 = models.Instructor(
            first_name="Մարիամ",
            last_name="Հովհաննիսյան",
            phone="+374 77 34 89 12",
            specialization="1C ՀԾ ծրագրեր, Հարկային հաշվառում",
            rate_per_lesson=5500,
            status="Ակտիվ",
            is_deleted=0
        )
        db.add_all([inst1, inst2, inst3])
        db.commit()
        db.refresh(inst1)
        db.refresh(inst2)
        db.refresh(inst3)

        # 4. Create 10 Groups with varying conducted_lessons (2 lessons per week, 8 lessons per month)
        groups_spec = [
            {
                "name": "",
                "course_id": c_fin.id,
                "instructor_id": inst1.id,
                "start_date": str(today - datetime.timedelta(days=50)),
                "start_time": "18:30",
                "end_time": "20:30",
                "days": "Երկ., Չրք.",
                "notes": "Երեկոյան հիմնական խումբ, 2-րդ փուլ",
                "conducted_lessons": 14
            },
            {
                "name": "",
                "course_id": c_fin.id,
                "instructor_id": inst1.id,
                "start_date": str(today - datetime.timedelta(days=35)),
                "start_time": "19:00",
                "end_time": "21:00",
                "days": "Երք., Հնգ.",
                "notes": "Դասախոսի փոփոխությամբ խումբ",
                "conducted_lessons": 10
            },
            {
                "name": "",
                "course_id": c_fin.id,
                "instructor_id": inst2.id,
                "start_date": str(today - datetime.timedelta(days=21)),
                "start_time": "11:00",
                "end_time": "13:00",
                "days": "Երկ., Չրք.",
                "notes": "Ցերեկային խումբ",
                "conducted_lessons": 6
            },
            {
                "name": "",
                "course_id": c_fin.id,
                "instructor_id": inst1.id,
                "start_date": str(today - datetime.timedelta(days=8)),
                "start_time": "16:00",
                "end_time": "18:00",
                "days": "Երք., Հնգ.",
                "notes": "Նոր մեկնարկած խումբ",
                "conducted_lessons": 2
            },
            {
                "name": "",
                "course_id": c_tax.id,
                "instructor_id": inst2.id,
                "start_date": str(today - datetime.timedelta(days=42)),
                "start_time": "19:00",
                "end_time": "21:00",
                "days": "Չրք., Ուրբ.",
                "notes": "Հարկային օրենսգրքի խորացված խումբ",
                "conducted_lessons": 12
            },
            {
                "name": "",
                "course_id": c_tax.id,
                "instructor_id": inst2.id,
                "start_date": str(today - datetime.timedelta(days=25)),
                "start_time": "18:30",
                "end_time": "20:30",
                "days": "Երք., Հնգ.",
                "notes": "Գործող հաշվապահների վերապատրաստում",
                "conducted_lessons": 7
            },
            {
                "name": "",
                "course_id": c_tax.id,
                "instructor_id": inst3.id,
                "start_date": str(today - datetime.timedelta(days=14)),
                "start_time": "20:00",
                "end_time": "22:00",
                "days": "Երկ., Չրք.",
                "notes": "Հեռավար (Zoom) ձևաչափով խումբ",
                "conducted_lessons": 4
            },
            {
                "name": "",
                "course_id": c_1c.id,
                "instructor_id": inst3.id,
                "start_date": str(today - datetime.timedelta(days=35)),
                "start_time": "18:30",
                "end_time": "20:30",
                "days": "Երք., Հնգ.",
                "notes": "ՀԾ-Հաշվապահ + 1C 8.3 պրակտիկ խումբ",
                "conducted_lessons": 10
            },
            {
                "name": "",
                "course_id": c_1c.id,
                "instructor_id": inst3.id,
                "start_date": str(today - datetime.timedelta(days=18)),
                "start_time": "19:00",
                "end_time": "21:00",
                "days": "Չրք., Ուրբ.",
                "notes": "Երեկոյան պրակտիկ խումբ",
                "conducted_lessons": 5
            },
            {
                "name": "",
                "course_id": c_1c.id,
                "instructor_id": inst1.id,
                "start_date": str(today - datetime.timedelta(days=3)),
                "start_time": "13:00",
                "end_time": "15:00",
                "days": "Հնգ., Շբթ.",
                "notes": "Նոր ձևավորված խումբ",
                "conducted_lessons": 1
            }
        ]

        created_groups = []
        for g_data in groups_spec:
            grp = models.Group(
                **g_data,
                last_lesson_date=today_str,
                status="Ակտիվ",
                is_deleted=0
            )
            db.add(grp)
            created_groups.append(grp)
        db.commit()
        for grp in created_groups:
            db.refresh(grp)

        # Populate GroupInstructorHistory & GroupLesson records for realistic instructor stats
        inst_map = {
            inst1.id: f"{inst1.first_name} {inst1.last_name}",
            inst2.id: f"{inst2.first_name} {inst2.last_name}",
            inst3.id: f"{inst3.first_name} {inst3.last_name}",
        }

        for idx, grp in enumerate(created_groups):
            cond = grp.conducted_lessons or 0
            if idx == 1:
                # Group 2 (ՖՀ-102): demonstrate instructor change history (Armen taught 6 lessons, Anahit taught 9 lessons)
                h_prev = models.GroupInstructorHistory(
                    group_id=grp.id,
                    instructor_id=inst2.id,
                    instructor_name=inst_map[inst2.id],
                    assigned_date=grp.start_date,
                    unassigned_date=str(today - datetime.timedelta(days=20)),
                    start_lesson=0,
                    end_lesson=6,
                    lessons_taught=6
                )
                h_curr = models.GroupInstructorHistory(
                    group_id=grp.id,
                    instructor_id=inst1.id,
                    instructor_name=inst_map[inst1.id],
                    assigned_date=str(today - datetime.timedelta(days=20)),
                    unassigned_date=None,
                    start_lesson=6,
                    end_lesson=None,
                    lessons_taught=9
                )
                db.add_all([h_prev, h_curr])
                for l_i in range(cond):
                    l_date = str(today - datetime.timedelta(days=(cond - 1 - l_i) * 2))
                    l_inst = inst2.id if l_i < 6 else inst1.id
                    db.add(models.GroupLesson(group_id=grp.id, instructor_id=l_inst, lesson_date=l_date))
            else:
                h_curr = models.GroupInstructorHistory(
                    group_id=grp.id,
                    instructor_id=grp.instructor_id,
                    instructor_name=inst_map[grp.instructor_id],
                    assigned_date=grp.start_date,
                    unassigned_date=None,
                    start_lesson=0,
                    end_lesson=None,
                    lessons_taught=cond
                )
                db.add(h_curr)
                for l_i in range(cond):
                    l_date = str(today - datetime.timedelta(days=(cond - 1 - l_i) * 2))
                    db.add(models.GroupLesson(group_id=grp.id, instructor_id=grp.instructor_id, lesson_date=l_date))
        db.commit()

        # 5. Create 50 Realistic Armenian Students across all statuses & courses
        students_spec = [
            # Group 0: ՖՀ-101 (22 lessons conducted) -> 12 lessons = 1 month, 24 lessons = 2 months
            ("Արման Հակոբյան", "Ֆինանսական հաշվառում", "Օֆլայն", "Ընթացիկ", "+374 91 23 45 11", "arman.hakobyan@mail.am", 48000, 0, 0, "Instagram", 0, [48000, 48000]),
            ("Լիլիթ Սարգսյան", "Ֆինանսական հաշվառում", "Օֆլայն", "Ընթացիկ", "+374 99 12 34 22", "lilit.sargsyan@gmail.com", 48000, 0, 0, "Facebook", 0, [48000]), # Debtor! (paid 48k, charged 22*4k=88k -> -40k)
            ("Գոռ Ավետիսյան", "Ֆինանսական հաշվառում", "Օֆլայն", "Ընթացիկ", "+374 77 56 78 33", "gor.avetisyan@mail.am", 48000, 10, 0, "Երաշխավորություն", 0, [43200, 43200]),
            ("Նարե Մկրտչյան", "Ֆինանսական հաշվառում", "Օֆլայն", "Ընթացիկ", "+374 93 89 01 44", "nare.mkrtchyan@gmail.com", 48000, 0, 0, "Instagram", 0, [48000, 20000]), # Debtor! (paid 68k, charged 88k -> -20k)
            ("Դավիթ Հարությունյան", "Ֆինանսական հաշվառում", "Օֆլայն", "Ընթացիկ", "+374 94 33 22 55", "davit.harutyunyan@gmail.com", 48000, 0, 6000, "Կայք", 0, [42000, 42000]),

            # Group 1: ՖՀ-102 (15 lessons conducted)
            ("Անի Վարդանյան", "Ֆինանսական հաշվառում", "Օֆլայն", "Ընթացիկ", "+374 91 65 43 21", "ani.vardanyan@gmail.com", 48000, 0, 0, "Instagram", 1, [48000, 48000]),
            ("Հայկ Կարապետյան", "Ֆինանսական հաշվառում", "Օֆլայն", "Ընթացիկ", "+374 99 87 65 43", "hayk.karapetyan@mail.am", 48000, 0, 0, "Facebook", 1, [48000]), # Debtor! (paid 48k, 15 lessons * 4k = 60k -> -12k)
            ("Սոնա Գևորգյան", "Ֆինանսական հաշվառում", "Օֆլայն", "Ընթացիկ", "+374 77 11 22 33", "sona.gevorgyan@gmail.com", 48000, 15, 0, "Երաշխավորություն", 1, [40800, 40800]),
            ("Տիգրան Պողոսյան", "Ֆինանսական հաշվառում", "Օֆլայն", "Ընթացիկ", "+374 93 44 55 66", "tigran.poghosyan@mail.am", 48000, 0, 0, "Instagram", 1, [48000]), # Debtor! (-12k)
            ("Միլենա Խաչատրյան", "Ֆինանսական հաշվառում", "Օֆլայն", "Ընթացիկ", "+374 95 77 88 99", "milena.khachatryan@gmail.com", 48000, 0, 0, "Կայք", 1, [48000, 24000]),

            # Group 2: ՖՀ-103 (9 lessons conducted)
            ("Կարեն Մանուկյան", "Ֆինանսական հաշվառում", "Օֆլայն", "Ընթացիկ", "+374 91 90 12 34", "karen.manukyan@gmail.com", 48000, 0, 0, "Instagram", 2, [48000]),
            ("Էլեն Սիմոնյան", "Ֆինանսական հաշվառում", "Օֆլայն", "Ընթացիկ", "+374 99 34 56 78", "elen.simonyan@mail.am", 48000, 0, 0, "Facebook", 2, [20000]), # Debtor! (paid 20k, 9*4k=36k -> -16k)
            ("Սամվել Ստեփանյան", "Ֆինանսական հաշվառում", "Օֆլայն", "Ընթացիկ", "+374 77 98 76 54", "samvel.stepanyan@gmail.com", 48000, 0, 0, "Կայք", 2, [48000]),
            ("Լուսինե Մելքոնյան", "Ֆինանսական հաշվառում", "Օֆլայն", "Ընթացիկ", "+374 93 21 43 65", "lusine.melqonyan@gmail.com", 48000, 10, 0, "Երաշխավորություն", 2, [43200]),

            # Group 3: ՖՀ-104 (3 lessons conducted)
            ("Արթուր Մուրադյան", "Ֆինանսական հաշվառում", "Օֆլայն", "Ընթացիկ", "+374 94 67 89 01", "artur.muradyan@mail.am", 48000, 0, 0, "Instagram", 3, [48000]),
            ("Մանե Ասատրյան", "Ֆինանսական հաշվառում", "Օֆլայն", "Հաստատված", "+374 91 54 32 19", "mane.asatryan@gmail.com", 48000, 0, 0, "Facebook", 3, []), # Debtor! (0 paid, 3*4k=12k -> -12k)
            ("Վահե Եղիազարյան", "Ֆինանսական հաշվառում", "Օֆլայն", "Ընթացիկ", "+374 99 61 72 83", "vahe.eghiazaryan@gmail.com", 48000, 0, 0, "Կայք", 3, [48000]),
            ("Սիրանույշ Հովսեփյան", "Ֆինանսական հաշվառում", "Օֆլայն", "Հաստատված", "+374 77 42 53 64", "siranuysh.hovsepyan@mail.am", 48000, 0, 6000, "Instagram", 3, [42000]),

            # Group 4: ՀՀ-201 (18 lessons conducted)
            ("Ռուբեն Մարտիրոսյան", "Հարկային հաշվառում", "Օֆլայն", "Ընթացիկ", "+374 91 71 82 93", "ruben.martirosyan@gmail.com", 42000, 0, 0, "Facebook", 4, [42000, 42000]),
            ("Տաթևիկ Գասպարյան", "Հարկային հաշվառում", "Օֆլայն", "Ընթացիկ", "+374 99 19 28 37", "tatevik.gasparyan@mail.am", 42000, 0, 0, "Instagram", 4, [42000]), # Debtor! (paid 42k, 18*3.5k=63k -> -21k)
            ("Արսեն Ղազարյան", "Հարկային հաշվառում", "Օֆլայն", "Ընթացիկ", "+374 77 37 48 59", "arsen.ghazaryan@gmail.com", 42000, 0, 0, "Երաշխավորություն", 4, [42000, 42000]),
            ("Գայանե Թովմասյան", "Հարկային հաշվառում", "Օֆլայն", "Ընթացիկ", "+374 93 64 75 86", "gayane.tovmasyan@gmail.com", 42000, 20, 0, "Կայք", 4, [33600]), # Debtor! (paid 33.6k, 18*2.8k=50.4k -> -16.8k)
            ("Նարեկ Դավթյան", "Հարկային հաշվառում", "Օֆլայն", "Ընթացիկ", "+374 94 82 91 03", "narek.davtyan@mail.am", 42000, 0, 0, "Instagram", 4, [42000, 42000]),

            # Group 5: ՀՀ-202 (11 lessons conducted)
            ("Աշխեն Բաղդասարյան", "Հարկային հաշվառում", "Օֆլայն", "Ընթացիկ", "+374 91 14 25 36", "ashkhen.baghdasaryan@gmail.com", 42000, 0, 0, "Facebook", 5, [42000]),
            ("Լևոն Աբրահամյան", "Հարկային հաշվառում", "Օֆլայն", "Ընթացիկ", "+374 99 47 58 69", "levon.abrahamyan@mail.am", 42000, 0, 0, "Instagram", 5, [25000]), # Debtor! (paid 25k, 11*3.5k=38.5k -> -13.5k)
            ("Մարիա Զաքարյան", "Հարկային հաշվառում", "Օֆլայն", "Ընթացիկ", "+374 77 69 58 47", "maria.zakaryan@gmail.com", 42000, 0, 0, "Երաշխավորություն", 5, [42000]),
            ("Հովհաննես Առաքելյան", "Հարկային հաշվառում", "Օֆլայն", "Ընթացիկ", "+374 93 36 25 14", "hovhannes.araqelyan@gmail.com", 42000, 10, 0, "Կայք", 5, [37800]),

            # Group 6: ՀՀ-203 (Օնլայն) (5 lessons conducted)
            ("Քրիստինե Սահակյան", "Հարկային հաշվառում", "Օնլայն", "Ընթացիկ", "+374 94 52 63 74", "kristine.sahakyan@gmail.com", 42000, 0, 0, "Instagram", 6, [42000]),
            ("Էդգար Միքայելյան", "Հարկային հաշվառում", "Օնլայն", "Ընթացիկ", "+374 91 85 96 74", "edgar.miqayelyan@mail.am", 42000, 0, 0, "Facebook", 6, []), # Debtor! (0 paid, 5*3.5k=17.5k -> -17.5k)
            ("Աննա Գալստյան", "Հարկային հաշվառում", "Օնլայն", "Ընթացիկ", "+374 99 74 85 96", "anna.galstyan@gmail.com", 42000, 0, 0, "Կայք", 6, [42000]),
            ("Սարգիս Համբարձումյան", "Հարկային հաշվառում", "Օնլայն", "Հաստատված", "+374 77 15 26 37", "sargis.hambardzumyan@gmail.com", 42000, 0, 0, "Instagram", 6, [42000]),

            # Group 7: 1C-301 (14 lessons conducted)
            ("Հասմիկ Ներսիսյան", "1C ՀԾ ծրագրեր", "Օֆլայն", "Ընթացիկ", "+374 93 95 84 73", "hasmik.nersisyan@gmail.com", 36000, 0, 0, "Instagram", 7, [36000, 36000]),
            ("Արտյոմ Կիրակոսյան", "1C ՀԾ ծրագրեր", "Օֆլայն", "Ընթացիկ", "+374 94 26 37 48", "artyom.kirakosyan@mail.am", 36000, 0, 0, "Facebook", 7, [36000]), # Debtor! (paid 36k, 14*3k=42k -> -6k)
            ("Եվա Մարգարյան", "1C ՀԾ ծրագրեր", "Օֆլայն", "Ընթացիկ", "+374 91 38 49 50", "eva.margaryan@gmail.com", 36000, 0, 0, "Երաշխավորություն", 7, [36000, 36000]),
            ("Վարդան Հովակիմյան", "1C ՀԾ ծրագրեր", "Օֆլայն", "Ընթացիկ", "+374 99 50 61 72", "vardan.hovakimyan@gmail.com", 36000, 0, 0, "Կայք", 7, [30000]), # Debtor! (paid 30k, 14*3k=42k -> -12k)

            # Group 8: 1C-302 (7 lessons conducted)
            ("Դիանա Ալեքսանյան", "1C ՀԾ ծրագրեր", "Օֆլայն", "Ընթացիկ", "+374 77 62 73 84", "diana.aleqsanyan@gmail.com", 36000, 0, 0, "Instagram", 8, [36000]),
            ("Մհեր Բաբայան", "1C ՀԾ ծրագրեր", "Օնլայն", "Ընթացիկ", "+374 93 73 84 95", "mher.babayan@mail.am", 36000, 0, 0, "Facebook", 8, [12000]), # Debtor! (paid 12k, 7*3k=21k -> -9k)
            ("Սոֆյա Օհանյան", "1C ՀԾ ծրագրեր", "Օֆլայն", "Ընթացիկ", "+374 94 84 95 06", "sofya.ohanyan@gmail.com", 36000, 10, 0, "Երաշխավորություն", 8, [32400]),
            ("Ալեքսանդր Մինասյան", "1C ՀԾ ծրագրեր", "Օֆլայն", "Հաստատված", "+374 91 95 06 17", "alex.minasyan@gmail.com", 36000, 0, 0, "Կայք", 8, [36000]),

            # Group 9: 1C-303 (1 lesson conducted)
            ("Ինեսա Ավագյան", "1C ՀԾ ծրագրեր", "Օֆլայն", "Հաստատված", "+374 99 06 17 28", "inesa.avagyan@gmail.com", 36000, 0, 0, "Instagram", 9, [36000]),
            ("Ռոբերտ Դանիելյան", "1C ՀԾ ծրագրեր", "Օֆլայն", "Հաստատված", "+374 77 17 28 39", "robert.danielyan@mail.am", 36000, 0, 0, "Facebook", 9, []), # Debtor! (0 paid, 1*3k=3k -> -3k)

            # Unassigned / New / Uncertain / Archived students for realistic CRM pipeline
            ("Լիլիա Մխիթարյան", "Ֆինանսական հաշվառում", "Օֆլայն", "Նոր", "+374 93 28 39 40", "lilia.mkhitaryan@gmail.com", 48000, 0, 0, "Instagram", None, []),
            ("Արման Քոչարյան", "Հարկային հաշվառում", "Օնլայն", "Նոր", "+374 94 39 40 51", "arman.qocharyan@gmail.com", 42000, 0, 0, "Facebook", None, []),
            ("Մոնիկա Սեդրակյան", "1C ՀԾ ծրագրեր", "Օֆլայն", "Նոր", "+374 91 40 51 62", "monika.sedrakyan@mail.am", 36000, 0, 0, "Կայք", None, []),
            ("Գագիկ Անտոնյան", "Ֆինանսական հաշվառում", "Օֆլայն", "Անորոշ", "+374 99 51 62 73", "gagik.antonyan@gmail.com", 48000, 0, 0, "Instagram", None, []),
            ("Շուշան Միրզոյան", "Հարկային հաշվառում", "Օնլայն", "Անորոշ", "+374 77 62 73 91", "shushan.mirzoyan@gmail.com", 42000, 10, 0, "Երաշխավորություն", None, []),
            ("Վահագն Սարգսյան", "1C ՀԾ ծրագրեր", "Օֆլայն", "Անորոշ", "+374 93 73 84 12", "vahagn.sargsyan@mail.am", 36000, 0, 0, "Facebook", None, []),
            ("Մարիամ Աղաջանյան", "Ֆինանսական հաշվառում", "Օֆլայն", "Արխիվ", "+374 94 84 95 23", "mariam.aghajanyan@gmail.com", 48000, 0, 0, "Instagram", None, [48000, 48000]),
            ("Սուրեն Հակոբջանյան", "Հարկային հաշվառում", "Օֆլայն", "Արխիվ", "+374 91 95 06 34", "suren.hakobjanyan@gmail.com", 42000, 0, 0, "Կայք", None, [42000, 42000]),
            ("Նունե Թադևոսյան", "1C ՀԾ ծրագրեր", "Օնլայն", "Արխիվ", "+374 99 11 33 55", "nune.tadevosyan@mail.am", 36000, 0, 0, "Երաշխավորություն", None, [36000, 36000])
        ]

        payment_methods = ["Կանխիկ", "Բանկային Փոխանցում", "Առցանց Փոխանցում", "Idram / Telcell"]

        for idx, s_tuple in enumerate(students_spec):
            (
                full_name,
                direction,
                c_format,
                status,
                phone,
                email,
                fee,
                disc,
                gift,
                source,
                grp_idx,
                payments_list
            ) = s_tuple

            created_dt = datetime.datetime.utcnow() - datetime.timedelta(days=max(1, 55 - idx))
            st = models.Student(
                full_name=full_name,
                course_direction=direction,
                course_format=c_format,
                location="Երևան",
                status=status,
                phone=phone,
                email=email,
                monthly_fee=fee,
                discount_percent=disc,
                gift_card=gift,
                source=source,
                comment="Գրանցված ուսանող",
                urgent_notes="",
                custom_lessons_attended=16 if status == "Արխիվ" else None,
                is_deleted=0,
                created_at=created_dt
            )
            db.add(st)
            db.commit()
            db.refresh(st)

            # Link student to group with initial_lessons = 0 so attended lessons = group.conducted_lessons
            if grp_idx is not None and 0 <= grp_idx < len(created_groups):
                target_grp = created_groups[grp_idx]
                lnk = models.StudentGroupLink(
                    group_id=target_grp.id,
                    student_id=st.id,
                    initial_lessons=0,
                    joined_at=created_dt
                )
                db.add(lnk)
                db.commit()

            # Create payments for this student
            for p_i, amt in enumerate(payments_list):
                p_days_ago = max(0, (len(payments_list) - 1 - p_i) * 26 + (idx % 12))
                p_dt = datetime.datetime.utcnow() - datetime.timedelta(days=p_days_ago)
                method = payment_methods[(idx + p_i) % len(payment_methods)]
                note = f"{p_i + 1}-ին փուլի վճարում ({direction})"
                pay = models.Payment(
                    student_id=st.id,
                    amount=amt,
                    payment_date=p_dt,
                    method=method,
                    notes=note,
                    status="Ակտիվ",
                    is_deleted=0
                )
                db.add(pay)
            db.commit()

        # 6. Populate 30-day StudentDailySnapshot for realistic Dashboard chart (with green growth & a couple red dip days)
        active_now = sum(1 for s in students_spec if s[3] not in ["Արխիվ", "Ավարտած", "Ջնջված"])
        # Build a realistic 31-day trajectory ending at active_now (47 active students)
        offsets_from_end = [
            -18, -18, -17, -16, -15, -15, -16, # slight dip on day 7 (red bar)
            -14, -13, -12, -12, -11, -10, -9,
            -9, -10, # slight dip on day 16 (red bar)
            -8, -7, -6, -6, -5, -4, -4, -3,
            -4, # slight dip on day 25 (red bar)
            -2, -2, -1, -1, 0, 0
        ]
        for i in range(31):
            d = today - datetime.timedelta(days=(30 - i))
            cnt = max(10, active_now + offsets_from_end[i])
            snap = models.StudentDailySnapshot(
                snapshot_date=str(d),
                student_count=cnt
            )
            db.add(snap)
        db.commit()

        # 7. Save marker so this reset only runs once
        if not crud.get_admin(db, SEED_MARKER_USERNAME):
            crud.create_admin(db, SEED_MARKER_USERNAME, "seeded")

        print("Realistic seeding complete!")
    except Exception as e:
        db.rollback()
        print("Seed error:", e)
    finally:
        db.close()

if __name__ == "__main__":
    seed(force_reset=True)
