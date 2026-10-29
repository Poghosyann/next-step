import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { ArrowLeft, Save, Flame } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const StudentForm = () => {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [loading, setLoading] = useState(isEditing);
  const [submitting, setSubmitting] = useState(false);
  const [coursesList, setCoursesList] = useState([]);

  const initialFormState = {
    full_name: '',
    course_direction: 'Ֆինանսական հաշվառում',
    course_format: 'Օֆլայն',
    location: '',
    status: 'Նոր',
    phone: '',
    email: '',
    social_link: '',
    preferred_schedule: '',
    preferred_time: '',
    monthly_fee: 48000,
    gift_card: 0,
    source: 'Instagram',
    comment: '',
    urgent_notes: ''
  };

  const [formData, setFormData] = useState(initialFormState);

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
    ...(formData.course_direction ? [formData.course_direction] : [])
  ])).filter(Boolean);

  useEffect(() => {
    api.get('/courses').then(res => setCoursesList(res.data || [])).catch(console.error);
  }, []);

  useEffect(() => {
    if (!isEditing) return;
    const fetchStudent = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/students/${id}`);
        setFormData({
          ...initialFormState,
          ...res.data,
          full_name: res.data.full_name || '',
          phone: res.data.phone || '',
          email: res.data.email || '',
          social_link: res.data.social_link || '',
          preferred_schedule: res.data.preferred_schedule || '',
          preferred_time: res.data.preferred_time || '',
          course_direction: res.data.course_direction || 'Ֆինանսական հաշվառում',
          course_format: res.data.course_format || 'Օֆլայն',
          status: res.data.status || 'Նոր',
          monthly_fee: res.data.monthly_fee ?? 0,
          gift_card: res.data.gift_card ?? 0,
          comment: res.data.comment || '',
          urgent_notes: res.data.urgent_notes || ''
        });
      } catch (err) {
        console.error('Error fetching student:', err);
        addToast('Սխալ ուսանողի տվյալները բեռնելիս', 'error');
        navigate('/students');
      } finally {
        setLoading(false);
      }
    };
    fetchStudent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isEditing]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const payload = {
        ...formData,
        monthly_fee: formData.monthly_fee === '' ? 0 : Number(formData.monthly_fee) || 0,
        gift_card: formData.gift_card === '' ? 0 : Number(formData.gift_card) || 0
      };

      if (isEditing) {
        await api.put(`/students/${id}`, payload);
        addToast('Ուսանողի տվյալները հաջողությամբ թարմացվեցին', 'success');
        navigate(`/students/${id}`);
      } else {
        const res = await api.post('/students', payload);
        addToast('Ուսանողը հաջողությամբ ավելացվեց', 'success');
        if (res.data?.id) {
          navigate(`/students/${res.data.id}`);
        } else {
          navigate('/students');
        }
      }
    } catch (error) {
      console.error('Error saving student:', error);
      addToast('Սխալ առաջացավ ուսանողին պահպանելիս', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-5xl mx-auto animate-pulse">
        <div className="h-5 w-40 bg-gray-200 rounded mb-6" />
        <div className="glass-panel p-8 space-y-6">
          <div className="h-8 w-64 bg-gray-200 rounded" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-48 bg-gray-100 rounded-xl" />
            <div className="h-48 bg-gray-100 rounded-xl" />
          </div>
          <div className="h-32 bg-gray-100 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <Link
          to={isEditing ? `/students/${id}` : '/students'}
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-800 font-medium transition"
        >
          <ArrowLeft size={18} />
          <span>{isEditing ? 'Վերադառնալ ուսանողի էջ' : 'Վերադառնալ ուսանողների ցանկ'}</span>
        </Link>
      </div>

      <div className="glass-panel p-8 bg-white">
        <div className="mb-8 pb-4 border-b border-gray-100">
          <h1 className="text-2xl font-bold text-gray-800">
            {isEditing ? 'Խմբագրել Ուսանողի Տվյալները' : 'Ավելացնել Նոր Ուսանող'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Բոլոր դաշտերը ոչ պարտադիր են․ լրացրեք առկա տեղեկատվությունը
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* 1. Personal Details */}
            <div className="space-y-4">
              <h3 className="font-bold text-brand uppercase text-sm mb-3 border-b border-gray-100 pb-2">
                Անձնական Տվյալներ
              </h3>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Անուն Ազգանուն</label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  className="glass-input w-full"
                  placeholder="Օր.՝ Անուն Ազգանուն"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Հեռախոսահամար</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="glass-input w-full"
                  placeholder="+374 __ __ __ __"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Էլ. Հասցե</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="glass-input w-full"
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Սոց․ հարթակի հղում</label>
                <input
                  type="text"
                  name="social_link"
                  value={formData.social_link}
                  onChange={handleChange}
                  className="glass-input w-full"
                  placeholder="https://instagram.com/..."
                />
              </div>
            </div>

            {/* 2. Course & Schedule Details */}
            <div className="space-y-4">
              <h3 className="font-bold text-brand uppercase text-sm mb-3 border-b border-gray-100 pb-2">
                Դասընթացի և Գրաֆիկի Մանրամասներ
              </h3>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Ուղղություն</label>
                <select
                  name="course_direction"
                  value={formData.course_direction}
                  onChange={handleChange}
                  className="glass-input w-full"
                >
                  {allDirections.map((dir, idx) => (
                    <option key={idx} value={dir}>{dir}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Ձևաչափ</label>
                  <select
                    name="course_format"
                    value={formData.course_format || 'Օֆլայն'}
                    onChange={handleChange}
                    className="glass-input w-full"
                  >
                    <option value="Օֆլայն">🏢 Օֆլայն (Դասասենյակում)</option>
                    <option value="Օնլայն">🌐 Օնլայն (Հեռավար)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Կարգավիճակ</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="glass-input w-full"
                  >
                    <option>Նոր</option>
                    <option>Հաստատված</option>
                    <option>Ընթացիկ</option>
                    <option>Անորոշ</option>
                    <option>Արխիվ</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Նախընտրած գրաֆիկ</label>
                <input
                  list="scheduleOptions"
                  type="text"
                  name="preferred_schedule"
                  value={formData.preferred_schedule}
                  onChange={handleChange}
                  className="glass-input w-full"
                  placeholder="Օր.՝ Երկ, Չոր, Ուրբ"
                />
                <datalist id="scheduleOptions">
                  <option value="Երկ, Չոր, Ուրբ" />
                  <option value="Երեք, Հինգ, Շաբ" />
                  <option value="Շաբաթ - Կիրակի" />
                </datalist>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Նախընտրած ժամանակահատված</label>
                <input
                  list="timeOptions"
                  type="text"
                  name="preferred_time"
                  value={formData.preferred_time}
                  onChange={handleChange}
                  className="glass-input w-full"
                  placeholder="Օր.՝ 18:30 - 20:30"
                />
                <datalist id="timeOptions">
                  <option value="Առավոտյան (11:00 - 13:00)" />
                  <option value="Ցերեկային (14:00 - 16:00)" />
                  <option value="Երեկոյան (18:30 - 20:30)" />
                  <option value="Երեկոյան (19:00 - 21:00)" />
                </datalist>
              </div>
            </div>
          </div>

          {/* 3. Financials */}
          <div>
            <h3 className="font-bold text-brand uppercase text-sm mb-3 border-b border-gray-100 pb-2">
              Ֆինանսական Տվյալներ
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Ամսավճար (AMD)</label>
                <input
                  type="number"
                  min="0"
                  name="monthly_fee"
                  value={formData.monthly_fee}
                  onChange={handleChange}
                  className="glass-input w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Նվեր քարտ (֏)</label>
                <input
                  type="number"
                  min="0"
                  name="gift_card"
                  value={formData.gift_card ?? 0}
                  onChange={handleChange}
                  className="glass-input w-full"
                />
              </div>
            </div>
          </div>

          {/* 4. Urgent Notes & General Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-bold text-amber-600 uppercase text-sm mb-3 border-b border-gray-100 pb-2 flex items-center gap-1.5">
                <Flame size={16} /> Հրատապ նշում (տեսանելի ուսանողների ցանկում)
              </h3>
              <input
                type="text"
                name="urgent_notes"
                value={formData.urgent_notes}
                onChange={handleChange}
                className="glass-input w-full border-amber-300 focus:border-amber-500"
                placeholder="Օր.՝ Follow Up tomorrow"
              />
              <p className="text-xs text-gray-400 mt-1.5">
                Այս նշումն անմիջապես կերևա ուսանողների ցանկում տվյալ ուսանողի տողի վրա:
              </p>
            </div>
            <div>
              <h3 className="font-bold text-brand uppercase text-sm mb-3 border-b border-gray-100 pb-2">
                Նշումներ
              </h3>
              <textarea
                name="comment"
                value={formData.comment}
                onChange={handleChange}
                rows="3"
                className="glass-input w-full resize-y"
                placeholder="Այլ նշումներ ուսանողի մասին..."
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
            <button
              type="button"
              onClick={() => navigate(isEditing ? `/students/${id}` : '/students')}
              className="px-6 py-2.5 border border-gray-300 rounded-md text-gray-700 font-medium hover:bg-gray-50 transition"
            >
              Չեղարկել
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="glass-button px-8 flex items-center gap-2"
            >
              <Save size={18} />
              <span>{submitting ? 'Պահպանվում է...' : 'Պահպանել'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StudentForm;
