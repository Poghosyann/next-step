import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { Plus, X, Search, Filter, Download, Edit2, Check, Users2 } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import { useToast } from '../context/ToastContext';

const Students = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [students, setStudents] = useState([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDirection, setFilterDirection] = useState('');
  const [filterGroup, setFilterGroup] = useState('');
  const [coursesList, setCoursesList] = useState([]);
  const [groupsList, setGroupsList] = useState([]);
  const [editingStudentId, setEditingStudentId] = useState(null);
  const [editingLessonsVal, setEditingLessonsVal] = useState(0);
  const limit = 20;

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
    api.get('/groups').then(res => setGroupsList(res.data || [])).catch(console.error);
  }, []);

  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '', course_direction: 'Ֆինանսական հաշվառում', course_format: 'Օֆլայն', 
    location: '', status: 'Նոր', phone: '', email: '', 
    monthly_fee: 95000, discount_percent: 0, gift_card: 0, source: 'Instagram', 
    comment: '', urgent_notes: ''
  });

  const fetchStudents = useCallback(async () => {
    try {
      const skip = (page - 1) * limit;
      const params = { skip, limit };
      if (searchQuery && searchQuery.trim()) params.search = searchQuery.trim();
      if (filterStatus && filterStatus.trim()) params.status = filterStatus.trim();
      if (filterDirection && filterDirection.trim()) params.course_direction = filterDirection.trim();
      if (filterGroup && filterGroup.trim()) params.group_id = filterGroup.trim();

      const response = await api.get('/students', { params });
      if (Array.isArray(response.data)) {
        setStudents(response.data);
        setTotalStudents(response.data.length);
      } else if (response.data && Array.isArray(response.data.items)) {
        setStudents(response.data.items);
        setTotalStudents(response.data.total ?? response.data.items.length);
      } else {
        setStudents([]);
        setTotalStudents(0);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      setStudents([]);
      setTotalStudents(0);
    }
  }, [page, searchQuery, filterStatus, filterDirection, filterGroup]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/students', formData);
      setShowModal(false);
      fetchStudents();
      addToast('Ուսանողը հաջողությամբ ավելացվեց', 'success');
    } catch (error) {
      console.error('Error creating student:', error);
      addToast('Սխալ առաջացավ ուսանողին պահպանելիս', 'error');
    }
  };

  const handleSaveStudentLessons = async (e, studentId) => {
    e.stopPropagation();
    try {
      const res = await api.put(`/students/${studentId}/lessons`, {
        attended_lessons: parseInt(editingLessonsVal, 10) || 0
      });
      setStudents(prev => prev.map(s => s.id === studentId ? res.data : s));
      setEditingStudentId(null);
      addToast('Ուսանողի դասերի քանակը և բալանսը թարմացվեցին', 'success');
    } catch (err) {
      console.error(err);
      addToast('Սխալ դասերի քանակը թարմացնելիս', 'error');
    }
  };

  const exportToCSV = () => {
    if (students.length === 0) {
      addToast('Արտահանելու համար տվյալներ չկան', 'error');
      return;
    }
    
    const headers = ['ID', 'Անուն Ազգանուն', 'Ուղղություն', 'Խումբ', 'Ձևաչափ', 'Հեռախոս', 'Էլ. հասցե', 'Կարգավիճակ', 'Արված դասեր', 'Ամսավճար', 'Զեղչ (%)', 'Նվեր քարտ (֏)', 'Բալանս', 'Ստեղծման ամսաթիվ'];
    const rows = students.map(st => [
      st.id,
      `"${(st.full_name || '').replace(/"/g, '""')}"`,
      `"${(st.course_direction || '').replace(/"/g, '""')}"`,
      `"${(st.group_names && st.group_names.length > 0 ? st.group_names.join(', ') : 'Առանց խմբի').replace(/"/g, '""')}"`,
      `"${(st.course_format || 'Օֆլայն').replace(/"/g, '""')}"`,
      `"${(st.phone || '').replace(/"/g, '""')}"`,
      `"${(st.email || '').replace(/"/g, '""')}"`,
      `"${(st.status || '').replace(/"/g, '""')}"`,
      st.total_lessons_attended || 0,
      st.monthly_fee || 0,
      st.discount_percent || 0,
      st.gift_card || 0,
      st.balance || 0,
      st.created_at ? new Date(st.created_at).toLocaleDateString('hy-AM') : ''
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `students_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Excel (CSV) ֆայլը հաջողությամբ ներբեռնվեց', 'success');
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Ուսանողներ</h1>
          <p className="text-gray-500">Կառավարեք ձեր ուսանողների բազան</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            type="button" 
            onClick={exportToCSV} 
            className="px-4 py-2.5 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-semibold transition flex items-center gap-2 shadow-sm"
          >
            <Download size={16} /> Արտահանել Excel
          </button>
          <button onClick={() => setShowModal(true)} className="glass-button flex items-center gap-2">
            <Plus size={18} /> Ավելացնել
          </button>
        </div>
      </div>

      
      {/* Որոնում և Ֆիլտրեր */}
      <div className="glass-panel p-4 mb-6 flex flex-col md:flex-row gap-4 items-center flex-wrap">
        <div className="relative flex-1 w-full min-w-[240px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
          <input 
            type="text" 
            placeholder="Որոնել անունով, հեռախոսով կամ էլ-փոստով..." 
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            className="glass-input w-full pl-10 py-2"
          />
        </div>
        <div className="flex gap-3 w-full md:w-auto items-center flex-wrap">
          <div className="relative">
            <select 
              value={filterDirection} 
              onChange={(e) => { setFilterDirection(e.target.value); setPage(1); }}
              className="glass-input pl-10 py-2 appearance-none w-full md:w-48"
            >
              <option value="">Բոլոր ուղղությունները</option>
              {allDirections.map((dir, idx) => (
                <option key={idx} value={dir}>{dir}</option>
              ))}
            </select>
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
          </div>
          <div className="relative">
            <select 
              value={filterGroup} 
              onChange={(e) => { setFilterGroup(e.target.value); setPage(1); }}
              className="glass-input pl-10 py-2 appearance-none w-full md:w-48"
            >
              <option value="">Բոլոր խմբերը</option>
              <option value="none">⚠️ Առանց խմբի</option>
              {groupsList.map((grp) => (
                <option key={grp.id} value={String(grp.id)}>{grp.name}</option>
              ))}
            </select>
            <Users2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
          </div>
          <div className="relative">
            <select 
              value={filterStatus} 
              onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
              className="glass-input pl-10 py-2 appearance-none w-full md:w-44"
            >
              <option value="">Բոլոր կարգավիճակները</option>
              <option value="Նոր">Նոր</option>
              <option value="Հաստատված">Հաստատված</option>
              <option value="Ընթացիկ">Ընթացիկ</option>
              <option value="Անորոշ">Անորոշ</option>
              <option value="Արխիվ">Արխիվ</option>
            </select>
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
          </div>
          {(searchQuery || filterStatus || filterDirection || filterGroup) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterStatus('');
                setFilterDirection('');
                setFilterGroup('');
                setPage(1);
              }}
              className="text-sm font-medium text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 transition px-3 py-2 rounded-lg whitespace-nowrap"
            >
              Մաքրել
            </button>
          )}
        </div>
      </div>

      <div className="glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-gray-800">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/60 text-gray-500 text-xs font-semibold uppercase tracking-wider">
                <th className="p-3.5 whitespace-nowrap">Անուն Ազգանուն</th>
                <th className="p-3.5 whitespace-nowrap">Ուղղություն</th>
                <th className="p-3.5 whitespace-nowrap">Խումբ</th>
                <th className="p-3.5 whitespace-nowrap">Ձևաչափ</th>
                <th className="p-3.5 whitespace-nowrap">Հեռախոս</th>
                <th className="p-3.5 whitespace-nowrap">Էլ. հասցե</th>
                <th className="p-3.5 whitespace-nowrap">Կարգավիճակ</th>
                <th className="p-3.5 text-center whitespace-nowrap">Արված դասեր</th>
                <th className="p-3.5 text-right whitespace-nowrap">Բալանս</th>
              </tr>
            </thead>
            <tbody>
              {students.map((st) => (
                <tr 
                  key={st.id} 
                  onClick={() => navigate(`/students/${st.id}`)}
                  className="border-b border-gray-100 hover:bg-gray-50 transition cursor-pointer"
                >
                  <td className="p-3.5 font-semibold text-gray-800 whitespace-nowrap">{st.full_name}</td>
                  <td className="p-3.5 text-brand font-semibold whitespace-nowrap">{st.course_direction}</td>
                  <td className="p-3.5 whitespace-nowrap">
                    {st.group_names && st.group_names.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {st.group_names.map((gName, idx) => (
                          <span key={idx} className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200/70">
                            {gName}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md bg-gray-100 text-gray-500 border border-gray-200">
                        Առանց խմբի
                      </span>
                    )}
                  </td>
                  <td className="p-3.5 whitespace-nowrap">
                    {st.course_format?.toLowerCase().includes('օնլայն') || st.course_format?.toLowerCase().includes('online') ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                        🌐 Օնլայն
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                        🏢 Օֆլայն
                      </span>
                    )}
                  </td>
                  <td className="p-3.5 text-gray-600 whitespace-nowrap">{st.phone}</td>
                  <td className="p-3.5 text-gray-500 whitespace-nowrap">{st.email}</td>
                  <td className="p-3.5 whitespace-nowrap">
                    <StatusBadge status={st.status} />
                  </td>
                  <td className="p-3.5 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    {editingStudentId === st.id ? (
                      <div className="inline-flex items-center gap-1">
                        <input
                          type="number"
                          min="0"
                          value={editingLessonsVal}
                          onChange={(e) => setEditingLessonsVal(e.target.value)}
                          className="w-16 px-2 py-0.5 text-xs border border-brand rounded bg-white text-center font-bold focus:outline-none"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={(e) => handleSaveStudentLessons(e, st.id)}
                          className="p-1 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition"
                          title="Պահպանել"
                        >
                          <Check size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setEditingStudentId(null); }}
                          className="p-1 bg-gray-200 text-gray-600 rounded hover:bg-gray-300 transition"
                          title="Չեղարկել"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 group/les">
                        <span className="inline-block bg-gray-100 text-gray-700 px-2.5 py-0.5 rounded text-xs font-bold border border-gray-200">
                          {st.total_lessons_attended || 0} դաս
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingStudentId(st.id);
                            setEditingLessonsVal(st.total_lessons_attended || 0);
                          }}
                          className="p-1 text-gray-400 hover:text-brand rounded hover:bg-brand/10 transition"
                          title="Խմբագրել ուսանողի դասերի քանակը"
                        >
                          <Edit2 size={13} />
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="p-3.5 text-right font-medium whitespace-nowrap">
                    {st.balance > 0 ? (
                      <span className="inline-block text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold text-xs">
                        +{st.balance?.toLocaleString()} ֏
                      </span>
                    ) : (
                      <span className="inline-block text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200 font-bold text-xs">
                        {st.balance?.toLocaleString()} ֏
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {students.length === 0 && (
                <tr><td colSpan="9" className="p-12 text-center text-gray-400">Ուսանողներ չեն գտնվել</td></tr>
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
                      {allDirections.map((dir, idx) => (
                        <option key={idx} value={dir}>{dir}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Ձևաչափ *</label>
                    <select name="course_format" value={formData.course_format || 'Օֆլայն'} onChange={handleChange} className="glass-input w-full">
                      <option value="Օֆլայն">🏢 Օֆլայն (Դասասենյակում)</option>
                      <option value="Օնլայն">🌐 Օնլայն (Հեռավար)</option>
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
                    <input required type="number" min="0" name="monthly_fee" value={formData.monthly_fee} onChange={handleChange} className="glass-input w-full" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Զեղչ (%)</label>
                    <input type="number" min="0" max="100" name="discount_percent" value={formData.discount_percent} onChange={handleChange} className="glass-input w-full" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Նվեր քարտ / Զեղչ (֏)</label>
                    <input type="number" min="0" name="gift_card" value={formData.gift_card || 0} onChange={handleChange} className="glass-input w-full" />
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
