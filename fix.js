const fs = require('fs');
const files = ['crm/frontend/src/pages/Students.jsx', 'crm/frontend/src/pages/StudentProfile.jsx'];

files.forEach(f => {
  let c = fs.readFileSync(f, 'utf8');
  c = c.replace(/status: 'Նոր հայտ'/, "status: 'Նոր'");
  c = c.replace(/<select name="status"(.*?)>[\s\S]*?<\/select>/, `<select name="status"$1>
                      <option>Նոր</option>
                      <option>Հաստատված</option>
                      <option>Ընթացիկ</option>
                      <option>Անորոշ</option>
                      <option>Արխիվ</option>
                    </select>`);
  fs.writeFileSync(f, c);
});
console.log('done');
