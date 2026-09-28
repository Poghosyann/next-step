import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Courses from './pages/Courses';
import Instructors from './pages/Instructors';
import Groups from './pages/Groups';

function App() {
  return (
    <Router basename="/crm">
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/students" element={<Students />} />
            <Route path="/courses" element={<Courses />} />
            <Route path="/instructors" element={<Instructors />} />
            <Route path="/groups" element={<Groups />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
