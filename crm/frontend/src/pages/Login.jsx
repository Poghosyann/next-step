import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const Login = ({ setAuth }) => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/login', { username, password });
      if (res.data.token) {
        localStorage.setItem('crm_token', res.data.token);
        setAuth(true);
        navigate('/');
      }
    } catch (err) {
      setError('ÕÕ­Õ¡Õ¬ Õ´Õ¸Ö‚Õ¿Ö„Õ¡Õ¶Õ¸Ö‚Õ¶ Õ¯Õ¡Õ´ Õ£Õ¡Õ²Õ¿Õ¶Õ¡Õ¢Õ¡Õ¼');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
      <div className="bg-[#1a1a1a] p-8 rounded-xl border border-gray-200 w-full max-w-md shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-brand mb-2">Next-Step CRM</h1>
          <p className="text-gray-500">Õ„Õ¸Ö‚Õ¿Ö„Õ¡Õ£Ö€Õ¥Ö„ Õ±Õ¥Ö€ Õ¿Õ¾ÕµÕ¡Õ¬Õ¶Õ¥Ö€Õ¨ Õ°Õ¡Õ´Õ¡Õ¯Õ¡Ö€Õ£ Õ´Õ¿Õ¶Õ¥Õ¬Õ¸Ö‚ Õ°Õ¡Õ´Õ¡Ö€</p>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-400 p-3 rounded mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-800/80 mb-2">Õ„Õ¸Ö‚Õ¿Ö„Õ¡Õ¶Õ¸Ö‚Õ¶</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-md p-3 text-gray-800 focus:border-brand outline-none"
              placeholder="admin"
              required 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-800/80 mb-2">Ô³Õ¡Õ²Õ¿Õ¶Õ¡Õ¢Õ¡Õ¼</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-md p-3 text-gray-800 focus:border-brand outline-none"
              placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
              required 
            />
          </div>
          <button 
            type="submit" 
            className="w-full bg-brand hover:bg-brand/90 text-black font-bold py-3 px-4 rounded-md transition-colors"
          >
            Õ„Õ¸Ö‚Õ¿Ö„ Ô³Õ¸Ö€Õ®Õ¥Õ¬
          </button>
        </form>
        
        <div className="mt-6 text-center text-xs text-gray-800/40">
          Ô¹Õ¥Õ½Õ¿Õ¡Õ¾Õ¸Ö€Õ´Õ¡Õ¶ Õ°Õ¡Õ´Õ¡Ö€ Ö…Õ£Õ¿Õ¡Õ£Õ¸Ö€Õ®Õ¥Ö„Õ admin / admin123
        </div>
      </div>
    </div>
  );
};

export default Login;



