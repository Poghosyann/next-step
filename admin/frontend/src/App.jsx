import { useState, useEffect } from 'react';
import Login from './pages/Login';
import SiteEditor from './pages/SiteEditor';
import { ToastProvider } from './context/ToastContext';

function App() {
  const [isAuth, setIsAuth] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('site_admin_token');
    if (token) {
      setIsAuth(true);
    }
    setChecking(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('site_admin_token');
    localStorage.removeItem('site_admin_user');
    setIsAuth(false);
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <ToastProvider>
      {!isAuth ? (
        <Login onLoginSuccess={() => setIsAuth(true)} />
      ) : (
        <SiteEditor onLogout={handleLogout} />
      )}
    </ToastProvider>
  );
}

export default App;
