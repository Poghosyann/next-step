import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { ArrowLeft, CreditCard, Trash2, Edit2, X, Users2, Check, Flame, FileText, ExternalLink } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import { useToast } from '../context/ToastContext';

const StudentProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [student, setStudent] = useState(null);
  const [editingOffsetGroupId, setEditingOffsetGroupId] = useState(null);
  const [offsetValue, setOffsetValue] = useState(0);
  const [editingTotalLessons, setEditingTotalLessons] = useState(false);
  const [totalLessonsValue, setTotalLessonsValue] = useState(0);

  const fetchStudent = useCallback(async () => {
    try {
      const response = await api.get(`/students/${id}`);
      setStudent(response.data);
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

  if (!student) {
    return (
      <div className="p-8 animate-pulse">
        <div className="flex justify-between items-center mb-6">
          <div className="h-5 w-36 bg-gray-200 rounded" />
          <div className="flex gap-2">
            <div className="h-9 w-28 bg-gray-200 rounded-md" />
            <div className="h-9 w-24 bg-gray-200 rounded-md" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="col-span-1 space-y-6">
            <div className="glass-panel p-6 space-y-4">
              <div className="flex flex-col items-center pt-4">
                <div className="h-7 w-48 bg-gray-200 rounded mb-2" />
                <div className="h-4 w-36 bg-gray-200 rounded mb-3" />
                <div className="flex gap-2">
                  <div className="h-5 w-20 bg-gray-200 rounded-full" />
                  <div className="h-5 w-20 bg-gray-200 rounded-full" />
                </div>
              </div>
              <div className="space-y-4 border-t border-gray-100 pt-5">
                <div className="h-10 bg-gray-100 rounded" />
                <div className="h-10 bg-gray-100 rounded" />
                <div className="h-36 bg-gray-100 rounded-xl" />
              </div>
            </div>
            <div className="glass-panel p-6 space-y-3">
              <div className="h-6 w-36 bg-gray-200 rounded" />
              <div className="h-24 bg-gray-100 rounded-xl" />
            </div>
          </div>
          <div className="col-span-2 space-y-6">
            <div className="glass-panel p-6 space-y-4">
              <div className="h-6 w-48 bg-gray-200 rounded" />
              <div className="space-y-3">
                <div className="h-16 bg-gray-100 rounded-lg" />
                <div className="h-16 bg-gray-100 rounded-lg" />
              </div>
            </div>
            <div className="glass-panel p-6 space-y-3">
              <div className="h-5 w-40 bg-gray-200 rounded" />
              <div className="h-24 bg-gray-100 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <Link to="/students" className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition">
          <ArrowLeft size={18} /> Վերադառնալ ցանկ
        </Link>
        <div className="flex gap-2">
          <button onClick={() => navigate(`/students/${id}/edit`)} className="glass-button flex items-center gap-2 !py-2 !px-4">
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
              <div className="mt-3 flex items-center gap-2 flex-wrap justify-center">
                <StatusBadge status={student.status} />
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                  student.course_format?.toLowerCase().includes('օնլայն') || student.course_format?.toLowerCase().includes('online')
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : 'bg-purple-50 text-purple-700 border-purple-200'
                }`}>
                  {student.course_format || 'Օֆլայն'}
                </span>
              </div>
              {student.urgent_notes && student.urgent_notes.trim() && (
                <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-300 text-xs font-bold">
                  <Flame size={14} className="text-orange-500 shrink-0" />
                  <span>{student.urgent_notes}</span>
                </div>
              )}
            </div>
            
            <div className="space-y-4 text-gray-700 border-t border-gray-100 pt-5">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Հեռախոսահամար</p>
                <p className="font-medium">{student.phone || '—'}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Էլ. Հասցե</p>
                <p className="font-medium">{student.email || '—'}</p>
              </div>
              {student.social_link && (
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Սոց․ հարթակի հղում</p>
                  <a
                    href={student.social_link.startsWith('http') ? student.social_link : `https://${student.social_link}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-brand hover:underline inline-flex items-center gap-1 break-all text-sm"
                  >
                    <span>{student.social_link}</span>
                    <ExternalLink size={13} />
                  </a>
                </div>
              )}
              {(student.preferred_schedule || student.preferred_time) && (
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Նախընտրած Գրաֆիկ / Ժամ</p>
                  <p className="font-medium text-sm">
                    {[student.preferred_schedule, student.preferred_time].filter(Boolean).join(' • ')}
                  </p>
                </div>
              )}
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Ամսավճար / Նվեր քարտ</p>
                <p className="font-medium flex items-center flex-wrap gap-1.5">
                  <span>{(student.monthly_fee || 0).toLocaleString()} ֏</span>
                  {student.gift_card > 0 && (
                    <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-xs font-bold">
                      🎁 -{student.gift_card.toLocaleString()} ֏
                    </span>
                  )}
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

          {/* Notes & Urgent Notes Card */}
          <div className="glass-panel p-6">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <FileText className="text-brand" size={20} />
                <h3 className="text-lg font-bold text-gray-800">Նշումներ</h3>
              </div>
              <button
                type="button"
                onClick={() => navigate(`/students/${id}/edit`)}
                className="text-xs font-semibold text-brand hover:underline flex items-center gap-1"
              >
                <Edit2 size={12} /> Խմբագրել
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Flame size={13} /> Հրատապ նշում
                </p>
                {student.urgent_notes && student.urgent_notes.trim() ? (
                  <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-sm font-semibold">
                    {student.urgent_notes}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic">Հրատապ նշում չկա</p>
                )}
              </div>

              <div className="pt-2 border-t border-gray-100">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Ընդհանուր նշումներ</p>
                {student.comment && student.comment.trim() ? (
                  <div className="p-3 rounded-lg bg-gray-50 border border-gray-200/80 text-gray-700 text-sm whitespace-pre-wrap">
                    {student.comment}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic">Նշումներ չկան</p>
                )}
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
                        <p className="font-bold text-gray-800 text-sm">{sg.course_title || student.course_direction || 'Դասընթաց'}</p>
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

            {student.lesson_edit_history && student.lesson_edit_history.length > 0 && (
              <div className="mt-5 pt-4 border-t border-gray-100">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2.5">
                  Դասերի Խմբագրման Պատմություն
                </p>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {student.lesson_edit_history.map((item, idx) => (
                    <div key={item.id || idx} className="text-xs bg-gray-50 border border-gray-200/70 rounded-lg px-3 py-2 flex items-center justify-between gap-2">
                      <div>
                        <span className="font-semibold text-gray-700">{item.note || 'Դասերի քանակի խմբագրում'}</span>
                        {item.created_at && (
                          <span className="block text-[10px] text-gray-400">
                            {new Date(item.created_at).toLocaleString('hy-AM')}
                          </span>
                        )}
                      </div>
                      <span className="font-bold text-brand whitespace-nowrap bg-white px-2 py-0.5 rounded border border-gray-200">
                        {item.old_lessons} ➔ {item.new_lessons} դաս
                      </span>
                    </div>
                  ))}
                </div>
              </div>
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
    </div>
  );
};

export default StudentProfile;
