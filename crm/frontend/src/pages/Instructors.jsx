import { useState, useEffect } from 'react';
import api from '../api';
import { X, Plus, Trash2, Edit2, Phone, CalendarCheck, Coins, Users2, Search, BookOpen } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const Instructors = () => {
  const { addToast } = useToast();
  const [instructors, setInstructors] = useState([]);
  const [courses, setCourses] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingInstructorId, setEditingInstructorId] = useState(null);
  const [selectedSpecializations, setSelectedSpecializations] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCourse, setFilterCourse] = useState('');

  const initialForm = {
    first_name: '',
    last_name: '',
    phone: '',
    rate_per_lesson: ''
  };
  const [formData, setFormData] = useState(initialForm);

  const fetchData = async () => {
    try {
      const [instRes, courseRes] = await Promise.all([
        api.get('/instructors'),
        api.get('/courses')
      ]);
      setInstructors(instRes.data);
      setCourses(courseRes.data);
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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
      <div className="glass-panel p-4 mb-8 flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
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
            className="glass-input w-full md:w-64 py-2 text-sm"
          >
            <option value="">Բոլոր դասընթացները</option>
            {courses.map(course => (
              <option key={course.id} value={course.title}>{course.title}</option>
            ))}
          </select>
          {filterCourse && (
            <button
              onClick={() => setFilterCourse('')}
              className="text-xs text-gray-500 hover:text-black underline whitespace-nowrap"
            >
              Մաքրել
            </button>
          )}
        </div>
      </div>

      {/* Instructors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredInstructors.map((instructor) => {
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
                  <h3 className="text-xl font-bold text-gray-800 leading-tight">
                    {instructor.first_name} {instructor.last_name}
                  </h3>
                  
                  {/* Specializations Badges */}
                  <div className="flex flex-wrap justify-center gap-1.5 mt-2.5 min-h-[26px]">
                    {specList.length > 0 ? (
                      specList.map((spec, sIdx) => (
                        <span 
                          key={sIdx} 
                          className="bg-brand/15 text-gray-800 border border-brand/30 text-xs px-2.5 py-0.5 rounded-full font-medium"
                        >
                          {spec}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-400 text-xs italic">Մասնագիտացումը նշված չէ</span>
                    )}
                  </div>
                  
                  <div className="inline-flex items-center gap-2 text-xs text-gray-600 mt-3 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                    <Phone size={12} /> {instructor.phone}
                  </div>
                </div>

                {/* Assigned Groups */}
                {instructor.assigned_groups && instructor.assigned_groups.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 mb-1.5">
                      <Users2 size={13} /> Կցված խմբեր ({instructor.assigned_groups.length})
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {instructor.assigned_groups.map((groupName, gIdx) => (
                        <span key={gIdx} className="bg-amber-50 text-amber-800 border border-amber-200/60 text-xs px-2 py-0.5 rounded-md font-medium">
                          {groupName}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Salary & Lessons Stats */}
                <div className="bg-gray-50/80 rounded-xl p-3.5 border border-gray-100 space-y-2.5 my-4">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500 flex items-center gap-1">
                      <Coins size={13} className="text-gray-400" /> 1 դասի վարձատրություն
                    </span>
                    <span className="font-bold text-gray-800">
                      {(instructor.rate_per_lesson || 0).toLocaleString()} ֏
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500 flex items-center gap-1">
                      <CalendarCheck size={13} className="text-gray-400" /> Արված դասեր (ամսվա 1-ից)
                    </span>
                    <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                      {instructor.current_month_lessons || 0} դաս
                    </span>
                  </div>

                  <div className="pt-2 border-t border-gray-200/60 flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-700">Ընդհանուր եկամուտ</span>
                    <span className="text-base font-extrabold text-green-700">
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
        })}

        {filteredInstructors.length === 0 && (
          <div className="col-span-full p-12 text-center text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
            {instructors.length === 0 ? 'Դասախոսներ չեն գտնվել' : 'Ֆիլտրման պայմաններին համապատասխանող դասախոս չի գտնվել'}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col my-8">
            <div className="flex justify-between items-center p-5 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-800">
                {editingInstructorId ? 'Խմբագրել Դասախոսին' : 'Նոր Դասախոս'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-800 transition">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
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
                  <div className="flex flex-wrap gap-2 p-3 bg-gray-50 border border-gray-200 rounded-xl min-h-[50px] max-h-48 overflow-y-auto">
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

              {/* Modal footer */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  className="px-5 py-2 bg-white border border-gray-300 rounded-md text-gray-700 font-medium hover:bg-gray-50 transition text-sm"
                >
                  Չեղարկել
                </button>
                <button type="submit" className="glass-button px-6 text-sm">
                  {editingInstructorId ? 'Թարմացնել' : 'Պահպանել'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Instructors;
