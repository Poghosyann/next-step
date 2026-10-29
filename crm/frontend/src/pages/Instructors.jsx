import { useState, useEffect, useCallback } from 'react';
import api from '../api';
import { X, Plus, Trash2, Edit2, Phone, CalendarCheck, Coins, Users2, Search, BookOpen, Check, Calendar, ArrowLeft } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const Instructors = () => {
  const { addToast } = useToast();
  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const [instructors, setInstructors] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingInstructorId, setEditingInstructorId] = useState(null);
  const [selectedSpecializations, setSelectedSpecializations] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCourse, setFilterCourse] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);
  const [inlineEditId, setInlineEditId] = useState(null);
  const [inlineEditLessons, setInlineEditLessons] = useState(0);

  const initialForm = {
    first_name: '',
    last_name: '',
    phone: '',
    rate_per_lesson: ''
  };
  const [formData, setFormData] = useState(initialForm);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [instResult, courseResult] = await Promise.allSettled([
        api.get('/instructors', { params: selectedMonth ? { month: selectedMonth } : {} }),
        api.get('/courses')
      ]);
      if (instResult.status === 'fulfilled') {
        setInstructors(Array.isArray(instResult.value.data) ? instResult.value.data : []);
      }
      if (courseResult.status === 'fulfilled') {
        setCourses(Array.isArray(courseResult.value.data) ? courseResult.value.data : []);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openCreateModal = () => {
    setFormData(initialForm);
    setSelectedSpecializations([]);
    setEditingInstructorId(null);
    setShowModal(true);
  };

  const openEditModal = (instructor) => {
    setFormData({
      first_name: instructor.first_name || '',
      last_name: instructor.last_name || '',
      phone: instructor.phone || '',
      rate_per_lesson: instructor.rate_per_lesson !== undefined && instructor.rate_per_lesson !== null 
        ? instructor.rate_per_lesson 
        : ''
    });
    const specs = instructor.specialization 
      ? instructor.specialization.split(',').map(s => s.trim()).filter(Boolean) 
      : [];
    setSelectedSpecializations(specs);
    setEditingInstructorId(instructor.id);
    setShowModal(true);
  };

  const toggleSpecialization = (title) => {
    if (selectedSpecializations.includes(title)) {
      setSelectedSpecializations(selectedSpecializations.filter(t => t !== title));
    } else {
      setSelectedSpecializations([...selectedSpecializations, title]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedSpecializations.length === 0) {
      addToast('Խնդրում ենք ընտրել առնվազն մեկ մասնագիտացում (դասընթաց)', 'warning');
      return;
    }

    const payload = {
      ...formData,
      specialization: selectedSpecializations.join(', '),
      rate_per_lesson: parseInt(formData.rate_per_lesson) || 0
    };

    try {
      if (editingInstructorId) {
        await api.put(`/instructors/${editingInstructorId}`, payload);
        addToast('Դասախոսի տվյալները թարմացվեցին', 'success');
      } else {
        await api.post('/instructors', payload);
        addToast('Դասախոսը հաջողությամբ պահպանվեց', 'success');
      }
      setShowModal(false);
      setFormData(initialForm);
      setSelectedSpecializations([]);
      setEditingInstructorId(null);
      fetchData();
    } catch (err) {
      console.error(err);
      addToast('Սխալ դասախոսին պահպանելիս', 'error');
    }
  };

  const handleSaveInstructorLessons = async (instructorId) => {
    try {
      const res = await api.put(`/instructors/${instructorId}/lessons`, {
        attended_lessons: parseInt(inlineEditLessons, 10) || 0
      });
      setInstructors(prev => prev.map(inst => inst.id === instructorId ? res.data : inst));
      setInlineEditId(null);
      addToast('Դասախոսի դասերի քանակը թարմացվեց և գրանցվեց պատմության մեջ', 'success');
    } catch (err) {
      console.error(err);
      addToast('Սխալ դասախոսի դասերի քանակը թարմացնելիս', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Համոզվա՞ծ եք, որ ցանկանում եք ջնջել այս դասախոսին:')) {
      try {
        await api.delete(`/instructors/${id}`);
        fetchData();
        addToast('Դասախոսը ջնջվեց', 'success');
      } catch (err) {
        console.error(err);
        addToast('Սխալ դասախոսին ջնջելիս', 'error');
      }
    }
  };

  const filteredInstructors = instructors.filter(inst => {
    const matchesSearch = !searchQuery.trim() || 
      `${inst.first_name} ${inst.last_name}`.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
      (inst.phone && inst.phone.includes(searchQuery.trim())) ||
      (inst.specialization && inst.specialization.toLowerCase().includes(searchQuery.toLowerCase().trim()));
    
    const matchesCourse = !filterCourse || 
      (inst.specialization && inst.specialization.toLowerCase().includes(filterCourse.toLowerCase()));
    
    return matchesSearch && matchesCourse;
  });

  const totalMonthSalary = filteredInstructors.reduce((acc, inst) => acc + (inst.current_month_salary || 0), 0);

  if (showModal) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button
            type="button"
            onClick={() => setShowModal(false)}
            className="p-2.5 bg-white border border-gray-200 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition shadow-sm"
            title="Վերադառնալ"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              {editingInstructorId ? 'Խմբագրել Դասախոսին' : 'Նոր Դասախոս'}
            </h1>
            <p className="text-sm text-gray-500">
              Լրացրեք դասախոսի անձնական տվյալները, մասնագիտացումները և վարձատրությունը
            </p>
          </div>
        </div>

        <div className="glass-panel bg-white p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Անուն *</label>
                <input 
                  required 
                  type="text" 
                  value={formData.first_name} 
                  onChange={e => setFormData({ ...formData, first_name: e.target.value })} 
                  className="glass-input w-full" 
                  placeholder="Անուն" 
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Ազգանուն *</label>
                <input 
                  required 
                  type="text" 
                  value={formData.last_name} 
                  onChange={e => setFormData({ ...formData, last_name: e.target.value })} 
                  className="glass-input w-full" 
                  placeholder="Ազգանուն" 
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Հեռախոսահամար *</label>
              <input 
                required 
                type="text" 
                value={formData.phone} 
                onChange={e => setFormData({ ...formData, phone: e.target.value })} 
                className="glass-input w-full" 
                placeholder="+374 __ __ __ __" 
              />
            </div>

            {/* Specializations (Selectable from Courses) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-bold text-gray-700">
                  Մասնագիտացում (ընտրեք դասընթացները) *
                </label>
                {selectedSpecializations.length > 0 && (
                  <span className="text-xs font-semibold text-brand bg-brand/10 px-2 py-0.5 rounded-full border border-brand/20">
                    {selectedSpecializations.length} ընտրված
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 mb-2.5">
                Կարող եք ընտրել մի քանի ուղղություն, որոնք դասավանդում է տվյալ դասախոսը:
              </p>

              {courses.length === 0 ? (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                  Դասընթացներ համակարգում դեռ գրանցված չեն: Նախ ավելացրեք դասընթացներ «Դասընթացներ» բաժնից:
                </div>
              ) : (
                <div className="flex flex-wrap gap-2 p-3 bg-gray-50 border border-gray-200 rounded-xl min-h-[50px]">
                  {courses.map(course => {
                    const isSelected = selectedSpecializations.includes(course.title);
                    return (
                      <button
                        key={course.id}
                        type="button"
                        onClick={() => toggleSpecialization(course.title)}
                        className={`px-3 py-1.5 rounded-lg text-xs transition border flex items-center gap-1.5 cursor-pointer ${
                          isSelected
                            ? 'bg-brand text-black border-brand shadow-sm font-bold'
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100 font-medium'
                        }`}
                      >
                        <span>{isSelected ? '✓' : '+'}</span>
                        <span>{course.title}</span>
                      </button>
                    );
                  })}

                  {/* Preserve existing non-catalog specializations if editing */}
                  {selectedSpecializations
                    .filter(spec => !courses.some(c => c.title === spec))
                    .map((extraSpec, idx) => (
                      <button
                        key={`extra-${idx}`}
                        type="button"
                        onClick={() => toggleSpecialization(extraSpec)}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold transition border flex items-center gap-1.5 bg-brand text-black border-brand cursor-pointer"
                      >
                        <span>✓</span>
                        <span>{extraSpec}</span>
                      </button>
                    ))}
                </div>
              )}
            </div>

            {/* Rate per lesson */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                Վարձատրություն 1 դասի համար (֏) *
              </label>
              <div className="relative">
                <input 
                  required 
                  type="number" 
                  min="0"
                  step="500"
                  value={formData.rate_per_lesson} 
                  onChange={e => setFormData({ ...formData, rate_per_lesson: e.target.value })} 
                  className="glass-input w-full pr-8" 
                  placeholder="Օր.՝ 5000" 
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-sm">
                  ֏
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Արված դասերի և աշխատավարձի հաշվարկն ավտոմատ կերպով կատարվում է ըստ կցված խմբերի գրաֆիկի:
              </p>
            </div>

            {editingInstructorId && (() => {
              const editingInst = instructors.find(i => i.id === editingInstructorId);
              const editHist = editingInst?.lesson_edit_history || [];
              if (editHist.length === 0) return null;
              return (
                <div className="pt-3 border-t border-gray-100">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                    Դասերի Խմբագրման Պատմություն
                  </p>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
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

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button 
                type="button" 
                onClick={() => setShowModal(false)} 
                className="px-6 py-2.5 bg-white border border-gray-300 rounded-md text-gray-700 font-medium hover:bg-gray-50 transition text-sm"
              >
                Չեղարկել
              </button>
              <button type="submit" className="glass-button px-8 py-2.5 text-sm">
                {editingInstructorId ? 'Թարմացնել' : 'Պահպանել'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Դասախոսներ</h1>
          <p className="text-gray-500">Կառավարեք Ձեր աշխատակազմը, մասնագիտացումները և աշխատավարձերի հաշվարկը</p>
        </div>
        <button onClick={openCreateModal} className="glass-button flex items-center gap-2">
          <Plus size={20} /> Նոր դասախոս
        </button>
      </div>

      {/* Filters & Search */}
      <div className="glass-panel p-4 mb-8 flex flex-col lg:flex-row items-center justify-between gap-4">
        <div className="flex flex-col md:flex-row items-center gap-3 w-full flex-1">
          <div className="relative flex-1 w-full min-w-[220px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
            <input 
              type="text" 
              placeholder="Որոնել դասախոսի (անուն, հեռախոս, մասնագիտացում)..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="glass-input w-full pl-10 pr-8 py-2 text-sm"
            />
            {searchQuery && (
              <button 
                type="button" 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <BookOpen size={16} className="text-gray-400 hidden sm:block" />
            <select 
              value={filterCourse}
              onChange={(e) => setFilterCourse(e.target.value)}
              className="glass-input w-full md:w-56 py-2 text-sm"
            >
              <option value="">Բոլոր դասընթացները</option>
              {courses.map(course => (
                <option key={course.id} value={course.title}>{course.title}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative w-full md:w-auto">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value || currentMonthStr)}
                className="glass-input pl-9 py-2 text-sm w-full md:w-44"
                title="Ընտրեք ամիսը աշխատավարձի պատմությունը դիտելու համար"
              />
            </div>
            {selectedMonth !== currentMonthStr && (
              <button
                type="button"
                onClick={() => setSelectedMonth(currentMonthStr)}
                className="text-xs font-semibold text-brand bg-brand/10 hover:bg-brand/20 px-2.5 py-2 rounded-lg transition whitespace-nowrap"
              >
                Այս ամիս
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 bg-green-50 border border-green-200 px-4 py-2 rounded-xl w-full lg:w-auto justify-between lg:justify-end">
          <span className="text-xs text-green-800 font-medium whitespace-nowrap">
            Աշխատավարձերի ֆոնդ ({selectedMonth}):
          </span>
          {loading ? (
            <div className="h-5 w-24 bg-green-200/70 rounded animate-pulse" />
          ) : (
            <span className="text-base font-extrabold text-green-700 whitespace-nowrap">
              {totalMonthSalary.toLocaleString()} ֏
            </span>
          )}
        </div>
      </div>

      {/* Instructors Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
        {loading ? (
          Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="glass-panel p-6 flex flex-col justify-between animate-pulse">
              <div>
                <div className="text-center mb-4">
                  <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gray-200" />
                  <div className="h-6 w-40 bg-gray-200 rounded mx-auto mb-2.5" />
                  <div className="flex justify-center gap-1.5 mt-2">
                    <div className="h-5 w-24 bg-gray-200 rounded-full" />
                    <div className="h-5 w-20 bg-gray-200 rounded-full" />
                  </div>
                  <div className="h-6 w-32 bg-gray-100 rounded-full mx-auto mt-3" />
                </div>
                <div className="bg-gray-50/80 rounded-xl p-4 border border-gray-100 space-y-3 my-4">
                  <div className="flex justify-between items-center">
                    <div className="h-3.5 w-36 bg-gray-200 rounded" />
                    <div className="h-4 w-20 bg-gray-200 rounded" />
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="h-3.5 w-40 bg-gray-200 rounded" />
                    <div className="h-5 w-16 bg-gray-200 rounded" />
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="h-3.5 w-36 bg-gray-200 rounded" />
                    <div className="h-5 w-16 bg-gray-200 rounded" />
                  </div>
                  <div className="pt-2 border-t border-gray-200/60 flex justify-between items-center">
                    <div className="h-4 w-44 bg-gray-200 rounded" />
                    <div className="h-5 w-24 bg-gray-200 rounded" />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-3 border-t border-gray-100 mt-2">
                <div className="flex-1 h-8 bg-gray-200 rounded-lg" />
                <div className="w-8 h-8 bg-gray-200 rounded-lg" />
              </div>
            </div>
          ))
        ) : (
          filteredInstructors.map((instructor) => {
            const specList = instructor.specialization 
              ? instructor.specialization.split(',').map(s => s.trim()).filter(Boolean)
              : [];

            return (
              <div key={instructor.id} className="glass-panel p-6 flex flex-col justify-between hover:shadow-lg transition">
                <div>
                  {/* Header Info */}
                  <div className="text-center mb-4">
                    <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-brand/10 border-2 border-brand/30 flex items-center justify-center text-xl font-bold text-gray-800 shadow-sm">
                      {instructor.first_name?.[0]}{instructor.last_name?.[0]}
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 leading-tight whitespace-nowrap">
                      {instructor.first_name} {instructor.last_name}
                    </h3>
                    
                    {/* Specializations Badges */}
                    <div className="flex flex-wrap justify-center gap-1.5 mt-2.5 min-h-[26px]">
                      {specList.length > 0 ? (
                        specList.map((spec, sIdx) => (
                          <span 
                            key={sIdx} 
                            className="bg-brand/15 text-gray-800 border border-brand/30 text-xs px-2.5 py-0.5 rounded-full font-medium whitespace-nowrap"
                          >
                            {spec}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-400 text-xs italic">Մասնագիտացումը նշված չէ</span>
                      )}
                    </div>
                    
                    <div className="inline-flex items-center gap-2 text-xs text-gray-600 mt-3 bg-gray-50 px-3 py-1 rounded-full border border-gray-100 whitespace-nowrap">
                      <Phone size={12} className="shrink-0" /> {instructor.phone}
                    </div>
                  </div>

                  {/* Assigned Groups */}
                  {instructor.assigned_groups && instructor.assigned_groups.length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 mb-1.5 whitespace-nowrap">
                        <Users2 size={13} className="shrink-0" /> Կցված խմբեր ({instructor.assigned_groups.length})
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {instructor.assigned_groups.map((groupName, gIdx) => (
                          <span key={gIdx} className="bg-amber-50 text-amber-800 border border-amber-200/60 text-xs px-2.5 py-0.5 rounded-md font-medium whitespace-nowrap">
                            {groupName}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Salary & Lessons Stats */}
                  <div className="bg-gray-50/80 rounded-xl p-4 border border-gray-100 space-y-2.5 my-4">
                    <div className="flex justify-between items-center gap-3 text-xs whitespace-nowrap">
                      <span className="text-gray-500 flex items-center gap-1.5">
                        <Coins size={13} className="text-gray-400 shrink-0" /> 1 դասի վարձատրություն
                      </span>
                      <span className="font-bold text-gray-800 shrink-0">
                        {(instructor.rate_per_lesson || 0).toLocaleString()} ֏
                      </span>
                    </div>

                    <div className="flex justify-between items-center gap-3 text-xs whitespace-nowrap">
                      <span className="text-gray-500 flex items-center gap-1.5">
                        <CalendarCheck size={13} className="text-gray-400 shrink-0" /> Արված դասեր ({selectedMonth === currentMonthStr ? 'այս ամիս' : selectedMonth})
                      </span>
                      {inlineEditId === instructor.id ? (
                        <div className="flex items-center gap-1 shrink-0">
                          <input
                            type="number"
                            min="0"
                            value={inlineEditLessons}
                            onChange={(e) => setInlineEditLessons(e.target.value)}
                            className="w-16 px-1.5 py-0.5 text-xs border border-brand rounded bg-white text-center font-bold focus:outline-none"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveInstructorLessons(instructor.id)}
                            className="p-1 bg-emerald-600 text-white rounded hover:bg-emerald-700"
                            title="Պահպանել"
                          >
                            <Check size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setInlineEditId(null)}
                            className="p-1 bg-gray-200 text-gray-600 rounded hover:bg-gray-300"
                            title="Չեղարկել"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 whitespace-nowrap">
                            {instructor.current_month_lessons || 0} դաս
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setInlineEditId(instructor.id);
                              setInlineEditLessons(instructor.current_month_lessons || 0);
                            }}
                            className="p-1 text-gray-400 hover:text-brand rounded hover:bg-brand/10 transition"
                            title="Խմբագրել դասախոսի դասերի քանակը"
                          >
                            <Edit2 size={12} />
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between items-center gap-3 text-xs whitespace-nowrap">
                      <span className="text-gray-500 flex items-center gap-1.5">
                        <CalendarCheck size={13} className="text-gray-400 shrink-0" /> Ընդհանուր արված դասեր
                      </span>
                      <span className="font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded border border-gray-200 shrink-0 whitespace-nowrap" title="Պահպանված է նաև նախկին խմբերում դասավանդած դասերի քանակը">
                        {instructor.total_lessons_taught ?? instructor.current_month_lessons ?? 0} դաս
                      </span>
                    </div>

                    <div className="pt-2.5 border-t border-gray-200/60 flex justify-between items-center gap-3 whitespace-nowrap">
                      <span className="text-xs font-bold text-gray-700">Ընդհանուր եկամուտ (ամսական)</span>
                      <span className="text-base font-extrabold text-green-700 shrink-0">
                        {(instructor.current_month_salary || 0).toLocaleString()} ֏
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-3 border-t border-gray-100 mt-2">
                  <button 
                    onClick={() => openEditModal(instructor)} 
                    className="flex-1 py-1.5 px-3 bg-gray-50 hover:bg-brand/10 text-gray-700 hover:text-black border border-gray-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                  >
                    <Edit2 size={14} /> Խմբագրել
                  </button>
                  <button 
                    onClick={() => handleDelete(instructor.id)} 
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition" 
                    title="Ջնջել"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })
        )}

        {!loading && filteredInstructors.length === 0 && (
          <div className="col-span-full p-12 text-center text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
            {instructors.length === 0 ? 'Դասախոսներ չեն գտնվել' : 'Ֆիլտրման պայմաններին համապատասխանող դասախոս չի գտնվել'}
          </div>
        )}
      </div>
    </div>
  );
};

export default Instructors;
