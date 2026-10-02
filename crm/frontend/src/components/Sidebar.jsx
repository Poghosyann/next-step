import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Users, BookOpen, GraduationCap, Users2, CreditCard, Settings } from 'lucide-react';

const Sidebar = () => {
  const links = [
    { to: '/', label: 'Գլխավոր', icon: <Home size={20} /> },
    { to: '/students', label: 'Ուսանողներ', icon: <Users size={20} /> },
    { to: '/groups', label: 'Խմբեր', icon: <Users2 size={20} /> },
    { to: '/courses', label: 'Դասընթացներ', icon: <BookOpen size={20} /> },
    { to: '/instructors', label: 'Դասախոսներ', icon: <GraduationCap size={20} /> },
    { to: '/payments', label: 'Վճարումներ', icon: <CreditCard size={20} /> },
  ];

  return (
    <div className="w-64 min-h-screen bg-white border-r border-gray-200 flex flex-col shadow-sm">
      <div className="p-6 border-b border-gray-100">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <span className="bg-brand text-black p-1 rounded">CRM</span>
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
                  ? 'bg-brand/10 text-brand border border-brand/20 font-bold' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            {link.icon}
            <span className="font-medium">{link.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <button className="flex items-center gap-3 px-4 py-3 w-full text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-colors">
          <Settings size={20} />
          <span className="font-medium">Կարգավորումներ</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
