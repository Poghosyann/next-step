import React, { useState, useEffect } from 'react';
import api from '../api';
import { X, Plus, Trash2, Edit2 } from 'lucide-react';

const Courses = () => {
  const [courses, setCourses] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '' });

  const fetchCourses = () => {
    api.get('/courses').then(res => setCourses(res.data)).catch(console.error);
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/courses', formData);
      setShowModal(false);
      setFormData({ title: '', description: '' });
      fetchCourses();
    } catch (err) {
      console.error(err);
      alert('Error saving course');
    }
  };

  const handleDelete = async (id) => {
    if(window.confirm('Are you sure you want to delete this course?')) {
      try {
        await api.delete(`/courses/${id}`);
        fetchCourses();
      } catch (err) {
        console.error(err);
        alert('Error deleting course');
      }
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Դասընթացներ</h1>
          <p className="text-gray-500">Կառավարեք Ձեր դասընթացները</p>
        </div>
        <button onClick={() => setShowModal(true)} className="glass-button flex items-center gap-2">
          <Plus size={20} /> Նոր դասընթաց
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <div key={course.id} className="glass-panel p-6 flex flex-col">
            <h3 className="text-xl font-semibold mb-2 text-gray-800">{course.title}</h3>
            <p className="text-gray-500 text-sm mb-4 flex-1">{course.description}</p>
            <div className="flex justify-between items-center pt-4 border-t border-gray-100">
              <span className="text-brand font-medium bg-brand/10 px-3 py-1 rounded-full text-xs">Ակտիվ</span>
              <div className="flex gap-2">
                <button onClick={() => handleDelete(course.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-md transition">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
        {courses.length === 0 && (
          <div className="col-span-full p-12 text-center text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
            Դասընթացներ չեն գտնվել
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-800">Նոր Դասընթաց</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-800 transition">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Անվանում</label>
                <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="glass-input w-full" placeholder="Օր.՝ Ֆինանսական հաշվառում" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Նկարագրություն</label>
                <textarea rows="3" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="glass-input w-full resize-none" placeholder="Դասընթացի կարճ նկարագրությունը..."></textarea>
              </div>
              <div className="flex justify-end pt-4">
                <button type="submit" className="glass-button w-full">Պահպանել</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Courses;
