import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';
import { ArrowLeft, User, CreditCard } from 'lucide-react';

const StudentProfile = () => {
  const { id } = useParams();
  const [student, setStudent] = useState(null);

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const response = await api.get(`/students/${id}`);
        setStudent(response.data);
      } catch (error) {
        console.error('Error fetching student details:', error);
      }
    };
    fetchStudent();
  }, [id]);

  if (!student) return <div className="p-8 text-white">Բեռնում...</div>;

  return (
    <div className="p-8">
      <Link to="/students" className="flex items-center gap-2 text-white/60 hover:text-white mb-6 transition">
        <ArrowLeft size={18} /> Վերադառնալ ցանկ
      </Link>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Profile Card */}
        <div className="col-span-1 glass-panel p-6">
          <div className="flex flex-col items-center mb-6">
            <div className="w-24 h-24 bg-brand/20 rounded-full flex items-center justify-center mb-4 border-2 border-brand text-brand">
              <User size={40} />
            </div>
            <h2 className="text-2xl font-bold text-white">{student.full_name}</h2>
            <p className="text-brand font-medium">{student.course_direction}</p>
            <span className="mt-2 px-3 py-1 bg-white/10 rounded-full text-sm text-white/80">{student.status}</span>
          </div>
          
          <div className="space-y-4 text-white/80 border-t border-white/10 pt-4">
            <div>
              <p className="text-xs text-white/40 uppercase">Հեռախոս</p>
              <p>{student.phone}</p>
            </div>
            <div>
              <p className="text-xs text-white/40 uppercase">Էլ. փոստ</p>
              <p>{student.email}</p>
            </div>
            <div>
              <p className="text-xs text-white/40 uppercase">Ամսավճար / Զեղչ</p>
              <p>{student.monthly_fee?.toLocaleString()} ֏ {student.discount_percent > 0 && <span className="text-brand">(-{student.discount_percent}%)</span>}</p>
            </div>
          </div>
        </div>

        {/* Payments History */}
        <div className="col-span-1 md:col-span-2 glass-panel p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <CreditCard className="text-brand" />
            <h3 className="text-xl font-bold text-white">Վճարումների պատմություն</h3>
          </div>
          
          {student.payments && student.payments.length > 0 ? (
            <div className="flex-1 overflow-auto">
              <table className="w-full text-left text-white">
                <thead>
                  <tr className="border-b border-white/10 text-white/40 text-sm">
                    <th className="pb-3 font-normal">Ամսաթիվ</th>
                    <th className="pb-3 font-normal">Գումար</th>
                    <th className="pb-3 font-normal">Եղանակ</th>
                    <th className="pb-3 font-normal">Նշումներ</th>
                  </tr>
                </thead>
                <tbody>
                  {student.payments.map(pay => (
                    <tr key={pay.id} className="border-b border-white/5 last:border-0 hover:bg-white/5">
                      <td className="py-3">{new Date(pay.payment_date).toLocaleDateString('hy-AM')}</td>
                      <td className="py-3 text-green-400 font-bold">{pay.amount.toLocaleString()} ֏</td>
                      <td className="py-3">{pay.method}</td>
                      <td className="py-3 text-white/50 text-sm">{pay.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-white/40">
              Այս ուսանողը դեռ վճարումներ չունի
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentProfile;
