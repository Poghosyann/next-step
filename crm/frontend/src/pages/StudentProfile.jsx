import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { ArrowLeft, CreditCard, Trash2, Edit2, X, Users2, Check } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import { useToast } from '../context/ToastContext';

const StudentProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [student, setStudent] = useState(null);
  const [coursesList, setCoursesList] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [formData, setFormData] = useState({});
  const [editingOffsetGroupId, setEditingOffsetGroupId] = useState(null);
  const [offsetValue, setOffsetValue] = useState(0);
  const [editingTotalLessons, setEditingTotalLessons] = useState(false);
  const [totalLessonsValue, setTotalLessonsValue] = useState(0);

  const defaultDirections = [
    'Ֆինանսական հաշվառում',
    'Հարկային հաշվառում',
    '1C ՀԾ ծրագրեր',
    'Գլխավոր հաշվապահի դասընթաց',
    'Excel'
  ];

  const allDirections = Array.from(new Set([
    ...defaultDirections,
    ...coursesList.map(c => c.title),
    ...(student?.course_direction ? [student.course_direction] : [])
  ])).filter(Boolean);

  useEffect(() => {
    api.get('/courses').then(res => setCoursesList(res.data || [])).catch(console.error);
  }, []);

  const fetchStudent = useCallback(async () => {
    try {
      const response = await api.get(`/students/${id}`);
      setStudent(response.data);
      setFormData(response.data);
    } catch (error) {
      console.error('Error fetching student details:', error);
    }
  }, [id]);

  useEffect(() => {
    fetchStudent();
  }, [fetchStudent]);

  const handleDelete = async () => {
    if (window.confirm('Համոզվա՞ծ եք, որ ցանկանում եք ջնջել այս ուսանողին: Այս գործողությունը անդառնալի է։')) {
      try {
        await api.delete(`/students/${id}`);
        addToast('Ուսանողը հաջողությամբ ջնջվեց', 'success');
        navigate('/students');
      } catch (err) {
        console.error(err);
        addToast('Սխալ ջնջելիս', 'error');
      }
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/students/${id}`, formData);
      setShowEditModal(false);
      fetchStudent();
      addToast('Տվյալները հաջողությամբ թարմացվեցին', 'success');
    } catch (err) {
      console.error(err);
      addToast('Սխալ տվյալները թարմացնելիս', 'error');
    }
  };

  const handleSaveGroupOffset = async (groupId) => {
    try {
      const res = await api.put(`/students/${id}/groups/${groupId}`, {
        attended_lessons: parseInt(offsetValue, 10) || 0
      });
      setStudent(res.data);
      setEditingOffsetGroupId(null);
      addToast('Ուսանողի դասերի քանակը և բալանսը թարմացվեցին', 'success');
    } catch (err) {
      console.error(err);
      addToast('Սխալ դասերի հաշվարկը թարմացնելիս', 'error');
    }
  };

  const handleSaveTotalLessons = async () => {
    try {
      const res = await api.put(`/students/${id}/lessons`, {
        attended_lessons: parseInt(totalLessonsValue, 10) || 0
      });
      setStudent(res.data);
      setEditingTotalLessons(false);
      addToast('Ուսանողի դասերի քանակը և բալանսը թարմացվեցին', 'success');
    } catch (err) {
      console.error(err);
      addToast('Սխալ դասերի քանակը թարմացնելիս', 'error');
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
        <div className="col-span-1 space-y-6">
          <div className="glass-panel p-6">
            <div className="flex flex-col items-center mb-6 pt-4">
              <h2 className="text-2xl font-bold text-gray-800">{student.full_name}</h2>
              <p className="text-brand font-bold text-center mt-1">{student.course_direction}</p>
              <div className="mt-3 flex items-center gap-2">
                <StatusBadge status={student.status} />
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                  student.course_format?.toLowerCase().includes('օնլայն') || student.course_format?.toLowerCase().includes('online')
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : 'bg-purple-50 text-purple-700 border-purple-200'
                }`}>
                  {student.course_format || 'Օֆլայն'}
                </span>
              </div>
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

              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-2 mt-4">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Հաշվեկշիռ և Բալանս</p>
                
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Վճարված է:</span>
                  <span className="font-bold text-gray-800">{(student.total_paid || 0).toLocaleString()} ֏</span>
                </div>
                
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">1 դասի արժեք:</span>
                  <span className="font-medium text-gray-700">{(student.lesson_cost || 0).toLocaleString()} ֏</span>
                </div>

                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Արված դասեր:</span>
                  {editingTotalLessons ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="0"
                        value={totalLessonsValue}
                        onChange={(e) => setTotalLessonsValue(e.target.value)}
                        className="w-16 px-2 py-0.5 text-xs border border-brand rounded bg-white text-center font-bold focus:outline-none"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={handleSaveTotalLessons}
                        className="p-1 bg-emerald-600 text-white rounded hover:bg-emerald-700"
                        title="Պահպանել"
                      >
                        <Check size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingTotalLessons(false)}
                        className="p-1 bg-gray-200 text-gray-600 rounded hover:bg-gray-300"
                        title="Չեղարկել"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-gray-700">{student.total_lessons_attended || 0} դաս</span>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingTotalLessons(true);
                          setTotalLessonsValue(student.total_lessons_attended || 0);
                        }}
                        className="p-1 text-gray-400 hover:text-brand rounded hover:bg-brand/10 transition"
                        title="Խմբագրել ուսանողի դասերի քանակը"
                      >
                        <Edit2 size={13} />
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Գանձված է:</span>
                  <span className="font-medium text-gray-700">{(student.total_charged || 0).toLocaleString()} ֏</span>
                </div>

                <div className="pt-2 border-t border-gray-200 flex justify-between items-center">
                  <span className="text-sm font-bold text-gray-700">Ընթացիկ Բալանս:</span>
                  {student.balance > 0 ? (
                    <span className="text-emerald-700 bg-emerald-100/60 px-2.5 py-1 rounded-md font-extrabold text-sm border border-emerald-200">
                      +{student.balance?.toLocaleString()} ֏
                    </span>
                  ) : (
                    <span className="text-red-600 bg-red-100/60 px-2.5 py-1 rounded-md font-extrabold text-sm border border-red-200">
                      {student.balance?.toLocaleString()} ֏
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Assigned Groups & Per-Student Attendance Offset */}
          <div className="glass-panel p-6">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
              <Users2 className="text-brand" size={20} />
              <h3 className="text-lg font-bold text-gray-800">Կցված Խմբեր</h3>
            </div>

            {student.student_groups && student.student_groups.length > 0 ? (
              <div className="space-y-3">
                {student.student_groups.map((sg) => (
                  <div key={sg.group_id} className="p-3.5 bg-gray-50 rounded-xl border border-gray-200/80 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-gray-800 text-sm">{sg.group_name}</p>
                        {sg.course_title && (
                          <p className="text-xs text-brand font-semibold">{sg.course_title}</p>
                        )}
                      </div>
                      <span className="bg-brand/15 text-gray-800 border border-brand/30 text-xs font-bold px-2 py-0.5 rounded-md">
                        {sg.student_attended_lessons} դաս
                      </span>
                    </div>

                    {(sg.days || sg.start_time) && (
                      <p className="text-xs text-gray-500">
                        {sg.days} {sg.start_time ? `• ${sg.start_time}-${sg.end_time}` : ''}
                      </p>
                    )}

                    <div className="pt-2 border-t border-gray-200/60 flex items-center justify-between text-xs text-gray-600">
                      <span>Խմբի ընդհանուր դասեր՝ <b>{sg.group_conducted_lessons}</b></span>
                      {editingOffsetGroupId === sg.group_id ? (
                        <div className="flex items-center gap-1">
                          <span className="text-[11px] text-gray-500">Ուսանողի դասեր՝</span>
                          <input
                            type="number"
                            min="0"
                            value={offsetValue}
                            onChange={(e) => setOffsetValue(e.target.value)}
                            className="w-14 px-1.5 py-0.5 text-xs border border-brand rounded bg-white text-center font-bold focus:outline-none"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveGroupOffset(sg.group_id)}
                            className="p-1 bg-emerald-600 text-white rounded hover:bg-emerald-700"
                            title="Պահպանել"
                          >
                            <Check size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingOffsetGroupId(null)}
                            className="p-1 bg-gray-200 text-gray-600 rounded hover:bg-gray-300"
                            title="Չեղարկել"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingOffsetGroupId(sg.group_id);
                            setOffsetValue(sg.student_attended_lessons || 0);
                          }}
                          className="text-[11px] text-brand font-semibold hover:text-black underline flex items-center gap-1"
                          title="Խմբագրել ուսանողի արված դասերի քանակը այս խմբում"
                        >
                          <Edit2 size={11} /> Խմբագրել դասերը ({sg.student_attended_lessons})
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic text-center py-4">
                Ուսանողը դեռևս որևէ խմբում ներառված չէ
              </p>
            )}
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
                      <option>Նոր</option>
                      <option>Հաստատված</option>
                      <option>Ընթացիկ</option>
                      <option>Անորոշ</option>
                      <option>Արխիվ</option>
                      <option>Ջնջված</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-bold text-brand uppercase text-sm mb-2 border-b border-gray-200 pb-1">Ուսումնական & Ֆինանսական</h3>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Ուղղություն</label>
                    <select name="course_direction" value={formData.course_direction || ''} onChange={handleChange} className="glass-input w-full">
                      {allDirections.map((dir, idx) => (
                        <option key={idx} value={dir}>{dir}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Ձևաչափ</label>
                    <select name="course_format" value={formData.course_format || 'Օֆլայն'} onChange={handleChange} className="glass-input w-full">
                      <option value="Օֆլայն">🏢 Օֆլայն (Դասասենյակում)</option>
                      <option value="Օնլայն">🌐 Օնլայն (Հեռավար)</option>
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
