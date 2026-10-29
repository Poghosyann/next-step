import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { Plus, X, Search, Filter, Download, Edit2, Check, Flame } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import { useToast } from '../context/ToastContext';

const Students = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [students, setStudents] = useState([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDirection, setFilterDirection] = useState('');
  const [coursesList, setCoursesList] = useState([]);
  const [editingStudentId, setEditingStudentId] = useState(null);
  const [editingLessonsVal, setEditingLessonsVal] = useState(0);
  const [editingUrgentId, setEditingUrgentId] = useState(null);
  const [editingUrgentVal, setEditingUrgentVal] = useState('');
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
  }, []);

  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      const skip = (page - 1) * limit;
      const params = { skip, limit };
      if (searchQuery && searchQuery.trim()) params.search = searchQuery.trim();
      if (filterStatus && filterStatus.trim()) params.status = filterStatus.trim();
      if (filterDirection && filterDirection.trim()) params.course_direction = filterDirection.trim();

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
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery, filterStatus, filterDirection]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

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

  const handleSaveUrgentNote = async (e, studentId) => {
    e.stopPropagation();
    try {
      const res = await api.put(`/students/${studentId}`, {
        urgent_notes: editingUrgentVal
      });
      setStudents(prev => prev.map(s => s.id === studentId ? res.data : s));
      setEditingUrgentId(null);
      addToast('Հրատապ նշումը պահպանվեց', 'success');
    } catch (err) {
      console.error(err);
      addToast('Սխալ հրատապ նշումը պահպանելիս', 'error');
    }
  };

  const exportToCSV = () => {
    if (students.length === 0) {
      addToast('Արտահանելու համար տվյալներ չկան', 'error');
      return;
    }
    
    const headers = ['ID', 'Անուն Ազգանուն', 'Հրատապ նշում', 'Ուղղություն', 'Ձևաչափ', 'Հեռախոս', 'Էլ. հասցե', 'Սոց. հղում', 'Նախընտրած գրաֆիկ', 'Նախընտրած ժամ', 'Կարգավիճակ', 'Արված դասեր', 'Ամսավճար', 'Նվեր քարտ (֏)', 'Բալանս', 'Ստեղծման ամսաթիվ'];
    const rows = students.map(st => [
      st.id,
      `"${(st.full_name || '').replace(/"/g, '""')}"`,
      `"${(st.urgent_notes || '').replace(/"/g, '""')}"`,
      `"${(st.course_direction || '').replace(/"/g, '""')}"`,
      `"${(st.course_format || 'Օֆլայն').replace(/"/g, '""')}"`,
      `"${(st.phone || '').replace(/"/g, '""')}"`,
      `"${(st.email || '').replace(/"/g, '""')}"`,
      `"${(st.social_link || '').replace(/"/g, '""')}"`,
      `"${(st.preferred_schedule || '').replace(/"/g, '""')}"`,
      `"${(st.preferred_time || '').replace(/"/g, '""')}"`,
      `"${(st.status || '').replace(/"/g, '""')}"`,
      st.total_lessons_attended || 0,
      st.monthly_fee || 0,
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
          <button onClick={() => navigate('/students/new')} className="glass-button flex items-center gap-2">
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
          {(searchQuery || filterStatus || filterDirection) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterStatus('');
                setFilterDirection('');
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
                <th className="p-3.5 whitespace-nowrap">Ձևաչափ</th>
                <th className="p-3.5 whitespace-nowrap">Հեռախոս</th>
                <th className="p-3.5 whitespace-nowrap">Էլ. հասցե</th>
                <th className="p-3.5 whitespace-nowrap">Կարգավիճակ</th>
                <th className="p-3.5 text-center whitespace-nowrap">Արված դասեր</th>
                <th className="p-3.5 text-right whitespace-nowrap">Բալանս</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, idx) => (
                  <tr key={idx} className="border-b border-gray-100 animate-pulse">
                    <td className="p-3.5"><div className="h-4 w-36 bg-gray-200 rounded" /></td>
                    <td className="p-3.5"><div className="h-4 w-40 bg-gray-200 rounded" /></td>
                    <td className="p-3.5"><div className="h-5 w-20 bg-gray-200 rounded-full" /></td>
                    <td className="p-3.5"><div className="h-4 w-28 bg-gray-200 rounded" /></td>
                    <td className="p-3.5"><div className="h-4 w-36 bg-gray-200 rounded" /></td>
                    <td className="p-3.5"><div className="h-5 w-24 bg-gray-200 rounded-full" /></td>
                    <td className="p-3.5 text-center"><div className="h-5 w-14 bg-gray-200 rounded mx-auto" /></td>
                    <td className="p-3.5 text-right"><div className="h-5 w-20 bg-gray-200 rounded ml-auto" /></td>
                  </tr>
                ))
              ) : (
                students.map((st) => {
                  const hasUrgent = Boolean(st.urgent_notes && st.urgent_notes.trim());
                  const isEditingUrgent = editingUrgentId === st.id;

                  return (
                    <tr 
                      key={st.id} 
                      onClick={() => navigate(`/students/${st.id}`)}
                      className="border-b border-gray-100 hover:bg-gray-50 transition cursor-pointer group relative"
                    >
                      <td className={`px-3.5 ${hasUrgent || isEditingUrgent ? 'pt-7 pb-3' : 'py-3.5'} relative font-semibold text-gray-800 whitespace-nowrap`}>
                        {/* Position Absolute Urgent Note Badge on the row */}
                        <div
                          className="absolute top-1 left-3.5 z-10 flex items-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {isEditingUrgent ? (
                            <div className="inline-flex items-center gap-1 bg-white shadow-md border border-amber-300 rounded-md px-1.5 py-0.5">
                              <input
                                type="text"
                                value={editingUrgentVal}
                                onChange={(e) => setEditingUrgentVal(e.target.value)}
                                placeholder="Օր.՝ Follow Up tomorrow"
                                className="w-40 px-1.5 py-0.5 text-[11px] bg-white text-gray-800 font-medium focus:outline-none"
                                autoFocus
                              />
                              <button
                                type="button"
                                onClick={(e) => handleSaveUrgentNote(e, st.id)}
                                className="p-0.5 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition"
                                title="Պահպանել"
                              >
                                <Check size={11} />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setEditingUrgentId(null); }}
                                className="p-0.5 bg-gray-200 text-gray-600 rounded hover:bg-gray-300 transition"
                                title="Չեղարկել"
                              >
                                <X size={11} />
                              </button>
                            </div>
                          ) : hasUrgent ? (
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingUrgentId(st.id);
                                setEditingUrgentVal(st.urgent_notes || '');
                              }}
                              title="Սեղմեք՝ հրատապ նշումը խմբագրելու համար"
                              className="inline-flex items-center gap-1 text-[10px] leading-tight font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs hover:bg-amber-200/80 transition"
                            >
                              <Flame size={11} className="text-orange-600 shrink-0" />
                              <span>{st.urgent_notes}</span>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingUrgentId(st.id);
                                setEditingUrgentVal('');
                              }}
                              className="opacity-0 group-hover:opacity-100 inline-flex items-center gap-0.5 text-[10px] font-medium text-amber-700 bg-amber-50/90 hover:bg-amber-100 border border-amber-200 px-1.5 py-0.2 rounded-full transition"
                              title="Ավելացնել հրատապ նշում"
                            >
                              <Flame size={10} className="text-orange-500" /> + Հրատապ
                            </button>
                          )}
                        </div>

                        <div>{st.full_name}</div>
                        {(st.preferred_schedule || st.preferred_time) && (
                          <div className="text-[11px] font-normal text-gray-400 mt-0.5">
                            {[st.preferred_schedule, st.preferred_time].filter(Boolean).join(' • ')}
                          </div>
                        )}
                      </td>
                      <td className="p-3.5 text-brand font-semibold whitespace-nowrap">{st.course_direction}</td>
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
                  );
                })
              )}
              {!loading && students.length === 0 && (
                <tr><td colSpan="8" className="p-12 text-center text-gray-400">Ուսանողներ չեն գտնվել</td></tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination UI */}
        <div className="p-4 border-t border-gray-100 flex justify-between items-center text-gray-600 bg-gray-50">
          <div>
            {loading ? (
              <div className="h-5 w-36 bg-gray-200 rounded animate-pulse" />
            ) : (
              <>Ընդհանուր <span className="font-bold text-gray-800">{totalStudents.toLocaleString()}</span> ուսանող</>
            )}
          </div>
          <div className="flex gap-2">
            <button 
              disabled={loading || page === 1} 
              onClick={() => setPage(p => p - 1)}
              className="px-4 py-2 border border-gray-200 rounded-md hover:bg-white disabled:opacity-50 transition"
            >
              Նախորդ
            </button>
            <span className="px-4 py-2 text-gray-800 font-medium">
              {loading ? '...' : `Էջ ${page} / ${Math.ceil(totalStudents / limit) || 1}`}
            </span>
            <button 
              disabled={loading || page >= Math.ceil(totalStudents / limit)}
              onClick={() => setPage(p => p + 1)}
              className="px-4 py-2 border border-gray-200 rounded-md hover:bg-white disabled:opacity-50 transition"
            >
              Հաջորդ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Students;
