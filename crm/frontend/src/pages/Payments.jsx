import { useState, useEffect, useRef } from 'react';
import api from '../api';
import { Plus, X, Search, User } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const Payments = () => {
  const { addToast } = useToast();
  const [payments, setPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    student_id: '',
    amount: '',
    method: 'Կանխիկ',
    notes: ''
  });

  const [studentSearch, setStudentSearch] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredStudents = students.filter(s => {
    if (!studentSearch.trim()) return true;
    const q = studentSearch.toLowerCase().trim();
    return (
      (s.full_name && s.full_name.toLowerCase().includes(q)) ||
      (s.phone && s.phone.toLowerCase().includes(q)) ||
      (s.email && s.email.toLowerCase().includes(q))
    );
  });

  const selectedStudent = students.find(s => s.id === parseInt(formData.student_id));

  const fetchData = async () => {
    try {
      const [pRes, sRes] = await Promise.all([
        api.get('/payments'),
        api.get('/students?limit=1000')
      ]);
      setPayments(pRes.data);
      setStudents(sRes.data.items || []);
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
    if (!formData.student_id) {
      addToast('Խնդրում ենք ընտրել ուսանողին', 'error');
      return;
    }
    try {
      await api.post('/payments', {
        ...formData,
        student_id: parseInt(formData.student_id),
        amount: parseInt(formData.amount)
      });
      setShowModal(false);
      setFormData({
        student_id: '',
        amount: '',
        method: 'Կանխիկ',
        notes: ''
      });
      setStudentSearch('');
      fetchData();
      addToast('Վճարումը հաջողությամբ գրանցվեց', 'success');
    } catch (error) {
      console.error('Error adding payment:', error);
      addToast('Սխալ վճարումը ավելացնելիս', 'error');
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Վճարումներ</h1>
          <p className="text-gray-500">Ուսանողների վճարումների պատմություն</p>
        </div>
        <button onClick={() => setShowModal(true)} className="glass-button flex items-center gap-2">
          <Plus size={18} /> Ավելացնել Վճարում
        </button>
      </div>

      <div className="glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-gray-800">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="p-4 font-bold text-gray-600">ID</th>
                <th className="p-4 font-bold text-gray-600">Ուսանող</th>
                <th className="p-4 font-bold text-gray-600">Գումար</th>
                <th className="p-4 font-bold text-gray-600">Եղանակ</th>
                <th className="p-4 font-bold text-gray-600">Ամսաթիվ</th>
                <th className="p-4 font-bold text-gray-600">Նշումներ</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((pay) => {
                const st = students.find(s => s.id === pay.student_id);
                return (
                  <tr key={pay.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                    <td className="p-4 font-mono text-gray-400">#{pay.id}</td>
                    <td className="p-4 font-semibold">{st ? st.full_name : `Student ID: ${pay.student_id}`}</td>
                    <td className="p-4 text-green-600 font-bold">{pay.amount.toLocaleString()} ֏</td>
                    <td className="p-4">
                      <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm">{pay.method}</span>
                    </td>
                    <td className="p-4 text-gray-600">{new Date(pay.payment_date).toLocaleDateString('hy-AM')}</td>
                    <td className="p-4 text-gray-500 text-sm">{pay.notes}</td>
                  </tr>
                );
              })}
              {payments.length === 0 && (
                <tr><td colSpan="6" className="p-12 text-center text-gray-400">Վճարումներ չեն գտնվել</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-5 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-800">Նոր Վճարում</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-black">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div ref={dropdownRef} className="relative">
                <label className="block text-sm font-bold text-gray-700 mb-2">Ուսանող *</label>
                
                {selectedStudent ? (
                  <div className="flex items-center justify-between p-3 bg-brand/10 border border-brand/30 rounded-lg">
                    <div className="flex items-center gap-2">
                      <User size={18} className="text-brand" />
                      <div>
                        <p className="font-bold text-gray-800 text-sm flex items-center gap-2">
                          <span>{selectedStudent.full_name}</span>
                          {selectedStudent.balance !== undefined && (
                            <span className={`text-[11px] px-1.5 py-0.5 rounded font-bold ${selectedStudent.balance > 0 ? 'text-emerald-700 bg-emerald-100' : 'text-red-600 bg-red-100'}`}>
                              Բալանս՝ {selectedStudent.balance > 0 ? `+${selectedStudent.balance.toLocaleString()} ֏` : `${selectedStudent.balance.toLocaleString()} ֏`}
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500">
                          {selectedStudent.phone || 'Հեռախոս չկա'} {selectedStudent.course_direction ? `• ${selectedStudent.course_direction}` : ''}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, student_id: '' });
                        setStudentSearch('');
                        setIsDropdownOpen(true);
                      }}
                      className="text-xs font-semibold text-gray-500 hover:text-black underline px-2 py-1"
                    >
                      Փոխել
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="relative flex items-center">
                      <Search className="absolute left-3 text-gray-400 w-4 h-4 pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Որոնել ուսանողի (անուն, հեռախոս, էլ-փոստ)..."
                        value={studentSearch}
                        onFocus={() => setIsDropdownOpen(true)}
                        onChange={(e) => {
                          setStudentSearch(e.target.value);
                          setIsDropdownOpen(true);
                        }}
                        className="glass-input w-full pl-9 pr-4 py-2.5 text-sm"
                      />
                    </div>

                    {isDropdownOpen && (
                      <div className="absolute z-20 left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-xl divide-y divide-gray-100">
                        {filteredStudents.length === 0 ? (
                          <div className="p-4 text-center text-sm text-gray-400">Ուսանող չի գտնվել</div>
                        ) : (
                          filteredStudents.map(st => (
                            <div
                              key={st.id}
                              onClick={() => {
                                setFormData({ 
                                  ...formData, 
                                  student_id: st.id,
                                  amount: formData.amount || (st.balance < 0 ? Math.abs(st.balance) : st.monthly_fee) || ''
                                });
                                setIsDropdownOpen(false);
                              }}
                              className="p-3 hover:bg-brand/10 cursor-pointer transition flex items-center justify-between"
                            >
                              <div>
                                <p className="font-semibold text-gray-800 text-sm">{st.full_name}</p>
                                <p className="text-xs text-gray-500">
                                  {st.phone || 'Հեռախոս չկա'} {st.course_direction ? `• ${st.course_direction}` : ''}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                {st.balance !== undefined && (
                                  <span className={`text-xs px-2 py-0.5 rounded font-bold ${st.balance > 0 ? 'text-emerald-700 bg-emerald-50' : 'text-red-600 bg-red-50'}`}>
                                    {st.balance > 0 ? `+${st.balance.toLocaleString()} ֏` : `${st.balance.toLocaleString()} ֏`}
                                  </span>
                                )}
                                <span className="text-xs text-brand font-bold bg-brand/10 px-2 py-1 rounded">
                                  Ընտրել
                                </span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Գումար (ՀՀ Դրամ)</label>
                <input required name="amount" value={formData.amount} onChange={handleChange} type="number" min="0" className="glass-input w-full" placeholder="Օր.՝ 95000" />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Վճարման Եղանակ</label>
                <select name="method" value={formData.method} onChange={handleChange} className="glass-input w-full">
                  <option>Կանխիկ</option>
                  <option>Բանկային Փոխանցում</option>
                  <option>Առցանց Փոխանցում</option>
                  <option>Idram / Telcell</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Նշումներ</label>
                <textarea name="notes" value={formData.notes} onChange={handleChange} rows="2" className="glass-input w-full resize-none" placeholder="Լրացուցիչ տեղեկություն..."></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-6">
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

export default Payments;
