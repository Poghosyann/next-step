import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { ArrowLeft, User, CreditCard, Trash2, Edit2, X } from 'lucide-react';

const StudentProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [formData, setFormData] = useState({});

  const fetchStudent = async () => {
    try {
      const response = await api.get(`/students/${id}`);
      setStudent(response.data);
      setFormData(response.data);
    } catch (error) {
      console.error('Error fetching student details:', error);
    }
  };

  useEffect(() => {
    fetchStudent();
  }, [id]);

  const handleDelete = async () => {
    if (window.confirm('Համոզվա՞ծ եք, որ ցանկանում եք ջնջել այս ուսանողին: Այս գործողությունը անդառնալի է։')) {
      try {
        await api.delete(`/students/${id}`);
        navigate('/students');
      } catch (err) {
        console.error(err);
        alert('Սխալ ջնջելիս։');
      }
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/students/${id}`, formData);
      setShowEditModal(false);
      fetchStudent();
    } catch (err) {
      console.error(err);
      alert('Սխալ տվյալները թարմացնելիս։');
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (!student) return <div className="p-8 text-gray-800">Բեռնվում է...</div>;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <Link to="/students" className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition">
          <ArrowLeft size={18} /> Վերադառնալ ցանկ
        </Link>
        <div className="flex gap-2">
          <button onClick={() => setShowEditModal(true)} className="glass-button flex items-center gap-2 !py-2 !px-4">
            <Edit2 size={16} /> Խմբագրել
          </button>
          <button onClick={handleDelete} className="bg-red-500 text-white hover:bg-red-600 transition px-4 py-2 rounded-md flex items-center gap-2 font-medium">
            <Trash2 size={16} /> Ջնջել
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Profile Card */}
        <div className="col-span-1 glass-panel p-6">
          <div className="flex flex-col items-center mb-6 pt-4">
            <h2 className="text-2xl font-bold text-gray-800">{student.full_name}</h2>
            <p className="text-brand font-bold text-center mt-1">{student.course_direction}</p>
            <span className="mt-3 px-4 py-1.5 bg-gray-100 rounded-full text-sm font-semibold text-gray-600 border border-gray-200">
              {student.status}
            </span>
          </div>
          
          <div className="space-y-4 text-gray-700 border-t border-gray-100 pt-5">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Հեռախոսահամար</p>
              <p className="font-medium">{student.phone}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Էլ. Հասցե</p>
              <p className="font-medium">{student.email}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Ամսավճար / Զեղչ</p>
              <p className="font-medium">
                {student.monthly_fee?.toLocaleString()} ֏
                {student.discount_percent > 0 && <span className="text-brand ml-2 bg-brand/10 px-2 py-0.5 rounded text-sm">-{student.discount_percent}%</span>}
              </p>
            </div>
          </div>
        </div>

        {/* Payments History */}
        <div className="col-span-1 md:col-span-2 glass-panel p-6 flex flex-col min-h-[400px]">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-100">
            <CreditCard className="text-brand" size={24} />
            <h3 className="text-xl font-bold text-gray-800">Վճարումների պատմություն</h3>
          </div>
          
          {student.payments && student.payments.length > 0 ? (
            <div className="flex-1 overflow-auto">
              <table className="w-full text-left text-gray-800">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-sm">
                    <th className="p-3 font-semibold rounded-l-lg">Ամսաթիվ</th>
                    <th className="p-3 font-semibold">Գումար</th>
                    <th className="p-3 font-semibold">Եղանակ</th>
                    <th className="p-3 font-semibold rounded-r-lg">Նշումներ</th>
                  </tr>
                </thead>
                <tbody>
                  {student.payments.map(pay => (
                    <tr key={pay.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition">
                      <td className="p-3 font-medium">{new Date(pay.payment_date).toLocaleDateString('hy-AM')}</td>
                      <td className="p-3 text-green-600 font-bold">{pay.amount.toLocaleString()} ֏</td>
                      <td className="p-3"><span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">{pay.method}</span></td>
                      <td className="p-3 text-gray-500 text-sm max-w-[200px] truncate" title={pay.notes}>{pay.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
              <CreditCard size={48} className="mb-4 opacity-20" />
              <p>Այս ուսանողը դեռևս վճարումներ չունի</p>
            </div>
          )}
        </div>
      </div>

      {showEditModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-gray-50 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden my-8">
            <div className="flex justify-between items-center p-5 border-b border-gray-200 bg-white sticky top-0 z-10">
              <h2 className="text-xl font-bold text-gray-800">Խմբագրել Ուսանողի Տվյալները</h2>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-black">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div className="space-y-4">
                  <h3 className="font-bold text-brand uppercase text-sm mb-2 border-b border-gray-200 pb-1">Անձնական</h3>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Անուն Ազգանուն</label>
                    <input required type="text" name="full_name" value={formData.full_name || ''} onChange={handleChange} className="glass-input w-full" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Հեռախոսահամար</label>
                    <input required type="text" name="phone" value={formData.phone || ''} onChange={handleChange} className="glass-input w-full" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Էլ. Հասցե</label>
                    <input required type="email" name="email" value={formData.email || ''} onChange={handleChange} className="glass-input w-full" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Կարգավիճակ</label>
                    <select name="status" value={formData.status || ''} onChange={handleChange} className="glass-input w-full">
                      <option>Նոր հայտ / Կապ հաստատված</option>
                      <option>Պոտենցիալ Ուսանող</option>
                      <option>Սովորող</option>
                      <option>Ավարտած</option>
                      <option>Հեռացված</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-bold text-brand uppercase text-sm mb-2 border-b border-gray-200 pb-1">Ուսումնական & Ֆինանսական</h3>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Ուղղություն</label>
                    <select name="course_direction" value={formData.course_direction || ''} onChange={handleChange} className="glass-input w-full">
                      <option>Ֆինանսական հաշվառում</option>
                      <option>Հարկային հաշվառում</option>
                      <option>1C ՀԾ ծրագրեր</option>
                      <option>Գլխավոր հաշվապահի դասընթաց</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Ամսավճար</label>
                    <input required type="number" name="monthly_fee" value={formData.monthly_fee || 0} onChange={handleChange} className="glass-input w-full" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Զեղչ (%)</label>
                    <input type="number" name="discount_percent" value={formData.discount_percent || 0} onChange={handleChange} className="glass-input w-full" />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-gray-200">
                <button type="button" onClick={() => setShowEditModal(false)} className="px-6 py-2.5 border border-gray-300 rounded-md text-gray-700 font-semibold hover:bg-gray-50 transition">
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

export default StudentProfile;
