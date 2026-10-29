import { useState, useEffect } from 'react';
import api from '../api';
import { Plus, Trash2, Edit2, BookOpen, ArrowLeft } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const Courses = () => {
  const { addToast } = useToast();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState(null);
  const [formData, setFormData] = useState({ title: '', total_lessons: '' });

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const res = await api.get('/courses');
      setCourses(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const openCreateModal = () => {
    setFormData({ title: '', total_lessons: '' });
    setEditingCourseId(null);
    setShowModal(true);
  };

  const openEditModal = (course) => {
    setFormData({
      title: course.title || '',
      total_lessons: course.total_lessons !== undefined && course.total_lessons !== null 
        ? course.total_lessons 
        : ''
    });
    setEditingCourseId(course.id);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      title: formData.title.trim(),
      total_lessons: parseInt(formData.total_lessons) || 0
    };

    try {
      if (editingCourseId) {
        await api.put(`/courses/${editingCourseId}`, payload);
        addToast('Դասընթացը թարմացվեց', 'success');
      } else {
        await api.post('/courses', payload);
        addToast('Դասընթացը հաջողությամբ պահպանվեց', 'success');
      }
      setShowModal(false);
      setFormData({ title: '', total_lessons: '' });
      setEditingCourseId(null);
      fetchCourses();
    } catch (err) {
      console.error(err);
      addToast('Սխալ դասընթացը պահպանելիս', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Համոզվա՞ծ եք, որ ցանկանում եք ջնջել այս դասընթացը:')) {
      try {
        await api.delete(`/courses/${id}`);
        fetchCourses();
        addToast('Դասընթացը ջնջվեց', 'success');
      } catch (err) {
        console.error(err);
        addToast('Սխալ դասընթացը ջնջելիս', 'error');
      }
    }
  };

  if (showModal) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button
            type="button"
            onClick={() => setShowModal(false)}
            className="p-2.5 bg-white border border-gray-200 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition shadow-sm"
            title="Վերադառնալ"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              {editingCourseId ? 'Խմբագրել Դասընթացը' : 'Նոր Դասընթաց'}
            </h1>
            <p className="text-sm text-gray-500">
              Լրացրեք դասընթացի անվանումը և ընդհանուր դասերի քանակը
            </p>
          </div>
        </div>

        <div className="glass-panel bg-white p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Անվանում *</label>
              <input 
                required 
                type="text" 
                value={formData.title} 
                onChange={e => setFormData({ ...formData, title: e.target.value })} 
                className="glass-input w-full" 
                placeholder="Օր.՝ Ֆինանսական հաշվառում" 
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                Տևողություն (դասերի քանակ) *
              </label>
              <div className="relative">
                <input 
                  required 
                  type="number" 
                  min="1" 
                  step="1"
                  value={formData.total_lessons} 
                  onChange={e => setFormData({ ...formData, total_lessons: e.target.value })} 
                  className="glass-input w-full pr-14" 
                  placeholder="Օր.՝ 30" 
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-semibold">
                  դաս
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Ըստ այս քանակի՝ խմբերում ավտոմատ կարտացոլվի առաջընթացի գիծը:
              </p>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button 
                type="button" 
                onClick={() => setShowModal(false)} 
                className="px-6 py-2.5 bg-white border border-gray-300 rounded-md text-gray-700 font-medium hover:bg-gray-50 transition text-sm"
              >
                Չեղարկել
              </button>
              <button type="submit" className="glass-button px-8 py-2.5 text-sm">
                {editingCourseId ? 'Թարմացնել' : 'Պահպանել'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Դասընթացներ</h1>
          <p className="text-gray-500">Կառավարեք Ձեր դասընթացները և դասերի քանակը</p>
        </div>
        <button onClick={openCreateModal} className="glass-button flex items-center gap-2">
          <Plus size={20} /> Նոր դասընթաց
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {loading ? (
          Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="glass-panel p-6 flex flex-col justify-between animate-pulse">
              <div>
                <div className="w-12 h-12 rounded-xl bg-gray-200 mb-4" />
                <div className="h-6 w-3/4 bg-gray-200 rounded-md mb-4" />
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 my-4 flex items-center justify-between">
                  <div className="h-3.5 w-28 bg-gray-200 rounded" />
                  <div className="h-6 w-16 bg-gray-200 rounded-md" />
                </div>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-gray-100 mt-2">
                <div className="h-5 w-16 bg-gray-200 rounded-full" />
                <div className="flex gap-1.5">
                  <div className="w-7 h-7 bg-gray-200 rounded-md" />
                  <div className="w-7 h-7 bg-gray-200 rounded-md" />
                </div>
              </div>
            </div>
          ))
        ) : (
          courses.map((course) => (
            <div key={course.id} className="glass-panel p-6 flex flex-col justify-between hover:shadow-lg transition">
              <div>
                <div className="w-12 h-12 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center text-brand mb-4">
                  <BookOpen size={24} />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">{course.title}</h3>
                
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 my-4 flex items-center justify-between">
                  <span className="text-xs text-gray-500 font-medium">Տևողություն (դասեր)</span>
                  <span className="text-sm font-bold text-gray-900 bg-white px-2.5 py-1 rounded-md border border-gray-200">
                    {course.total_lessons || 0} դաս
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-gray-100 mt-2">
                <span className="text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full text-xs">
                  Ակտիվ
                </span>
                <div className="flex gap-1.5">
                  <button 
                    onClick={() => openEditModal(course)} 
                    className="p-1.5 text-gray-400 hover:text-brand hover:bg-brand/10 rounded-md transition" 
                    title="Խմբագրել"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => handleDelete(course.id)} 
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition" 
                    title="Ջնջել"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}

        {!loading && courses.length === 0 && (
          <div className="col-span-full p-12 text-center text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
            Դասընթացներ չեն գտնվել
          </div>
        )}
      </div>
    </div>
  );
};

export default Courses;
