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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            <span className="bg-brand text-black p-1 rounded inline-block mr-2">CRM</span>
            Մուտք
          </h1>
          <p className="text-gray-500">Մուտք գործեք համակարգ</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-500 p-3 rounded-lg mb-6 text-sm text-center border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Մուտքանուն</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-md p-3 text-gray-800 focus:border-brand focus:ring-1 focus:ring-brand outline-none transition"
              placeholder="admin"
            />
          </div>
          
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Գաղտնաբառ</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-md p-3 text-gray-800 focus:border-brand focus:ring-1 focus:ring-brand outline-none transition"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-brand/90 hover:bg-brand text-black font-bold py-3 px-4 rounded-lg transition-all duration-200 mt-4 shadow-md hover:shadow-lg"
          >
            Մուտք գործել
          </button>
        </form>
        
        <div className="mt-6 text-center text-gray-400 text-sm">
          <p>Թեստային տվյալներ՝ admin / admin123</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
