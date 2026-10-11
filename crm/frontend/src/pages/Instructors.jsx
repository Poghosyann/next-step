import { useState, useEffect } from 'react';
import api from '../api';
import { X, Plus, Trash2, Edit2, Phone, CalendarCheck, Coins, Users2 } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const Instructors = () => {
  const { addToast } = useToast();
  const [instructors, setInstructors] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingInstructorId, setEditingInstructorId] = useState(null);

  const initialForm = {
    first_name: '',
    last_name: '',
    phone: '',
    specialization: '',
    rate_per_lesson: ''
  };
  const [formData, setFormData] = useState(initialForm);

  const fetchInstructors = () => {
    api.get('/instructors').then(res => setInstructors(res.data)).catch(console.error);
  };

  useEffect(() => {
    fetchInstructors();
  }, []);

  const openCreateModal = () => {
    setFormData(initialForm);
    setEditingInstructorId(null);
    setShowModal(true);
  };

  const openEditModal = (instructor) => {
    setFormData({
      first_name: instructor.first_name || '',
      last_name: instructor.last_name || '',
      phone: instructor.phone || '',
      specialization: instructor.specialization || '',
      rate_per_lesson: instructor.rate_per_lesson !== undefined && instructor.rate_per_lesson !== null 
        ? instructor.rate_per_lesson 
        : ''
    });
    setEditingInstructorId(instructor.id);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
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
      setEditingInstructorId(null);
      fetchInstructors();
    } catch (err) {
      console.error(err);
      addToast('Սխալ դասախոսին պահպանելիս', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Համոզվա՞ծ եք, որ ցանկանում եք ջնջել այս դասախոսին:')) {
      try {
        await api.delete(`/instructors/${id}`);
        fetchInstructors();
        addToast('Դասախոսը ջնջվեց', 'success');
      } catch (err) {
        console.error(err);
        addToast('Սխալ դասախոսին ջնջելիս', 'error');
      }
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Դասախոսներ</h1>
          <p className="text-gray-500">Կառավարեք Ձեր աշխատակազմը և աշխատավարձերի հաշվարկը</p>
        </div>
        <button onClick={openCreateModal} className="glass-button flex items-center gap-2">
          <Plus size={20} /> Նոր դասախոս
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {instructors.map((instructor) => (
          <div key={instructor.id} className="glass-panel p-6 flex flex-col justify-between hover:shadow-lg transition">
            <div>
              {/* Header Info */}
              <div className="text-center mb-4">
                <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-brand/10 border-2 border-brand/30 flex items-center justify-center text-xl font-bold text-gray-800">
                  {instructor.first_name?.[0]}{instructor.last_name?.[0]}
                </div>
                <h3 className="text-xl font-bold text-gray-800 leading-tight">
                  {instructor.first_name} {instructor.last_name}
                </h3>
                <p className="text-gray-500 text-sm mt-1">{instructor.specialization || 'Մասնագիտացումը նշված չէ'}</p>
                
                <div className="inline-flex items-center gap-2 text-xs text-gray-600 mt-2 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
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
        ))}

        {instructors.length === 0 && (
          <div className="col-span-full p-12 text-center text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
            Դասախոսներ չեն գտնվել
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-800">
                {editingInstructorId ? 'Խմբագրել Դասախոսին' : 'Նոր Դասախոս'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-800 transition">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Մասնագիտացում</label>
                <input 
                  type="text" 
                  value={formData.specialization} 
                  onChange={e => setFormData({ ...formData, specialization: e.target.value })} 
                  className="glass-input w-full" 
                  placeholder="Օր.՝ Հարկային հաշվառում" 
                />
              </div>
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
