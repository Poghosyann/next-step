import React, { useState, useEffect, useRef } from 'react';
import api from '../api';
import { X, Plus, Trash2, Edit2, Users2, Search } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const Groups = () => {
  const { addToast } = useToast();
  const [groups, setGroups] = useState([]);
  const [courses, setCourses] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [students, setStudents] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState(null);

  const initialForm = {
    name: '', course_id: '', instructor_id: '',
    start_date: '', start_time: '', end_time: '', days: ''
  };
  const [formData, setFormData] = useState(initialForm);

  const [selectedStudents, setSelectedStudents] = useState([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [isStudentDropdownOpen, setIsStudentDropdownOpen] = useState(false);
  const studentDropdownRef = useRef(null);

  const allDays = ['Երկ.', 'Երք.', 'Չրք.', 'Հնգ.', 'Ուրբ.', 'Շբթ.', 'Կիր.'];
  const [selectedDays, setSelectedDays] = useState([]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (studentDropdownRef.current && !studentDropdownRef.current.contains(event.target)) {
        setIsStudentDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unselectedStudents = students.filter(
    s => !selectedStudents.some(sel => sel.id === s.id)
  );

  const filteredAvailableStudents = unselectedStudents.filter(s => {
    if (!studentSearch.trim()) return true;
    const query = studentSearch.toLowerCase().trim();
    return (
      (s.full_name && s.full_name.toLowerCase().includes(query)) ||
      (s.phone && s.phone.toLowerCase().includes(query)) ||
      (s.email && s.email.toLowerCase().includes(query)) ||
      (s.course_direction && s.course_direction.toLowerCase().includes(query))
    );
  });

  const addStudent = (student) => {
    if (!selectedStudents.some(s => s.id === student.id)) {
      setSelectedStudents([...selectedStudents, student]);
    }
  };

  const fetchData = async () => {
    try {
      const [grRes, cRes, iRes, sRes] = await Promise.all([
        api.get('/groups'),
        api.get('/courses'),
        api.get('/instructors'),
        api.get('/students?limit=1000')
      ]);
      setGroups(grRes.data);
      setCourses(cRes.data);
      setInstructors(cRes.data); // Wait, in original code it was probably iRes.data
      setInstructors(iRes.data);
      setStudents(sRes.data.items || sRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleStudentSelect = (e) => {
    const studentId = parseInt(e.target.value);
    if (!studentId) return;
    const student = students.find(s => s.id === studentId);
    if (student && !selectedStudents.find(s => s.id === studentId)) {
      setSelectedStudents([...selectedStudents, student]);
    }
    e.target.value = '';
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
    const payload = {
      ...formData,
      days: selectedDays.join(', ')
    };

    try {
      let savedGroup;
      if (editingGroupId) {
        const res = await api.put(`/groups/${editingGroupId}`, payload);
        savedGroup = res.data;
      } else {
        const res = await api.post('/groups', payload);
        savedGroup = res.data;
      }
      
      // Sync students
      await api.post(`/groups/${savedGroup.id}/students`, {
        student_ids: selectedStudents.map(s => s.id)
      });

      setShowModal(false);
      setEditingGroupId(null);
      setFormData(initialForm);
      setSelectedStudents([]);
      setSelectedDays([]);
      fetchData();
      addToast(editingGroupId ? 'Խմբի տվյալները թարմացվեցին' : 'Խումբը հաջողությամբ ստեղծվեց', 'success');
    } catch (err) {
      console.error(err);
      addToast('Սխալ խումբը պահպանելիս', 'error');
    }
  };

  const handleDelete = async (id) => {
    if(window.confirm('Համոզվա՞ծ եք, որ ցանկանում եք ջնջել այս խումբը:')) {
      try {
        await api.delete(`/groups/${id}`);
        fetchData();
        addToast('Խումբը ջնջվեց', 'success');
      } catch (err) {
        console.error(err);
        addToast('Սխալ խումբը ջնջելիս', 'error');
      }
    }
  };

  const openEditModal = (group) => {
    setFormData({
      name: group.name || '',
      course_id: group.course_id || '',
      instructor_id: group.instructor_id || '',
      start_date: group.start_date || '',
      start_time: group.start_time || '',
      end_time: group.end_time || '',
      days: group.days || ''
    });
    setSelectedDays(group.days ? group.days.split(', ') : []);
    setSelectedStudents(group.students || []);
    setStudentSearch('');
    setIsStudentDropdownOpen(false);
    setEditingGroupId(group.id);
    setShowModal(true);
  };

  const openCreateModal = () => {
    setFormData(initialForm);
    setSelectedDays([]);
    setSelectedStudents([]);
    setStudentSearch('');
    setIsStudentDropdownOpen(false);
    setEditingGroupId(null);
    setShowModal(true);
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Խմբեր</h1>
          <p className="text-gray-500">Խմբերի և դասացուցակների կառավարում</p>
        </div>
        <button onClick={openCreateModal} className="glass-button flex items-center gap-2">
          <Plus size={20} /> Նոր խումբ
        </button>
      </div>

      <div className="glass-panel overflow-hidden">
        <div className="p-4 overflow-x-auto">
          <table className="w-full text-left text-gray-800">
            <thead>
              <tr className="border-b border-gray-100 text-gray-500 text-sm">
                <th className="p-4 font-semibold">Խմբի Անվանում</th>
                <th className="p-4 font-semibold">Դասընթաց</th>
                <th className="p-4 font-semibold">Դասախոս</th>
                <th className="p-4 font-semibold">Օրեր</th>
                <th className="p-4 font-semibold">Ժամեր</th>
                <th className="p-4 font-semibold">Ուսանողներ</th>
                <th className="p-4 font-semibold text-right">Գործողություն</th>
              </tr>
            </thead>
            <tbody>
              {groups.map((gr) => (
                <tr key={gr.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                  <td className="p-4 font-bold text-gray-800">
                    <div className="flex items-center gap-2">
                      <Users2 size={16} className="text-brand" /> {gr.name}
                    </div>
                  </td>
                  <td className="p-4 text-gray-600">{gr.course?.title}</td>
                  <td className="p-4 text-gray-600">{gr.instructor ? `${gr.instructor.first_name} ${gr.instructor.last_name}` : ''}</td>
                  <td className="p-4 text-brand font-medium">{gr.days}</td>
                  <td className="p-4 text-gray-600">{gr.start_time} - {gr.end_time}</td>
                  <td className="p-4">
                    <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm border border-gray-200">
                      {gr.students?.length || 0} Ուսանող
                    </span>
                  </td>
                  <td className="p-4 text-right flex justify-end gap-2">
                    <button onClick={() => openEditModal(gr)} className="p-2 text-gray-400 hover:text-brand hover:bg-brand/10 rounded-md transition">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(gr.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {groups.length === 0 && (
                <tr><td colSpan="7" className="p-12 text-center text-gray-400">Խմբեր չեն գտնվել</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-gray-50 rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col my-8">
            <div className="flex justify-between items-center p-5 border-b border-gray-200 bg-white sticky top-0 z-10">
              <h2 className="text-xl font-bold text-gray-800">{editingGroupId ? 'Խմբագրել Խումբը' : 'Նոր Խումբ'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-black transition">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Խմբի Անվանում *</label>
                  <input required type="text" name="name" value={formData.name} onChange={handleChange} className="glass-input w-full" placeholder="Օր.՝ ՖՀ-101" />
                </div>
                
                <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Դասընթաց *</label>
                  <select required name="course_id" value={formData.course_id} onChange={handleChange} className="glass-input w-full">
                    <option value="">-- Ընտրեք Դասընթաց --</option>
                    {courses.map(c => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                <label className="block text-sm font-bold text-gray-700 mb-3">Դասախոս *</label>
                <select required name="instructor_id" value={formData.instructor_id} onChange={handleChange} className="glass-input w-full md:w-1/2">
                  <option value="">-- Ընտրեք Դասախոս --</option>
                  {instructors.map(inst => (
                    <option key={inst.id} value={inst.id}>{inst.first_name} {inst.last_name}</option>
                  ))}
                </select>
              </div>

              <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm" ref={studentDropdownRef}>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-bold text-gray-700">
                    Ուսանողներ <span className="text-gray-400 font-normal">({selectedStudents.length} ընտրված)</span>
                  </label>
                </div>
                
                {/* Որոնման դաշտ */}
                <div className="relative mb-3">
                  <div className="relative flex items-center">
                    <Search className="absolute left-3 text-gray-400 w-4 h-4 pointer-events-none" />
                    <input 
                      type="text"
                      placeholder="Որոնել ուսանողի (անուն, հեռախոս, էլ-փոստ)..."
                      value={studentSearch}
                      onFocus={() => setIsStudentDropdownOpen(true)}
                      onChange={(e) => {
                        setStudentSearch(e.target.value);
                        setIsStudentDropdownOpen(true);
                      }}
                      className="glass-input w-full pl-9 pr-8 py-2 text-sm"
                    />
                    {studentSearch && (
                      <button 
                        type="button" 
                        onClick={() => setStudentSearch('')} 
                        className="absolute right-3 text-gray-400 hover:text-gray-600"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  {/* Բացվող ցանկ՝ որոնման արդյունքներով */}
                  {isStudentDropdownOpen && (
                    <div className="absolute z-20 left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-xl divide-y divide-gray-100">
                      <div className="p-2 text-xs font-semibold text-gray-400 bg-gray-50 flex justify-between items-center sticky top-0 z-10">
                        <span>Գտնված ուսանողներ ({filteredAvailableStudents.length})</span>
                        <button 
                          type="button" 
                          onClick={() => setIsStudentDropdownOpen(false)}
                          className="text-gray-500 hover:text-black font-medium"
                        >
                          Փակել ✕
                        </button>
                      </div>
                      {filteredAvailableStudents.length === 0 ? (
                        <div className="p-4 text-center text-sm text-gray-400">
                          {unselectedStudents.length === 0 
                            ? 'Բոլոր ուսանողներն արդեն ավելացված են այս խմբում' 
                            : 'Ուսանող չի գտնվել'}
                        </div>
                      ) : (
                        filteredAvailableStudents.map(st => (
                          <div 
                            key={st.id} 
                            onClick={() => addStudent(st)}
                            className="p-3 hover:bg-brand/10 cursor-pointer transition flex items-center justify-between group"
                          >
                            <div>
                              <p className="font-medium text-gray-800 text-sm">{st.full_name}</p>
                              <p className="text-xs text-gray-500">
                                {st.phone || 'Հեռախոս չկա'} {st.course_direction ? `• ${st.course_direction}` : ''} {st.status ? `• ${st.status}` : ''}
                              </p>
                            </div>
                            <span className="text-xs bg-brand/10 group-hover:bg-brand group-hover:text-black font-semibold text-gray-700 px-2.5 py-1 rounded transition">
                              + Ավելացնել
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* Ընտրված ուսանողների ցանկ */}
                <div className="flex flex-wrap gap-2 p-3 min-h-[70px] bg-gray-50 border border-gray-200 rounded-md">
                  {selectedStudents.length === 0 && (
                    <span className="text-gray-400 text-sm flex items-center">
                      Խմբում դեռ ուսանողներ չկան: Օգտագործեք վերևի որոնումը՝ ուսանողներ ավելացնելու համար:
                    </span>
                  )}
                  {selectedStudents.map(st => (
                    <div key={st.id} className="flex items-center gap-2 bg-brand/10 border border-brand/30 text-gray-800 px-3 py-1.5 rounded-full text-sm font-medium">
                      <span>{st.full_name}</span>
                      {st.phone && <span className="text-xs text-gray-500 font-normal">({st.phone})</span>}
                      <button type="button" onClick={() => removeStudent(st.id)} className="hover:text-red-500 transition ml-1 text-gray-500" title="Հեռացնել խմբից">
                        <X size={14} strokeWidth={3} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                <label className="block text-sm font-bold text-gray-700 mb-4">Ժամանակացույց</label>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2">Սկզբի ամսաթիվ</label>
                    <input type="date" name="start_date" value={formData.start_date} onChange={handleChange} className="glass-input w-full" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2">Սկիզբ (Ժամ)</label>
                    <input type="time" name="start_time" value={formData.start_time} onChange={handleChange} className="glass-input w-full" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2">Ավարտ (Ժամ)</label>
                    <input type="time" name="end_time" value={formData.end_time} onChange={handleChange} className="glass-input w-full" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2">Օրեր</label>
                    <div className="flex flex-wrap gap-1">
                      {allDays.map(day => {
                        const isSelected = selectedDays.includes(day);
                        return (
                          <button
                            key={day}
                            type="button"
                            onClick={() => toggleDay(day)}
                            className={`px-2 py-1 rounded text-xs font-medium transition ${
                              isSelected ? 'bg-brand text-black shadow-sm' : 'bg-gray-100 text-gray-500 hover:bg-gray-200 border border-gray-200'
                            }`}
                          >
                            {day}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2 bg-white border border-gray-300 rounded-md text-gray-700 font-medium hover:bg-gray-50 transition">
                  Չեղարկել
                </button>
                <button type="submit" className="glass-button px-8">
                  Պահպանել
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
