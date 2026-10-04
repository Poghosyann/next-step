import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const Settings = () => {
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });

  const handleLogout = () => {
    localStorage.removeItem('crm_token');
    window.location.reload();
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage({ text: 'Նոր գաղտնաբառերը չեն համապատասխանում:', type: 'error' });
      return;
    }
    
    try {
      await api.put('/settings/password', {
        current_password: currentPassword,
        new_password: newPassword
      });
      setMessage({ text: 'Գաղտնաբառը հաջողությամբ փոխվեց:', type: 'success' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      setMessage({ text: 'Ընթացիկ գաղտնաբառը սխալ է:', type: 'error' });
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Կարգավորումներ</h1>
        <p className="text-gray-500">Համակարգի անվտանգության կարգավորումներ</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Security / Password */}
        <div className="glass-panel p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 border-b border-gray-100 pb-2">Անվտանգություն</h2>
          
          {message.text && (
            <div className={`p-3 rounded-md mb-4 text-sm font-medium ${message.type === 'error' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-600 border border-green-100'}`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Ընթացիկ Գաղտնաբառ</label>
              <input required type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="glass-input w-full" placeholder="••••••••" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Նոր Գաղտնաբառ</label>
              <input required type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="glass-input w-full" placeholder="••••••••" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Կրկնել Նոր Գաղտնաբառը</label>
              <input required type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="glass-input w-full" placeholder="••••••••" />
            </div>
            <button type="submit" className="glass-button w-full">Փոխել Գաղտնաբառը</button>
          </form>
        </div>

        {/* System / Session */}
        <div className="glass-panel p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 border-b border-gray-100 pb-2">Սեսիա (Session)</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-4">
                Դուրս եկեք համակարգից անվտանգության նկատառումներով, եթե ավարտել եք ձեր աշխատանքը կամ օգտագործում եք ուրիշի համակարգիչ։
              </p>
              <button onClick={handleLogout} className="w-full bg-red-50 text-red-500 font-bold py-2 px-4 rounded border border-red-200 hover:bg-red-100 transition">
                Դուրս գալ համակարգից
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Settings;
