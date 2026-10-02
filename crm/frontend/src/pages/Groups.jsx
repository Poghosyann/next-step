import React, { useState, useEffect } from 'react';
import api from '../api';
import { Users, Plus, X, Calendar, Clock } from 'lucide-react';

const Groups = () => {
  const [groups, setGroups] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [students, setStudents] = useState([]);
  
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: 'Ô½Õ¸Ö‚Õ´Õ¢ 1', // default name or let them type it, wait, the UI didn't have group name input in the image! It just had Instructor, Students, Schedule, Notes. I'll hide name or auto-generate it.
    instructor_id: '',
    start_date: '',
    start_time: '',
    end_time: '',
    notes: ''
  });
  
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [selectedDays, setSelectedDays] = useState(['ÔµÖ€Õ¯.', 'Õ‰Õ¸Ö€.', 'ÕˆÖ‚Ö€Õ¢.']);
  const allDays = ['ÔµÖ€Õ¯.', 'ÔµÖ€Ö„.', 'Õ‰Õ¸Ö€.', 'Õ€Õ¶Õ£.', 'ÕˆÖ‚Ö€Õ¢.', 'Õ‡Õ¢Õ©.', 'Ô¿Õ«Ö€.'];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [gRes, iRes, sRes] = await Promise.all([
        api.get('/groups'),
        api.get('/instructors'),
        api.get('/students')
      ]);
      setGroups(gRes.data);
      setInstructors(iRes.data);
      setStudents(sRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleStudentSelect = (e) => {
    const studentId = parseInt(e.target.value);
    if (studentId && !selectedStudents.find(s => s.id === studentId)) {
      const st = students.find(s => s.id === studentId);
      if (st) setSelectedStudents([...selectedStudents, st]);
    }
    e.target.value = "";
  };

  const removeStudent = (id) => {
    setSelectedStudents(selectedStudents.filter(s => s.id !== id));
  };

  const toggleDay = (day) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter(d => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Create group
      const payload = {
        ...formData,
        course_id: 1, // Just a default since course wasn't in UI
        days: selectedDays.join(', ')
      };
      // In real scenario, the name might be input. We'll generate a random name if missing.
      if (!payload.name) payload.name = `Ô½Õ¸Ö‚Õ´Õ¢ ${Math.floor(Math.random() * 1000)}`;

      const groupRes = await api.post('/groups', payload);
      
      // Add students
      if (selectedStudents.length > 0) {
        await api.post(`/groups/${groupRes.data.id}/students`, {
          student_ids: selectedStudents.map(s => s.id)
        });
      }
      
      setShowModal(false);
      fetchData();
    } catch (error) {
      console.error('Error creating group:', error);
      alert('Error creating group');
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Ô½Õ´Õ¢Õ¥Ö€</h1>
          <p className="text-gray-500">Ô¿Õ¡Õ¼Õ¡Õ¾Õ¡Ö€Õ¥Ö„ Õ¸Ö‚Õ½Õ¸Ö‚Õ´Õ¶Õ¡Õ¯Õ¡Õ¶ Õ­Õ´Õ¢Õ¥Ö€Õ¨</p>
        </div>
        <button onClick={() => setShowModal(true)} className="glass-button flex items-center gap-2">
          <Plus size={18} /> ÕÕ¿Õ¥Õ²Õ®Õ¥Õ¬ Õ­Õ¸Ö‚Õ´Õ¢
        </button>
      </div>

      <div className="glass-panel overflow-hidden">
        <div className="p-4 border-b border-gray-200 overflow-x-auto">
          <table className="w-full text-left text-gray-800">
            <thead>
              <tr className="border-b border-gray-200 text-gray-600">
                <th className="p-3">Ô±Õ¶Õ¾Õ¡Õ¶Õ¸Ö‚Õ´</th>
                <th className="p-3">Ô´Õ¡Õ½Õ¡Õ­Õ¸Õ½</th>
                <th className="p-3">Õ•Ö€Õ¥Ö€</th>
                <th className="p-3">ÔºÕ¡Õ´</th>
                <th className="p-3">ÕˆÖ‚Õ½Õ¡Õ¶Õ¸Õ²Õ¶Õ¥Ö€</th>
              </tr>
            </thead>
            <tbody>
              {groups.map((gr) => (
                <tr key={gr.id} className="border-b border-white/5 hover:bg-gray-50 transition">
                  <td className="p-3 font-semibold">{gr.name}</td>
                  <td className="p-3">{gr.instructor ? `${gr.instructor.first_name} ${gr.instructor.last_name}` : '-'}</td>
                  <td className="p-3 text-brand">{gr.days}</td>
                  <td className="p-3">{gr.start_time} - {gr.end_time}</td>
                  <td className="p-3">{gr.students?.length || 0} Õ°Õ¸Õ£Õ«</td>
                </tr>
              ))}
              {groups.length === 0 && (
                <tr><td colSpan="5" className="p-6 text-center text-gray-400">Ô½Õ´Õ¢Õ¥Ö€ Õ¹Õ¯Õ¡Õ¶</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#f3f4f6] rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-5 border-b bg-white">
              <h2 className="text-xl font-bold text-[#333d4e]">Õ†Õ¸Ö€ Ô½Õ¸Ö‚Õ´Õ¢</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-black">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-6">
              
              {/* Instructor Section */}
              <div className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm">
                <label className="block text-sm font-bold text-[#333d4e] mb-3">Ô´Õ¡Õ½Õ¡Õ­Õ¸Õ½</label>
                <select name="instructor_id" value={formData.instructor_id} onChange={handleChange} className="w-[300px] border border-gray-200 rounded-md p-2.5 text-gray-600 focus:border-brand outline-none">
                  <option value="">Ô¸Õ¶Õ¿Ö€Õ¥Õ¬</option>
                  {instructors.map(inst => (
                    <option key={inst.id} value={inst.id}>{inst.first_name} {inst.last_name}</option>
                  ))}
                </select>
              </div>

              {/* Students Section */}
              <div className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm">
                <div className="flex items-center gap-4 mb-3">
                  <label className="block text-sm font-bold text-[#333d4e]">ÕˆÖ‚Õ½Õ¡Õ¶Õ¸Õ²Õ¶Õ¥Ö€</label>
                  <select onChange={handleStudentSelect} className="border border-gray-200 rounded-md p-1.5 text-sm text-gray-600 outline-none">
                    <option value="">+ Ô±Õ¾Õ¥Õ¬Õ¡ÖÕ¶Õ¥Õ¬ Õ¸Ö‚Õ½Õ¡Õ¶Õ¸Õ²</option>
                    {students.map(st => (
                      <option key={st.id} value={st.id}>{st.full_name}</option>
                    ))}
                  </select>
                </div>
                
                <div className="flex flex-wrap gap-2 p-3 min-h-[60px] border border-gray-100 rounded-md">
                  {selectedStudents.map(st => (
                    <div key={st.id} className="flex items-center gap-2 bg-[#f4b324] text-gray-800 px-3 py-1.5 rounded text-sm font-medium">
                      {st.full_name} {st.course_direction ? `(${st.course_direction})` : ''}
                      <button type="button" onClick={() => removeStudent(st.id)} className="hover:text-black transition ml-1">
                        <X size={14} strokeWidth={3} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Schedule Section */}
              <div className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm">
                <label className="block text-sm font-bold text-[#333d4e] mb-4">ÔºÕ¡Õ´Õ¡Õ¿Õ¡Õ­Õ¿Õ¡Õ¯</label>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-[#475569] mb-2">Õ„Õ¥Õ¯Õ¶Õ¡Ö€Õ¯Õ« Õ¡Õ´Õ½Õ¡Õ©Õ«Õ¾</label>
                    <div className="relative">
                      <input type="date" name="start_date" value={formData.start_date} onChange={handleChange} className="w-full border border-gray-200 rounded-md p-2.5 text-gray-600 focus:border-brand outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#475569] mb-2">ÕÕ¯Õ½Õ¾Õ¸Ö‚Õ´ Õ§ ( ÕªÕ¡Õ´ )</label>
                    <div className="relative">
                      <input type="time" name="start_time" value={formData.start_time} onChange={handleChange} className="w-full border border-gray-200 rounded-md p-2.5 text-gray-600 focus:border-brand outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#475569] mb-2">ÕŽÕ¥Ö€Õ»Õ¡Õ¶Õ¸Ö‚Õ´ Õ§ ( ÕªÕ¡Õ´ )</label>
                    <div className="relative">
                      <input type="time" name="end_time" value={formData.end_time} onChange={handleChange} className="w-full border border-gray-200 rounded-md p-2.5 text-gray-600 focus:border-brand outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#475569] mb-2">Õ•Ö€Õ¥Ö€Õ¨</label>
                    <div className="flex flex-wrap gap-2 border border-gray-200 rounded-md p-2 min-h-[46px] items-center">
                      {allDays.map(day => {
                        const isSelected = selectedDays.includes(day);
                        return (
                          <button
                            key={day}
                            type="button"
                            onClick={() => toggleDay(day)}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded text-sm font-medium transition ${
                              isSelected ? 'bg-[#f4b324] text-gray-800' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            {day} {isSelected && <X size={12} strokeWidth={4} />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm">
                <textarea 
                  name="notes" 
                  value={formData.notes} 
                  onChange={handleChange} 
                  rows="3" 
                  placeholder="Õ†Õ·Õ¸Ö‚Õ´Õ¶Õ¥Ö€" 
                  className="w-full border border-gray-200 rounded-md p-3 text-gray-600 focus:border-brand outline-none resize-y"
                ></textarea>
              </div>

              {/* Footer Buttons */}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2.5 bg-white border border-gray-200 rounded-md text-gray-700 font-semibold hover:bg-gray-50 transition">
                  Õ‰Õ¥Õ²Õ¡Ö€Õ¯Õ¥Õ¬
                </button>
                <button type="submit" className="px-6 py-2.5 bg-[#1e293b] hover:bg-[#0f172a] text-white rounded-md font-semibold transition">
                  ÕŠÕ¡Õ°ÕºÕ¡Õ¶Õ¥Õ¬
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Groups;



