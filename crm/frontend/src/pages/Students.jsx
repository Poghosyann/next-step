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
    full_name: '', course_direction: 'Python Web & ML Advanced', course_format: 'Առկա', 
    location: 'Հակոբ Հակոբյան 3/17', status: 'Ընթացիկ ուսանող', phone: '', email: '', 
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
      alert('Error creating student');
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Ուսանողներ</h1>
          <p className="text-white/60">Կառավարեք ձեր ուսանողների բազան</p>
        </div>
        <button onClick={() => setShowModal(true)} className="glass-button flex items-center gap-2">
          <Plus size={18} /> Ավելացնել
        </button>
      </div>

      <div className="glass-panel overflow-hidden">
        <div className="p-4 border-b border-white/10 overflow-x-auto">
          <table className="w-full text-left text-white">
            <thead>
              <tr className="border-b border-white/10 text-white/70">
                <th className="p-3">Անուն Ազգանուն</th>
                <th className="p-3">Ուղղություն</th>
                <th className="p-3">Հեռախոս</th>
                <th className="p-3">Էլ. փոստ</th>
                <th className="p-3">Կարգավիճակ</th>
              </tr>
            </thead>
            <tbody>
              {students.map((st) => (
                <tr 
                  key={st.id} 
                  onClick={() => navigate(`/students/${st.id}`)}
                  className="border-b border-white/5 hover:bg-white/10 transition cursor-pointer"
                >
                  <td className="p-3">{st.full_name}</td>
                  <td className="p-3 text-brand">{st.course_direction}</td>
                  <td className="p-3">{st.phone}</td>
                  <td className="p-3">{st.email}</td>
                  <td className="p-3">{st.status}</td>
                </tr>
              ))}
              {students.length === 0 && (
                <tr><td colSpan="5" className="p-6 text-center text-white/50">Ուսանողներ չկան</td></tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination UI */}
        <div className="p-4 border-t border-white/10 flex justify-between items-center text-white/70">
          <div>
            Ընդհանուր՝ <span className="font-bold text-white">{totalStudents.toLocaleString()}</span> ուսանող
          </div>
          <div className="flex gap-2">
            <button 
              disabled={page === 1} 
              onClick={() => setPage(page - 1)}
              className="px-4 py-2 border border-white/20 rounded hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Նախորդը
            </button>
            <span className="px-4 py-2 text-white">Էջ {page} / {Math.ceil(totalStudents / limit) || 1}</span>
            <button 
              disabled={page >= Math.ceil(totalStudents / limit)} 
              onClick={() => setPage(page + 1)}
              className="px-4 py-2 border border-white/20 rounded hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Հաջորդը
            </button>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#fcfcfc] rounded-xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-5 border-b">
              <h2 className="text-xl font-bold text-gray-800">Նոր ուսանող</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-black">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 bg-white">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-bold text-[#1f2937] mb-2">Դասընթացի ուղղություն</label>
                  <select name="course_direction" value={formData.course_direction} onChange={handleChange} className="w-full border border-gray-300 rounded-md p-2.5 text-gray-700 focus:border-brand focus:ring-1 focus:ring-brand outline-none">
                    <option>Ֆինանսական հաշվառում</option>
                    <option>Հարկային հաշվառում</option>
                    <option>1C Օպերատոր</option>
                    <option>1C Հաշվապահ</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#1f2937] mb-2">Դասընթացի ձևաչափ</label>
                  <select name="course_format" value={formData.course_format} onChange={handleChange} className="w-full border border-gray-300 rounded-md p-2.5 text-gray-700 focus:border-brand focus:ring-1 focus:ring-brand outline-none">
                    <option>Առկա</option>
                    <option>Առցանց</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#1f2937] mb-2">Մասնաշենք</label>
                  <select name="location" value={formData.location} onChange={handleChange} className="w-full border border-gray-300 rounded-md p-2.5 text-gray-700 focus:border-brand focus:ring-1 focus:ring-brand outline-none">
                    <option>Հակոբ Հակոբյան 3/17</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#1f2937] mb-2">Կարգավիճակ</label>
                  <select name="status" value={formData.status} onChange={handleChange} className="w-full border border-gray-300 rounded-md p-2.5 text-gray-700 focus:border-brand focus:ring-1 focus:ring-brand outline-none">
                    <option>Ընթացիկ ուսանող</option>
                    <option>Ավարտած</option>
                    <option>Հեռացված</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 pb-6 border-b border-gray-100">
                <div>
                  <label className="block text-sm font-bold text-[#1f2937] mb-2">Անուն Ազգանուն</label>
                  <input required name="full_name" value={formData.full_name} onChange={handleChange} type="text" className="w-full border border-gray-300 rounded-md p-2.5 text-gray-700 focus:border-brand outline-none" placeholder="Անուն Ազգանուն" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#1f2937] mb-2">Հեռախոսահամար</label>
                  <input required name="phone" value={formData.phone} onChange={handleChange} type="text" className="w-full border border-gray-300 rounded-md p-2.5 text-gray-700 focus:border-brand outline-none" placeholder="+374 __ __ __ __" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#1f2937] mb-2">Էլ. փոստ</label>
                  <input required name="email" value={formData.email} onChange={handleChange} type="email" className="w-full border border-gray-300 rounded-md p-2.5 text-gray-700 focus:border-brand outline-none" placeholder="էլ. փոստ" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-bold text-[#1f2937] mb-2">Ամսավճար</label>
                  <input name="monthly_fee" value={formData.monthly_fee} onChange={handleChange} type="number" className="w-full border border-gray-300 rounded-md p-2.5 text-gray-700 focus:border-brand outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#1f2937] mb-2">Զեղչ %</label>
                  <input name="discount_percent" value={formData.discount_percent} onChange={handleChange} type="number" className="w-full border border-gray-300 rounded-md p-2.5 text-gray-700 focus:border-brand outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#1f2937] mb-2">Նվեր քարտ</label>
                  <input name="gift_card" value={formData.gift_card} onChange={handleChange} type="number" className="w-full border border-gray-300 rounded-md p-2.5 text-gray-700 focus:border-brand outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#1f2937] mb-2">Տեղեկացել է</label>
                  <select name="source" value={formData.source} onChange={handleChange} className="w-full border border-gray-300 rounded-md p-2.5 text-gray-700 focus:border-brand focus:ring-1 focus:ring-brand outline-none">
                    <option>Instagram</option>
                    <option>Facebook</option>
                    <option>Ընկերոջից</option>
                  </select>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-bold text-[#1f2937] mb-2">Մեկնաբանություն</label>
                <textarea name="comment" value={formData.comment} onChange={handleChange} rows="3" className="w-full border border-gray-300 rounded-md p-2.5 text-gray-700 focus:border-brand outline-none resize-y" placeholder="Մեկնաբանություն"></textarea>
              </div>

              <div className="mb-8">
                <label className="block text-sm font-bold text-[#1f2937] mb-2">Նշումներ (հրատապ)</label>
                <textarea name="urgent_notes" value={formData.urgent_notes} onChange={handleChange} rows="2" className="w-full border border-gray-300 rounded-md p-2.5 text-gray-700 focus:border-brand outline-none resize-y" placeholder="Նշումներ"></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2.5 border border-gray-300 rounded-md text-gray-700 font-semibold hover:bg-gray-50 transition">
                  Չեղարկել
                </button>
                <button type="submit" className="px-6 py-2.5 bg-[#1e293b] hover:bg-[#0f172a] text-white rounded-md font-semibold transition">
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
