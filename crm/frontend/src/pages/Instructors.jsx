import React, { useState, useEffect } from 'react';
import api from '../api';
import { X, Plus, Trash2, Edit2, Phone } from 'lucide-react';

const Instructors = () => {
  const [instructors, setInstructors] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ first_name: '', last_name: '', phone: '', specialization: '' });

  const fetchInstructors = () => {
    api.get('/instructors').then(res => setInstructors(res.data)).catch(console.error);
  };

  useEffect(() => {
    fetchInstructors();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/instructors', formData);
      setShowModal(false);
      setFormData({ first_name: '', last_name: '', phone: '', specialization: '' });
      fetchInstructors();
    } catch (err) {
      console.error(err);
      alert('Error saving instructor');
    }
  };

  const handleDelete = async (id) => {
    if(window.confirm('Are you sure you want to delete this instructor?')) {
      try {
        await api.delete(`/instructors/${id}`);
        fetchInstructors();
      } catch (err) {
        console.error(err);
        alert('Error deleting instructor');
      }
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Դասախոսներ</h1>
          <p className="text-gray-500">Կառավարեք Ձեր աշխատակազմը</p>
        </div>
        <button onClick={() => setShowModal(true)} className="glass-button flex items-center gap-2">
          <Plus size={20} /> Նոր դասախոս
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {instructors.map((instructor) => (
          <div key={instructor.id} className="glass-panel p-6 flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-brand/10 text-brand rounded-full flex items-center justify-center text-2xl font-bold mb-4">
              {instructor.first_name[0]}{instructor.last_name[0]}
            </div>
            <h3 className="text-xl font-semibold mb-1 text-gray-800">{instructor.first_name} {instructor.last_name}</h3>
            <p className="text-gray-500 text-sm mb-4">{instructor.specialization}</p>
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-6 bg-gray-50 px-3 py-1.5 rounded-full">
              <Phone size={14} /> {instructor.phone}
            </div>
            <div className="flex justify-center w-full gap-2 pt-4 border-t border-gray-100 mt-auto">
              <button onClick={() => handleDelete(instructor.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-md transition w-full flex justify-center">
                <Trash2 size={18} />
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
              <h2 className="text-xl font-bold text-gray-800">Նոր Դասախոս</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-800 transition">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Անուն</label>
                  <input required type="text" value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} className="glass-input w-full" placeholder="Անուն" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Ազգանուն</label>
                  <input required type="text" value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} className="glass-input w-full" placeholder="Ազգանուն" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Հեռախոսահամար</label>
                <input required type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="glass-input w-full" placeholder="+374 __ __ __ __" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Մասնագիտացում</label>
                <input required type="text" value={formData.specialization} onChange={e => setFormData({...formData, specialization: e.target.value})} className="glass-input w-full" placeholder="Օր.՝ Հարկային հաշվառում" />
              </div>
              <div className="flex justify-end pt-4">
                <button type="submit" className="glass-button w-full">Պահպանել</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Instructors;
