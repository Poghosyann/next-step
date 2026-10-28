import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { AlertCircle, Search, DollarSign, Users, Eye, CheckCircle, X, CreditCard, RefreshCw } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const Debts = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [debtors, setDebtors] = useState([]);
  const [totalDebtors, setTotalDebtors] = useState(0);
  const [totalDebtAmount, setTotalDebtAmount] = useState(0);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [courseFilter, setCourseFilter] = useState('all');
  const [coursesList, setCoursesList] = useState([]);

  const defaultDirections = [
    'Ֆինանսական հաշվառում',
    'Հարկային հաշվառում',
    '1C ՀԾ ծրագրեր',
    'Գլխավոր հաշվապահի դասընթաց',
    'Excel'
  ];

  const allDirections = Array.from(new Set([
    ...defaultDirections,
    ...coursesList.map(c => c.title)
  ])).filter(Boolean);

  useEffect(() => {
    api.get('/courses').then(res => setCoursesList(res.data || [])).catch(console.error);
  }, []);

  // Quick Payment Modal state
  const [payingStudent, setPayingStudent] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Կանխիկ');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [submittingPayment, setSubmittingPayment] = useState(false);

  const fetchDebts = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (courseFilter && courseFilter !== 'all') params.course_direction = courseFilter;

      const res = await api.get('/debts', { params });
      setDebtors(res.data.items || []);
      setTotalDebtors(res.data.total_debtors || 0);
      setTotalDebtAmount(res.data.total_debt_amount || 0);
    } catch (err) {
      console.error('Error fetching debts:', err);
      addToast('Սխալ պարտքերի ցանկը բեռնելիս', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, courseFilter, addToast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDebts();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchDebts]);

  const handleQuickPay = (student) => {
    setPayingStudent(student);
    const suggestedAmount = student.balance < 0 ? Math.abs(student.balance) : (student.monthly_fee || 36000);
    setPaymentAmount(suggestedAmount);
    setPaymentMethod('Կանխիկ');
    setPaymentNotes(`Պարտքի մարում (${student.full_name})`);
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!payingStudent || !paymentAmount) return;

    try {
      setSubmittingPayment(true);
      await api.post('/payments', {
        student_id: payingStudent.id,
        amount: parseInt(paymentAmount, 10),
        method: paymentMethod,
        notes: paymentNotes
      });
      addToast(`Վճարումը (${parseInt(paymentAmount, 10).toLocaleString()} ֏) հաջողությամբ գրանցվեց`, 'success');
      setPayingStudent(null);
      fetchDebts();
    } catch (err) {
      console.error('Payment error:', err);
      addToast('Սխալ վճարումը գրանցելիս', 'error');
    } finally {
      setSubmittingPayment(false);
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight flex items-center gap-3">
            <span className="p-2 bg-red-100 text-red-600 rounded-lg">
              <AlertCircle size={28} />
            </span>
            <span>Պարտքերի Կառավարում</span>
          </h1>
          <p className="text-gray-500 mt-1">Ուսանողներ, որոնց բալանսը բացասական է կամ սպառված</p>
        </div>
        <button
          onClick={fetchDebts}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition shadow-sm font-medium"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Թարմացնել
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="glass-panel p-6 border-l-4 border-l-red-500 bg-white">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Ընդհանուր Պարտքի Գումար</p>
              <h3 className="text-3xl font-extrabold text-red-600 mt-2">
                -{totalDebtAmount.toLocaleString()} ֏
              </h3>
            </div>
            <div className="p-4 bg-red-50 text-red-600 rounded-xl">
              <DollarSign size={32} />
            </div>
          </div>
        </div>

        <div className="glass-panel p-6 border-l-4 border-l-brand bg-white">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Պարտապան Ուսանողներ</p>
              <h3 className="text-3xl font-extrabold text-gray-800 mt-2">
                {totalDebtors} <span className="text-base font-normal text-gray-500">ուսանող</span>
              </h3>
            </div>
            <div className="p-4 bg-brand/10 text-brand rounded-xl">
              <Users size={32} />
            </div>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="glass-panel p-4 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between bg-white">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-3 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Որոնել ըստ անվան, հեռախոսի կամ էլ. հասցեի..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="glass-input pl-10 w-full"
          />
        </div>
        <div className="w-full md:w-72">
          <select
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
            className="glass-input w-full"
          >
            <option value="all">Բոլոր ուղղությունները</option>
            {allDirections.map((dir, idx) => (
              <option key={idx} value={dir}>{dir}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Debtors Table */}
      <div className="glass-panel overflow-hidden bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-gray-800">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/60 text-gray-500 text-xs font-semibold uppercase tracking-wider">
                <th className="p-3.5 whitespace-nowrap">Ուսանող</th>
                <th className="p-3.5 whitespace-nowrap">Հեռախոսահամար</th>
                <th className="p-3.5 whitespace-nowrap">Ուղղություն / Խումբ</th>
                <th className="p-3.5 text-center whitespace-nowrap">1 Դասի Արժեք</th>
                <th className="p-3.5 text-center whitespace-nowrap">Արված Դասեր</th>
                <th className="p-3.5 text-right whitespace-nowrap">Վճարված Է</th>
                <th className="p-3.5 text-right whitespace-nowrap">Պարտքի Չափ</th>
                <th className="p-3.5 text-right whitespace-nowrap">Գործողություն</th>
              </tr>
            </thead>
            <tbody>
              {debtors.map((st) => (
                <tr key={st.id} className="border-b border-gray-100 hover:bg-red-50/20 transition">
                  <td className="p-3.5 whitespace-nowrap">
                    <div className="font-bold text-gray-800">{st.full_name}</div>
                    <div className="text-xs text-gray-400">{st.email}</div>
                  </td>
                  <td className="p-3.5 font-medium text-gray-700 whitespace-nowrap">{st.phone}</td>
                  <td className="p-3.5 whitespace-nowrap">
                    <div className="text-brand font-semibold text-sm">{st.course_direction}</div>
                    {st.group_names && st.group_names.length > 0 ? (
                      <div className="text-xs text-gray-500 mt-0.5">
                        {st.group_names.join(', ')}
                      </div>
                    ) : (
                      <div className="text-xs text-gray-400 italic">Խմբին կցված չէ</div>
                    )}
                  </td>
                  <td className="p-3.5 text-center text-sm font-medium text-gray-600 whitespace-nowrap">
                    {(st.lesson_cost || 0).toLocaleString()} ֏
                  </td>
                  <td className="p-3.5 text-center whitespace-nowrap">
                    <span className="inline-block bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs font-semibold">
                      {st.total_lessons_attended || 0} դաս
                    </span>
                  </td>
                  <td className="p-3.5 text-right font-medium text-gray-700 whitespace-nowrap">
                    {(st.total_paid || 0).toLocaleString()} ֏
                  </td>
                  <td className="p-3.5 text-right whitespace-nowrap">
                    <span className="inline-block bg-red-100 text-red-700 border border-red-200 px-2.5 py-1 rounded-md font-bold text-sm">
                      {st.balance?.toLocaleString()} ֏
                    </span>
                  </td>
                  <td className="p-3.5 text-right whitespace-nowrap">
                    <div className="flex justify-end items-center gap-2">
                      <button
                        onClick={() => handleQuickPay(st)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition shadow-sm"
                        title="Մուտքագրել վճարում"
                      >
                        <CreditCard size={14} />
                        Վճարել
                      </button>
                      <button
                        onClick={() => navigate(`/students/${st.id}`)}
                        className="p-1.5 text-gray-400 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition"
                        title="Դիտել պրոֆիլը"
                      >
                        <Eye size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {debtors.length === 0 && !loading && (
                <tr>
                  <td colSpan="8" className="p-16 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      <CheckCircle size={48} className="text-emerald-500 mb-3" />
                      <h4 className="text-lg font-bold text-gray-700">Պարտք ունեցող ուսանողներ չկան</h4>
                      <p className="text-sm text-gray-500 mt-1">Բոլոր ուսանողների բալանսը դրական է կամ հաշվեկշիռը զրոյացված է:</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Payment Modal */}
      {payingStudent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50">
              <div>
                <h3 className="text-lg font-bold text-gray-800">Մուտքագրել Վճարում</h3>
                <p className="text-xs text-gray-500">{payingStudent.full_name} ({payingStudent.course_direction})</p>
              </div>
              <button
                onClick={() => setPayingStudent(null)}
                className="text-gray-400 hover:text-gray-700 transition"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handlePaymentSubmit} className="p-6 space-y-4">
              <div className="bg-red-50 border border-red-100 rounded-lg p-3 text-sm flex justify-between items-center">
                <span className="text-red-700 font-medium">Ընթացիկ պարտք:</span>
                <span className="font-extrabold text-red-600">{payingStudent.balance?.toLocaleString()} ֏</span>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Վճարվող Գումար (AMD) *</label>
                <input
                  required
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="glass-input w-full font-bold text-lg text-emerald-700"
                  placeholder="36000"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Վճարման Եղանակ</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="glass-input w-full"
                >
                  <option value="Կանխիկ">Կանխիկ</option>
                  <option value="Փոխանցում">Բանկային փոխանցում</option>
                  <option value="Քարտ">Քարտային վճարում (POS)</option>
                  <option value="Idram">Idram / Telcell</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Նշումներ</label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="glass-input w-full"
                  placeholder="Լրացուցիչ նշում..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setPayingStudent(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                >
                  Չեղարկել
                </button>
                <button
                  type="submit"
                  disabled={submittingPayment}
                  className="glass-button px-6"
                >
                  {submittingPayment ? 'Գրանցվում է...' : 'Հաստատել Վճարումը'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Debts;
