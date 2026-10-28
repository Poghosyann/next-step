import { useState, useEffect, useRef } from 'react';
import api from '../api';
import { X, Plus, Trash2, Edit2, Users2, Search, Clock } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const Groups = () => {
  const { addToast } = useToast();
  const [groups, setGroups] = useState([]);
  const [courses, setCourses] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState(null);

  const initialForm = {
    course_id: '', instructor_id: '',
    start_date: '', start_time: '', end_time: '', days: '',
    conducted_lessons: 0
  };
  const [formData, setFormData] = useState(initialForm);

  const [selectedStudents, setSelectedStudents] = useState([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [isStudentDropdownOpen, setIsStudentDropdownOpen] = useState(false);
  const studentDropdownRef = useRef(null);

  const allDays = ['Երկ.', 'Երք.', 'Չրք.', 'Հնգ.', 'Ուրբ.', 'Շբթ.', 'Կիր.'];
  const [selectedDays, setSelectedDays] = useState([]);

  const getGroupProgress = (gr) => {
    const total = gr.course?.total_lessons || 0;
    const completed = gr.conducted_lessons ?? gr.completed_lessons ?? 0;

    if (!gr.start_date) {
      return { isStarted: false, completed, remaining: total, percent: 0, total };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startDate = new Date(gr.start_date);
    startDate.setHours(0, 0, 0, 0);

    if (startDate > today) {
      return { isStarted: false, completed: 0, remaining: total, percent: 0, total };
    }

    const remaining = total > 0 ? Math.max(0, total - completed) : 0;
    const percent = total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0;

    return { isStarted: true, completed, remaining, percent, total };
  };

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
      setLoading(true);
      const [grRes, cRes, iRes, sRes] = await Promise.all([
        api.get('/groups'),
        api.get('/courses'),
        api.get('/instructors'),
        api.get('/students?limit=1000')
      ]);
      setGroups(grRes.data);
      setCourses(cRes.data);
      setInstructors(iRes.data);
      setStudents(sRes.data.items || sRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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
      conducted_lessons: parseInt(formData.conducted_lessons, 10) || 0,
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

  const handleConductLesson = async (groupId) => {
    try {
      const res = await api.post(`/groups/${groupId}/conduct-lesson`);
      setGroups(groups.map(g => g.id === groupId ? res.data : g));
      addToast('Դասը հաջողությամբ գրանցվեց (+1 դաս)', 'success');
    } catch (err) {
      console.error(err);
      addToast('Սխալ դասը գրանցելիս', 'error');
    }
  };

  const handleRevertLesson = async (groupId) => {
    try {
      const res = await api.post(`/groups/${groupId}/revert-lesson`);
      setGroups(groups.map(g => g.id === groupId ? res.data : g));
      addToast('Դասը չեղարկվեց (-1 դաս)', 'info');
    } catch (err) {
      console.error(err);
      addToast('Սխալ դասը չեղարկելիս', 'error');
    }
  };

  const openEditModal = (group) => {
    setFormData({
      course_id: group.course_id || '',
      instructor_id: group.instructor_id || '',
      start_date: group.start_date || '',
      start_time: group.start_time || '',
      end_time: group.end_time || '',
      days: group.days || '',
      conducted_lessons: group.conducted_lessons ?? group.completed_lessons ?? 0
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
        <div className="overflow-x-auto">
          <table className="w-full text-left text-gray-800">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/60 text-gray-500 text-xs font-semibold uppercase tracking-wider">
                <th className="p-3.5 whitespace-nowrap">Դասընթաց</th>
                <th className="p-3.5 whitespace-nowrap">Դասախոս</th>
                <th className="p-3.5 whitespace-nowrap">Օրեր</th>
                <th className="p-3.5 whitespace-nowrap">Ժամեր</th>
                <th className="p-3.5 whitespace-nowrap">Առաջընթաց</th>
                <th className="p-3.5 whitespace-nowrap">Ուսանողներ</th>
                <th className="p-3.5 font-semibold text-right whitespace-nowrap">Գործողություն</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, idx) => (
                  <tr key={idx} className="border-b border-gray-100 animate-pulse">
                    <td className="p-3.5"><div className="h-4 w-44 bg-gray-200 rounded" /></td>
                    <td className="p-3.5">
                      <div className="h-4 w-36 bg-gray-200 rounded mb-1.5" />
                      <div className="h-3.5 w-24 bg-gray-100 rounded" />
                    </td>
                    <td className="p-3.5"><div className="h-4 w-28 bg-gray-200 rounded" /></td>
                    <td className="p-3.5"><div className="h-4 w-24 bg-gray-200 rounded" /></td>
                    <td className="p-3.5">
                      <div className="h-2.5 w-28 bg-gray-200 rounded-full mb-1.5" />
                      <div className="h-4 w-16 bg-gray-100 rounded" />
                    </td>
                    <td className="p-3.5"><div className="h-6 w-20 bg-gray-200 rounded" /></td>
                    <td className="p-3.5 text-right"><div className="h-7 w-16 bg-gray-200 rounded ml-auto" /></td>
                  </tr>
                ))
              ) : (
                groups.map((gr) => {
                  const prog = getGroupProgress(gr);
                  const isNotStarted = !prog.isStarted;

                  let barColorClass = 'bg-emerald-500';
                  if (prog.total > 0) {
                    if (prog.remaining === 0 || prog.completed >= prog.total) {
                      barColorClass = 'bg-red-500';
                    } else if (prog.remaining >= 1 && prog.remaining <= 3) {
                      barColorClass = 'bg-orange-500';
                    } else {
                      barColorClass = 'bg-emerald-500';
                    }
                  } else {
                    barColorClass = 'bg-gray-300';
                  }

                  return (
                    <tr 
                      key={gr.id} 
                      className={`border-b transition ${
                        isNotStarted 
                          ? 'bg-purple-50/40 border-purple-100 hover:bg-purple-50/70 border-l-4 border-l-purple-500' 
                          : 'border-gray-50 hover:bg-gray-50 border-l-4 border-l-transparent'
                      }`}
                    >
                      <td className="p-3.5 text-gray-600 whitespace-nowrap">
                        <div className="flex flex-col gap-1 items-start">
                          <div className="flex items-center gap-2">
                            <Users2 size={16} className={isNotStarted ? "text-purple-600" : "text-brand"} />
                            <div>
                              <span className="font-bold text-gray-800">{gr.course?.title || 'Դասընթացը նշված չէ'}</span>
                              {gr.course?.total_lessons > 0 && (
                                <span className="text-[11px] text-gray-400 ml-1.5 font-normal">
                                  ({gr.course.total_lessons} դաս)
                                </span>
                              )}
                            </div>
                          </div>
                          {isNotStarted && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-700 bg-purple-100 border border-purple-200 px-2 py-0.5 rounded-full">
                              <Clock size={11} /> Շուտով ({gr.start_date || 'Ամսաթիվը նշված չէ'})
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3.5 text-gray-600 whitespace-nowrap">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-medium text-gray-800">
                            {gr.instructor ? `${gr.instructor.first_name} ${gr.instructor.last_name}` : 'Նշված չէ'}
                          </span>
                          {gr.instructor_history_list && gr.instructor_history_list.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1 mt-0.5">
                              {gr.instructor_history_list.map((h, hIdx) => (
                                <span
                                  key={h.id || hIdx}
                                  title={`${h.instructor_name} • Արված դասեր՝ ${h.lessons_taught} (${h.assigned_date || ''}${h.unassigned_date ? ` - ${h.unassigned_date}` : ' - ընթացիկ'})`}
                                  className={`text-[10px] px-1.5 py-0.2 rounded border cursor-help ${
                                    h.is_current
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold'
                                      : 'bg-gray-100 text-gray-500 border-gray-200'
                                  }`}
                                >
                                  {h.is_current ? `Ընթացիկ՝ ${h.lessons_taught} դաս` : `Նախկին՝ ${h.instructor_name} (${h.lessons_taught} դաս)`}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-3.5 text-brand font-medium whitespace-nowrap">{gr.days}</td>
                      <td className="p-3.5 text-gray-600 whitespace-nowrap">{gr.start_time} - {gr.end_time}</td>
                      <td className="p-3.5 whitespace-nowrap">
                        {isNotStarted ? (
                          <div 
                            className="flex items-center gap-2 cursor-help" 
                            title={`Դեռ չի մեկնարկել (Մեկնարկը՝ ${gr.start_date || 'Չի նշված'}, Ընդհանուր՝ ${prog.total} դաս)`}
                          >
                            <div className="w-28 h-2.5 bg-gray-100 rounded-full border border-dashed border-purple-300 overflow-hidden" />
                            <span className="text-xs text-purple-600 font-semibold whitespace-nowrap">
                              Շուտով
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-1.5 items-start">
                            <div 
                              className="w-28 bg-gray-100 h-2.5 rounded-full overflow-hidden border border-gray-200/70 p-0.5 cursor-help" 
                              title={`Արված դասեր՝ ${prog.completed}, Մնացել է՝ ${prog.remaining} (Ընդհանուր՝ ${prog.total} դաս)`}
                            >
                              <div 
                                className={`h-full rounded-full transition-all duration-500 ${barColorClass}`}
                                style={{ width: `${Math.max(0, Math.min(100, prog.percent))}%` }}
                              />
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleConductLesson(gr.id)}
                                className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded text-[11px] font-bold flex items-center gap-0.5 transition"
                                title="Գրանցել արված դաս (+1)"
                              >
                                <Plus size={11} /> Դաս
                              </button>
                              {prog.completed > 0 && (
                                <button
                                  onClick={() => handleRevertLesson(gr.id)}
                                  className="px-1.5 py-0.5 bg-gray-50 hover:bg-gray-100 text-gray-500 border border-gray-200 rounded text-[11px] font-semibold transition"
                                  title="Չեղարկել արված դաս (-1)"
                                >
                                  -1
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm border border-gray-200">
                          {gr.students?.length || 0} Ուսանող
                        </span>
                      </td>
                      <td className="p-3.5 text-right whitespace-nowrap">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => openEditModal(gr)} className="p-2 text-gray-400 hover:text-brand hover:bg-brand/10 rounded-md transition" title="Խմբագրել">
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => handleDelete(gr.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition" title="Ջնջել">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
              {!loading && groups.length === 0 && (
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
              
              <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                <label className="block text-sm font-bold text-gray-700 mb-2">Դասընթաց *</label>
                <select required name="course_id" value={formData.course_id} onChange={handleChange} className="glass-input w-full md:w-1/2">
                  <option value="">-- Ընտրեք Դասընթաց --</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>
              
              <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Դասախոս *</label>
                  <select required name="instructor_id" value={formData.instructor_id} onChange={handleChange} className="glass-input w-full md:w-1/2">
                    <option value="">-- Ընտրեք Դասախոս --</option>
                    {instructors.map(inst => (
                      <option key={inst.id} value={inst.id}>{inst.first_name} {inst.last_name}</option>
                    ))}
                  </select>
                  {editingGroupId && (
                    <p className="text-xs text-gray-400 mt-1.5">
                      Դասախոսին փոխելիս նախկին դասախոսի արված դասերի քանակը պահպանվում է պատմության մեջ, իսկ նոր դասախոսի հաշվարկը սկսվում է 0-ից։
                    </p>
                  )}
                </div>

                {editingGroupId && (() => {
                  const editingGrp = groups.find(g => g.id === editingGroupId);
                  const histList = editingGrp?.instructor_history_list || [];
                  if (histList.length === 0) return null;
                  return (
                    <div className="pt-3 border-t border-gray-100">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                        Խմբի Դասախոսների Պատմություն
                      </p>
                      <div className="space-y-2">
                        {histList.map((h, idx) => (
                          <div
                            key={h.id || idx}
                            className={`flex items-center justify-between p-2.5 rounded-lg border text-xs ${
                              h.is_current
                                ? 'bg-emerald-50/60 border-emerald-200 text-gray-800'
                                : 'bg-gray-50 border-gray-200 text-gray-600'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${h.is_current ? 'bg-emerald-500' : 'bg-gray-400'}`}></span>
                              <span className="font-bold">{h.instructor_name}</span>
                              <span className="text-gray-400">
                                ({h.assigned_date || 'սկզբից'}{h.unassigned_date ? ` → ${h.unassigned_date}` : ' → ընթացիկ'})
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded font-bold ${
                                h.is_current
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-gray-200 text-gray-700'
                              }`}>
                                Արված դասեր՝ {h.lessons_taught}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {editingGroupId && (() => {
                  const editingGrp = groups.find(g => g.id === editingGroupId);
                  const editHist = editingGrp?.lesson_edit_history || [];
                  if (editHist.length === 0) return null;
                  return (
                    <div className="pt-3 border-t border-gray-100">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                        Խմբի Դասերի Խմբագրման Պատմություն
                      </p>
                      <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                        {editHist.map((item, idx) => (
                          <div key={item.id || idx} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 border border-gray-200 text-xs">
                            <div>
                              <span className="font-semibold text-gray-700">{item.note || 'Դասերի քանակի խմբագրում'}</span>
                              {item.created_at && (
                                <span className="block text-[10px] text-gray-400">
                                  {new Date(item.created_at).toLocaleString('hy-AM')}
                                </span>
                              )}
                            </div>
                            <span className="font-bold text-brand bg-white px-2 py-0.5 rounded border border-gray-200 whitespace-nowrap">
                              {item.old_lessons} ➔ {item.new_lessons} դաս
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
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
                
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2">Սկզբի ամսաթիվ</label>
                    <input type="date" name="start_date" value={formData.start_date} onChange={handleChange} className="glass-input w-full" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2">Արված դասեր</label>
                    <input type="number" name="conducted_lessons" min="0" value={formData.conducted_lessons ?? 0} onChange={handleChange} className="glass-input w-full" placeholder="0" />
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
