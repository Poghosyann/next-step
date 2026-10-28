import { useState, useEffect, useRef } from 'react';
import api from '../api';
import { Plus, X, Search, User, Edit2, Trash2, Download, Filter, Calendar, Wallet } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const Payments = () => {
  const { addToast } = useToast();
  const [payments, setPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingPaymentId, setEditingPaymentId] = useState(null);
  const [formData, setFormData] = useState({
    student_id: '',
    amount: '',
    method: 'Կանխիկ',
    notes: ''
  });

  // Table Filters & Pagination
  const [tableSearch, setTableSearch] = useState('');
  const [filterMethod, setFilterMethod] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [page, setPage] = useState(1);
  const limit = 20;

  // Modal Student Dropdown
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
      setPayments(pRes.data || []);
      setStudents(sRes.data.items || []);
    } catch (error) {
      console.error('Error fetching payments:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    setEditingPaymentId(null);
    setFormData({
      student_id: '',
      amount: '',
      method: 'Կանխիկ',
      notes: ''
    });
    setStudentSearch('');
    setShowModal(true);
  };

  const openEditModal = (pay) => {
    setEditingPaymentId(pay.id);
    setFormData({
      student_id: pay.student_id,
      amount: pay.amount,
      method: pay.method || 'Կանխիկ',
      notes: pay.notes || ''
    });
    setStudentSearch('');
    setShowModal(true);
  };

  const handleDelete = async (paymentId) => {
    if (window.confirm('Համոզվա՞ծ եք, որ ցանկանում եք ջնջել այս վճարումը։ Ուսանողի բալանսը ավտոմատ կվերահաշվարկվի։')) {
      try {
        await api.delete(`/payments/${paymentId}`);
        fetchData();
        addToast('Վճարումը հաջողությամբ ջնջվեց', 'success');
      } catch (err) {
        console.error('Error deleting payment:', err);
        addToast('Սխալ վճարումը ջնջելիս', 'error');
      }
    }
  };

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
      const payload = {
        ...formData,
        student_id: parseInt(formData.student_id),
        amount: parseInt(formData.amount) || 0
      };
      if (editingPaymentId) {
        await api.put(`/payments/${editingPaymentId}`, payload);
        addToast('Վճարումը հաջողությամբ թարմացվեց', 'success');
      } else {
        await api.post('/payments', payload);
        addToast('Վճարումը հաջողությամբ գրանցվեց', 'success');
      }
      setShowModal(false);
      setEditingPaymentId(null);
      setFormData({
        student_id: '',
        amount: '',
        method: 'Կանխիկ',
        notes: ''
      });
      setStudentSearch('');
      fetchData();
    } catch (error) {
      console.error('Error saving payment:', error);
      addToast('Սխալ վճարումը պահպանելիս', 'error');
    }
  };

  const filteredPayments = payments.filter((pay) => {
    const st = students.find(s => s.id === pay.student_id);
    const stName = st ? st.full_name.toLowerCase() : '';
    const stPhone = st && st.phone ? st.phone.toLowerCase() : '';
    const notesStr = (pay.notes || '').toLowerCase();

    if (tableSearch.trim()) {
      const q = tableSearch.toLowerCase().trim();
      const matchesSearch =
        stName.includes(q) ||
        stPhone.includes(q) ||
        notesStr.includes(q) ||
        String(pay.id).includes(q);
      if (!matchesSearch) return false;
    }

    if (filterMethod && pay.method !== filterMethod) {
      return false;
    }

    if (filterMonth && pay.payment_date) {
      const payYearMonth = String(pay.payment_date).slice(0, 7);
      if (payYearMonth !== filterMonth) return false;
    }

    return true;
  });

  const totalPayments = filteredPayments.length;
  const totalPages = Math.ceil(totalPayments / limit) || 1;
  const currentPage = Math.min(page, totalPages);
  const paginatedPayments = filteredPayments.slice((currentPage - 1) * limit, currentPage * limit);
  const totalFilteredAmount = filteredPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

  const exportToCSV = () => {
    if (filteredPayments.length === 0) {
      addToast('Արտահանելու համար վճարումներ չկան', 'error');
      return;
    }

    const headers = ['ID', 'Ուսանող', 'Գումար (֏)', 'Վճարման Եղանակ', 'Ամսաթիվ', 'Նշումներ'];
    const rows = filteredPayments.map(pay => {
      const st = students.find(s => s.id === pay.student_id);
      const stLabel = st ? st.full_name : `Student ID: ${pay.student_id}`;
      return [
        pay.id,
        `"${(stLabel || '').replace(/"/g, '""')}"`,
        pay.amount || 0,
        `"${(pay.method || '').replace(/"/g, '""')}"`,
        pay.payment_date ? new Date(pay.payment_date).toLocaleDateString('hy-AM') : '',
        `"${(pay.notes || '').replace(/"/g, '""')}"`
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `payments_${filterMonth || new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Excel (CSV) ֆայլը հաջողությամբ ներբեռնվեց', 'success');
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Վճարումներ</h1>
          <p className="text-gray-500">Ուսանողների վճարումների պատմություն և ֆինանսական վերահսկում</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={exportToCSV}
            className="px-4 py-2.5 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-semibold transition flex items-center gap-2 shadow-sm"
          >
            <Download size={16} /> Արտահանել Excel
          </button>
          <button onClick={openCreateModal} className="glass-button flex items-center gap-2">
            <Plus size={18} /> Ավելացնել Վճարում
          </button>
        </div>
      </div>

      {/* Filters & Total Summary Bar */}
      <div className="glass-panel p-4 mb-6 flex flex-col lg:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto flex-1 items-center flex-wrap">
          <div className="relative flex-1 w-full min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
            <input
              type="text"
              placeholder="Որոնել ըստ ուսանողի անվան, հեռախոսի կամ նշումի..."
              value={tableSearch}
              onChange={(e) => { setTableSearch(e.target.value); setPage(1); }}
              className="glass-input w-full pl-9 py-2 text-sm"
            />
          </div>

          <div className="relative w-full sm:w-auto">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
            <select
              value={filterMethod}
              onChange={(e) => { setFilterMethod(e.target.value); setPage(1); }}
              className="glass-input pl-9 py-2 text-sm appearance-none w-full sm:w-48"
            >
              <option value="">Բոլոր եղանակները</option>
              <option value="Կանխիկ">Կանխիկ</option>
              <option value="Բանկային Փոխանցում">Բանկային Փոխանցում</option>
              <option value="Առցանց Փոխանցում">Առցանց Փոխանցում</option>
              <option value="Idram / Telcell">Idram / Telcell</option>
            </select>
          </div>

          <div className="relative w-full sm:w-auto flex items-center gap-2">
            <div className="relative w-full sm:w-auto">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
              <input
                type="month"
                value={filterMonth}
                onChange={(e) => { setFilterMonth(e.target.value); setPage(1); }}
                className="glass-input pl-9 py-2 text-sm w-full sm:w-44"
                title="Ֆիլտրել ըստ ամսվա"
              />
            </div>
            {(tableSearch || filterMethod || filterMonth) && (
              <button
                type="button"
                onClick={() => {
                  setTableSearch('');
                  setFilterMethod('');
                  setFilterMonth('');
                  setPage(1);
                }}
                className="text-xs font-semibold text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-lg transition whitespace-nowrap"
              >
                Մաքրել
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto justify-end border-t lg:border-t-0 pt-3 lg:pt-0 border-gray-100">
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-xl">
            <Wallet size={18} className="text-emerald-600" />
            <div>
              <span className="text-[11px] text-emerald-700 block font-medium">
                Ընդհանուր ({filteredPayments.length} վճարում)
              </span>
              <span className="text-base font-extrabold text-emerald-700">
                {totalFilteredAmount.toLocaleString()} ֏
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-gray-800">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/60 text-gray-500 text-xs font-semibold uppercase tracking-wider">
                <th className="p-3.5 whitespace-nowrap">ID</th>
                <th className="p-3.5 whitespace-nowrap">Ուսանող</th>
                <th className="p-3.5 whitespace-nowrap">Գումար</th>
                <th className="p-3.5 whitespace-nowrap">Եղանակ</th>
                <th className="p-3.5 whitespace-nowrap">Ամսաթիվ</th>
                <th className="p-3.5 whitespace-nowrap">Նշումներ</th>
                <th className="p-3.5 text-right whitespace-nowrap">Գործողություն</th>
              </tr>
            </thead>
            <tbody>
              {paginatedPayments.map((pay) => {
                const st = students.find(s => s.id === pay.student_id);
                return (
                  <tr key={pay.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                    <td className="p-3.5 font-mono text-gray-400 whitespace-nowrap">#{pay.id}</td>
                    <td className="p-3.5 font-semibold whitespace-nowrap">{st ? st.full_name : `Student ID: ${pay.student_id}`}</td>
                    <td className="p-3.5 text-emerald-600 font-bold whitespace-nowrap">{pay.amount.toLocaleString()} ֏</td>
                    <td className="p-3.5 whitespace-nowrap">
                      <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm">{pay.method}</span>
                    </td>
                    <td className="p-3.5 text-gray-600 whitespace-nowrap">{new Date(pay.payment_date).toLocaleDateString('hy-AM')}</td>
                    <td className="p-3.5 text-gray-500 text-sm whitespace-nowrap">{pay.notes || '-'}</td>
                    <td className="p-3.5 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditModal(pay)}
                          className="p-1.5 text-gray-500 hover:text-brand hover:bg-brand/10 rounded-lg transition"
                          title="Խմբագրել վճարումը"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(pay.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Ջնջել վճարումը"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredPayments.length === 0 && (
                <tr><td colSpan="7" className="p-12 text-center text-gray-400">Վճարումներ չեն գտնվել</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination UI */}
        <div className="p-4 border-t border-gray-100 flex justify-between items-center text-gray-600 bg-gray-50">
          <div>
            Ընդհանուր <span className="font-bold text-gray-800">{totalPayments.toLocaleString()}</span> վճարում
          </div>
          <div className="flex gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setPage(Math.max(1, currentPage - 1))}
              className="px-4 py-2 border border-gray-200 rounded-md hover:bg-white disabled:opacity-50 transition"
            >
              Նախորդ
            </button>
            <span className="px-4 py-2 text-gray-800 font-medium">
              Էջ {currentPage} / {totalPages}
            </span>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
              className="px-4 py-2 border border-gray-200 rounded-md hover:bg-white disabled:opacity-50 transition"
            >
              Հաջորդ
            </button>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-5 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-800">
                {editingPaymentId ? 'Խմբագրել Վճարումը' : 'Նոր Վճարում'}
              </h2>
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
                  {editingPaymentId ? 'Թարմացնել' : 'Պահպանել'}
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
