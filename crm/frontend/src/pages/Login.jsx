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
      setError('Սխալ մուտքանուն կամ գաղտնաբառ');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
      <div className="bg-[#1a1a1a] p-8 rounded-xl border border-white/10 w-full max-w-md shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-brand mb-2">Next-Step CRM</h1>
          <p className="text-white/60">Մուտքագրեք ձեր տվյալները համակարգ մտնելու համար</p>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-400 p-3 rounded mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">Մուտքանուն</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-md p-3 text-white focus:border-brand outline-none"
              placeholder="admin"
              required 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">Գաղտնաբառ</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-md p-3 text-white focus:border-brand outline-none"
              placeholder="••••••••"
              required 
            />
          </div>
          <button 
            type="submit" 
            className="w-full bg-brand hover:bg-brand/90 text-black font-bold py-3 px-4 rounded-md transition-colors"
          >
            Մուտք Գործել
          </button>
        </form>
        
        <div className="mt-6 text-center text-xs text-white/40">
          Թեստավորման համար օգտագործեք՝ admin / admin123
        </div>
      </div>
    </div>
  );
};

export default Login;
