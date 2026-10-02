import React from 'react';
import { useNavigate } from 'react-router-dom';

const Settings = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('crm_token');
    window.location.reload();
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Կարգավորումներ</h1>
        <p className="text-gray-500">Համակարգի ընդհանուր կարգավորումներ և անվտանգություն</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="glass-panel p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 border-b border-gray-100 pb-2">Օգտահաշիվ</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Ադմինիստրատոր</label>
              <input type="text" disabled value="admin" className="glass-input w-full bg-gray-50 text-gray-500" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Գաղտնաբառի փոփոխություն</label>
              <button disabled className="glass-button w-full opacity-50 cursor-not-allowed">Փոխել գաղտնաբառը (Շուտով)</button>
            </div>
          </div>
        </div>

        <div className="glass-panel p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 border-b border-gray-100 pb-2">Համակարգ</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Թեմա (Theme)</label>
              <select className="glass-input w-full">
                <option>Լուսավոր (Light)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Անվտանգություն</label>
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
