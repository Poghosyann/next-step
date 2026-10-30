import { useState } from 'react';
import api from '../api';
import { Globe, Lock, User, ArrowRight, ShieldCheck } from 'lucide-react';

const Login = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/site-admin/login', { username, password });
      if (res.data?.token) {
        localStorage.setItem('site_admin_token', res.data.token);
        if (res.data.username) {
          localStorage.setItem('site_admin_user', res.data.username);
        }
        onLoginSuccess();
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Սխալ մուտքանուն կամ գաղտնաբառ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-950 to-black p-4">
      <div className="max-w-md w-full bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-brand/20 border-2 border-brand text-gray-900 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-brand/10">
            <Globe size={32} className="text-gray-900" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            Կայքի Admin Panel
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Մուտք գործեք հիմնական կայքի բովանդակությունը կառավարելու համար
          </p>
        </div>

        {error && (
          <div className="bg-rose-50 text-rose-700 p-3.5 rounded-xl mb-6 text-sm text-center border border-rose-200 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
              Մուտքանուն
            </label>
            <div className="relative">
              <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm text-gray-900 focus:bg-white focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none transition"
                placeholder="Մուտքանուն"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
              Գաղտնաբառ
            </label>
            <div className="relative">
              <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm text-gray-900 focus:bg-white focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none transition"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand hover:bg-[#df9e10] text-black font-extrabold py-3.5 px-4 rounded-xl transition duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2 mt-6 disabled:opacity-60 cursor-pointer"
          >
            {loading ? (
              <span>Մուտք...</span>
            ) : (
              <>
                <span>Մուտք Admin Panel</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-center gap-2 text-xs text-gray-400 font-medium">
          <ShieldCheck size={16} className="text-emerald-500" />
          <span>Առանձնացված ադմինիստրատիվ հարթակ</span>
        </div>
      </div>
    </div>
  );
};

export default Login;
