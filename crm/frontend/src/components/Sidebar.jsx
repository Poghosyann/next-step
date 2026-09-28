import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Users, BookOpen, GraduationCap, Users2, Settings } from 'lucide-react';

const Sidebar = () => {
  const links = [
    { to: '/', label: 'Dashboard', icon: <Home size={20} /> },
    { to: '/students', label: 'Students', icon: <Users size={20} /> },
    { to: '/courses', label: 'Courses', icon: <BookOpen size={20} /> },
    { to: '/instructors', label: 'Instructors', icon: <GraduationCap size={20} /> },
    { to: '/groups', label: 'Groups', icon: <Users2 size={20} /> },
  ];

  return (
    <div className="w-64 min-h-screen glass-panel rounded-none border-y-0 border-l-0 flex flex-col">
      <div className="p-6 border-b border-white/10">
        <h1 className="text-2xl font-bold text-brand flex items-center gap-2">
          <span className="bg-brand text-black p-1 rounded">CRM</span> System
        </h1>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive 
                  ? 'bg-brand/20 text-brand border border-brand/50' 
                  : 'text-white/70 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            {link.icon}
            <span className="font-medium">{link.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-white/10">
        <button className="flex items-center gap-3 px-4 py-3 w-full text-white/70 hover:bg-white/5 hover:text-white rounded-lg transition-colors">
          <Settings size={20} />
          <span className="font-medium">Settings</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
