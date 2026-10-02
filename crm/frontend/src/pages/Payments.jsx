import React, { useState, useEffect } from 'react';
import api from '../api';
import { CreditCard, Plus, X } from 'lucide-react';

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    student_id: '',
    amount: '',
    method: 'Ô¿Õ¡Õ¶Õ­Õ«Õ¯',
    notes: ''
  });

  const fetchData = async () => {
    try {
      const [pRes, sRes] = await Promise.all([
        api.get('/payments'),
        api.get('/students')
      ]);
      setPayments(pRes.data);
      setStudents(sRes.data);
    } catch (error) {
      console.error('Error fetching payments:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/payments', {
        ...formData,
        student_id: parseInt(formData.student_id),
        amount: parseInt(formData.amount)
      });
      setShowModal(false);
      fetchData();
    } catch (error) {
      console.error('Error adding payment:', error);
      alert('Error adding payment');
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">ÕŽÕ³Õ¡Ö€Õ¸Ö‚Õ´Õ¶Õ¥Ö€</h1>
          <p className="text-gray-500">ÕˆÖ‚Õ½Õ¡Õ¶Õ¸Õ²Õ¶Õ¥Ö€Õ« Õ¾Õ³Õ¡Ö€Õ¸Ö‚Õ´Õ¶Õ¥Ö€Õ« ÕºÕ¡Õ¿Õ´Õ¸Ö‚Õ©ÕµÕ¸Ö‚Õ¶</p>
        </div>
        <button onClick={() => setShowModal(true)} className="glass-button flex items-center gap-2">
          <Plus size={18} /> Ô±Õ¾Õ¥Õ¬Õ¡ÖÕ¶Õ¥Õ¬ Õ¾Õ³Õ¡Ö€Õ¸Ö‚Õ´
        </button>
      </div>

      <div className="glass-panel overflow-hidden">
        <div className="p-4 border-b border-gray-200 overflow-x-auto">
          <table className="w-full text-left text-gray-800">
            <thead>
              <tr className="border-b border-gray-200 text-gray-600">
                <th className="p-3">ID</th>
                <th className="p-3">ÕˆÖ‚Õ½Õ¡Õ¶Õ¸Õ²</th>
                <th className="p-3">Ô³Õ¸Ö‚Õ´Õ¡Ö€</th>
                <th className="p-3">ÔµÕ²Õ¡Õ¶Õ¡Õ¯</th>
                <th className="p-3">Ô±Õ´Õ½Õ¡Õ©Õ«Õ¾</th>
                <th className="p-3">Õ†Õ·Õ¸Ö‚Õ´Õ¶Õ¥Ö€</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((pay) => {
                const st = students.find(s => s.id === pay.student_id);
                return (
                  <tr key={pay.id} className="border-b border-white/5 hover:bg-gray-50 transition">
                    <td className="p-3 font-mono text-gray-400">#{pay.id}</td>
                    <td className="p-3 font-semibold">{st ? st.full_name : `Student ID: ${pay.student_id}`}</td>
                    <td className="p-3 text-green-400 font-bold">{pay.amount.toLocaleString()} Ö</td>
                    <td className="p-3">{pay.method}</td>
                    <td className="p-3">{new Date(pay.payment_date).toLocaleDateString('hy-AM')}</td>
                    <td className="p-3 text-gray-500 text-sm">{pay.notes}</td>
                  </tr>
                );
              })}
              {payments.length === 0 && (
                <tr><td colSpan="6" className="p-6 text-center text-gray-400">ÕŽÕ³Õ¡Ö€Õ¸Ö‚Õ´Õ¶Õ¥Ö€ Õ¹Õ¯Õ¡Õ¶</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-5 border-b">
              <h2 className="text-xl font-bold text-gray-800">Õ†Õ¸Ö€ Õ¾Õ³Õ¡Ö€Õ¸Ö‚Õ´</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-black">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">ÕˆÖ‚Õ½Õ¡Õ¶Õ¸Õ²</label>
                <select required name="student_id" value={formData.student_id} onChange={handleChange} className="w-full border border-gray-300 rounded-md p-2.5 text-gray-700 focus:border-brand outline-none">
                  <option value="">Ô¸Õ¶Õ¿Ö€Õ¥Õ¬ Õ¸Ö‚Õ½Õ¡Õ¶Õ¸Õ²</option>
                  {students.map(st => (
                    <option key={st.id} value={st.id}>{st.full_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Ô³Õ¸Ö‚Õ´Õ¡Ö€ (AMD)</label>
                <input required name="amount" value={formData.amount} onChange={handleChange} type="number" min="0" className="w-full border border-gray-300 rounded-md p-2.5 text-gray-700 focus:border-brand outline-none" placeholder="Õ•Ö€.Õ 95000" />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">ÕŽÕ³Õ¡Ö€Õ´Õ¡Õ¶ Õ¥Õ²Õ¡Õ¶Õ¡Õ¯</label>
                <select name="method" value={formData.method} onChange={handleChange} className="w-full border border-gray-300 rounded-md p-2.5 text-gray-700 focus:border-brand outline-none">
                  <option>Ô¿Õ¡Õ¶Õ­Õ«Õ¯</option>
                  <option>Õ”Õ¡Ö€Õ¿Õ¡ÕµÕ«Õ¶ ÖƒÕ¸Õ­Õ¡Õ¶ÖÕ¸Ö‚Õ´</option>
                  <option>Ô²Õ¡Õ¶Õ¯Õ¡ÕµÕ«Õ¶ ÖƒÕ¸Õ­Õ¡Õ¶ÖÕ¸Ö‚Õ´</option>
                  <option>Idram / Telcell</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Õ†Õ·Õ¸Ö‚Õ´Õ¶Õ¥Ö€</label>
                <textarea name="notes" value={formData.notes} onChange={handleChange} rows="2" className="w-full border border-gray-300 rounded-md p-2.5 text-gray-700 focus:border-brand outline-none resize-y" placeholder="Ô¼Ö€Õ¡ÖÕ¸Ö‚ÖÕ«Õ¹ Õ¿Õ¾ÕµÕ¡Õ¬Õ¶Õ¥Ö€"></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2.5 border border-gray-300 rounded-md text-gray-700 font-semibold hover:bg-gray-50 transition">
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

export default Payments;



