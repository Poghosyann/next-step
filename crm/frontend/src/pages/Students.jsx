import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { User, Plus, X } from 'lucide-react';

const Students = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 50;

  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '', course_direction: 'Ֆինանսական հաշվառում', course_format: 'Օֆլայն', 
    location: '', status: 'Նոր', phone: '', email: '', 
    monthly_fee: 95000, discount_percent: 0, gift_card: 0, source: 'Instagram', 
    comment: '', urgent_notes: ''
  });

  const fetchStudents = async () => {
    try {
      const skip = (page - 1) * limit;
      const response = await api.get(`/students?skip=${skip}&limit=${limit}`);
      setStudents(response.data.items);
      setTotalStudents(response.data.total);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [page]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/students', formData);
      setShowModal(false);
      fetchStudents();
    } catch (error) {
      console.error('Error creating student:', error);
      alert('Սխալ առաջացավ ուսանողին պահպանելիս:');
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Ուսանողներ</h1>
          <p className="text-gray-500">Կառավարեք ձեր ուսանողների բազան</p>
        </div>
        <button onClick={() => setShowModal(true)} className="glass-button flex items-center gap-2">
          <Plus size={18} /> Ավելացնել
        </button>
      </div>

      <div className="glass-panel overflow-hidden">
        <div className="p-4 border-b border-gray-200 overflow-x-auto">
          <table className="w-full text-left text-gray-800">
            <thead>
              <tr className="border-b border-gray-200 text-gray-600">
                <th className="p-3">Անուն Ազգանուն</th>
                <th className="p-3">Ուղղություն</th>
                <th className="p-3">Հեռախոս</th>
                <th className="p-3">Էլ. հասցե</th>
                <th className="p-3">Կարգավիճակ</th>
              </tr>
            </thead>
            <tbody>
              {students.map((st) => (
                <tr 
                  key={st.id} 
                  onClick={() => navigate(`/students/${st.id}`)}
                  className="border-b border-gray-100 hover:bg-gray-50 transition cursor-pointer"
                >
                  <td className="p-3 font-medium">{st.full_name}</td>
                  <td className="p-3 text-brand font-semibold">{st.course_direction}</td>
                  <td className="p-3">{st.phone}</td>
                  <td className="p-3">{st.email}</td>
                  <td className="p-3">
                    <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm border border-gray-200">
                      {st.status}
                    </span>
                  </td>
                </tr>
              ))}
              {students.length === 0 && (
                <tr><td colSpan="5" className="p-12 text-center text-gray-400">Ուսանողներ չեն գտնվել</td></tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination UI */}
        <div className="p-4 border-t border-gray-100 flex justify-between items-center text-gray-600 bg-gray-50">
          <div>
            Ընդհանուր <span className="font-bold text-gray-800">{totalStudents.toLocaleString()}</span> ուսանող
          </div>
          <div className="flex gap-2">
            <button 
              disabled={page === 1} 
              onClick={() => setPage(p => p - 1)}
              className="px-4 py-2 border border-gray-200 rounded-md hover:bg-white disabled:opacity-50 transition"
            >
              Նախորդ
            </button>
            <span className="px-4 py-2 text-gray-800 font-medium">Էջ {page} / {Math.ceil(totalStudents / limit) || 1}</span>
            <button 
              disabled={page >= Math.ceil(totalStudents / limit)}
              onClick={() => setPage(p => p + 1)}
              className="px-4 py-2 border border-gray-200 rounded-md hover:bg-white disabled:opacity-50 transition"
            >
              Հաջորդ
            </button>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col my-8">
            <div className="flex justify-between items-center p-5 border-b border-gray-100 sticky top-0 z-10 bg-white">
              <h2 className="text-xl font-bold text-gray-800">Նոր Ուսանող</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-black">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                
                {/* 1. Personal Details */}
                <div className="space-y-4">
                  <h3 className="font-bold text-brand uppercase text-sm mb-2 border-b border-gray-100 pb-1">Անձնական Տվյալներ</h3>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Անուն Ազգանուն *</label>
                    <input required type="text" name="full_name" value={formData.full_name} onChange={handleChange} className="glass-input w-full" placeholder="Օր.՝ Անուն Ազգանուն" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Հեռախոսահամար *</label>
                    <input required type="text" name="phone" value={formData.phone} onChange={handleChange} className="glass-input w-full" placeholder="+374 __ __ __ __" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Էլ. Հասցե</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} className="glass-input w-full" placeholder="email@example.com" />
                  </div>
                </div>

                {/* 2. Course Details */}
                <div className="space-y-4">
                  <h3 className="font-bold text-brand uppercase text-sm mb-2 border-b border-gray-100 pb-1">Դասընթացի Մանրամասներ</h3>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Ուղղություն *</label>
                    <select name="course_direction" value={formData.course_direction} onChange={handleChange} className="glass-input w-full">
                      <option>Ֆինանսական հաշվառում</option>
                      <option>Հարկային հաշվառում</option>
                      <option>1C ՀԾ ծրագրեր</option>
                      <option>Գլխավոր հաշվապահի դասընթաց</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Կարգավիճակ</label>
                    <select name="status" value={formData.status} onChange={handleChange} className="glass-input w-full">
                      <option>Նոր</option>
                      <option>Հաստատված</option>
                      <option>Ընթացիկ</option>
                      <option>Անորոշ</option>
                      <option>Արխիվ</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 3. Financials */}
              <div className="mb-6">
                <h3 className="font-bold text-brand uppercase text-sm mb-3 border-b border-gray-100 pb-1">Ֆինանսներ</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Ամսավճար (AMD) *</label>
                    <input required type="number" name="monthly_fee" value={formData.monthly_fee} onChange={handleChange} className="glass-input w-full" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Զեղչ (%)</label>
                    <input type="number" name="discount_percent" value={formData.discount_percent} onChange={handleChange} className="glass-input w-full" />
                  </div>
                </div>
              </div>

              {/* 4. Notes */}
              <div>
                <h3 className="font-bold text-brand uppercase text-sm mb-3 border-b border-gray-100 pb-1">Լրացուցիչ</h3>
                <label className="block text-sm font-bold text-gray-700 mb-1">Նշումներ</label>
                <textarea name="comment" value={formData.comment} onChange={handleChange} rows="3" className="glass-input w-full resize-y" placeholder="Այլ նշումներ..."></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-gray-100">
                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2.5 border border-gray-300 rounded-md text-gray-700 font-medium hover:bg-gray-50 transition">
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

export default Students;
