import re
with open('api/seed.py', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('Python for Beginners', 'Ֆինանսական հաշվառում')
content = content.replace('Learn Python from scratch', 'Հաշվապահության հիմունքներ և ֆինանսական հաշվետվություններ')
content = content.replace('Advanced FastAPI', 'Հարկային հաշվառում')
content = content.replace('Build robust APIs', 'ՀՀ հարկային օրենսդրություն և պրակտիկ կիրառություն')
content = content.replace('Jane', 'Անահիտ')
content = content.replace('Doe', 'Գրիգորյան')
content = content.replace('John', 'Արմեն')
content = content.replace('Smith', 'Պետրոսյան')
content = content.replace('Python Web & ML Advanced', 'Ֆինանսական հաշվառում')
content = content.replace('React Advanced', 'Հարկային հաշվառում')
content = content.replace('PY-101', 'ՖՀ-101')
content = content.replace('FAST-201', 'ՀՀ-201')
content = re.sub(r'full_name=f".*?"', 'full_name=f"Ուսանող {i}"', content)
content = re.sub(r'status=".*?" if i % 3 == 0 else ".*?"', 'status="Ընթացիկ ուսանող" if i % 3 == 0 else "Ավարտած"', content)

with open('api/seed.py', 'w', encoding='utf-8') as f:
    f.write(content)
