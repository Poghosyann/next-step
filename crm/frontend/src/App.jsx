import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Courses from './pages/Courses';
import Instructors from './pages/Instructors';
import Groups from './pages/Groups';
import Payments from './pages/Payments';
import StudentProfile from './pages/StudentProfile';
import Settings from './pages/Settings';
import Login from './pages/Login';

function App() {

  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('crm_token');
    if (token) {
      setIsAuth(true);
    }
  }, []);

  if (!isAuth) {
    return (
      <Router basename="/crm">
        <Routes>
          <Route path="*" element={<Login setAuth={setIsAuth} />} />
        </Routes>
      </Router>
    );
  }

  return (
    <Router basename="/crm">
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/students" element={<Students />} />
            <Route path="/students/:id" element={<StudentProfile />} />
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
  );
}

export default App;
