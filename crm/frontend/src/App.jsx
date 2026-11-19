import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Courses from './pages/Courses';
import Instructors from './pages/Instructors';
import Groups from './pages/Groups';
import Payments from './pages/Payments';
import StudentProfile from './pages/StudentProfile';
import StudentForm from './pages/StudentForm';
import Debts from './pages/Debts';
import Settings from './pages/Settings';
import Login from './pages/Login';
import { ToastProvider } from './context/ToastContext';

function App() {

  const [isAuth, setIsAuth] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem('crm_sidebar_collapsed') === 'true';
  });

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('crm_sidebar_collapsed', String(next));
      return next;
    });
  };

  useEffect(() => {
    const token = localStorage.getItem('crm_token');
    if (!token) {
      setCheckingAuth(false);
      return;
    }
    fetch('/api/auth/verify', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => {
        if (res.ok) {
          setIsAuth(true);
        } else {
          localStorage.removeItem('crm_token');
          setIsAuth(false);
        }
      })
      .catch(() => {
        setIsAuth(true);
      })
      .finally(() => {
        setCheckingAuth(false);
      });
  }, []);

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuth) {
    return (
      <ToastProvider>
        <Router basename="/academy-portal">
          <Routes>
            <Route path="*" element={<Login setAuth={setIsAuth} />} />
          </Routes>
        </Router>
      </ToastProvider>
    );
  }

  return (
    <ToastProvider>
      <Router basename="/academy-portal">
        <div className="flex min-h-screen bg-gray-50/50">
          <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
          <main className="flex-1 overflow-x-auto min-w-0">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/students" element={<Students />} />
              <Route path="/students/new" element={<StudentForm />} />
              <Route path="/students/:id/edit" element={<StudentForm />} />
              <Route path="/students/:id" element={<StudentProfile />} />
              <Route path="/debts" element={<Debts />} />
              <Route path="/courses" element={<Courses />} />
              <Route path="/instructors" element={<Instructors />} />
              <Route path="/groups" element={<Groups />} />
              <Route path="/payments" element={<Payments />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>
        </div>
      </Router>
    </ToastProvider>
  );
}

export default App;
