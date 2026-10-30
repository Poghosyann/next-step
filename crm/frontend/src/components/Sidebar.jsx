import { NavLink } from 'react-router-dom';
import { Home, Users, BookOpen, GraduationCap, Users2, CreditCard, Settings, AlertCircle, ChevronLeft, ChevronRight, Globe } from 'lucide-react';

const Sidebar = ({ isCollapsed, toggleSidebar }) => {
  const links = [
    { to: '/', label: 'Գլխավոր', icon: <Home size={20} /> },
    { to: '/students', label: 'Ուսանողներ', icon: <Users size={20} /> },
    { to: '/groups', label: 'Խմբեր', icon: <Users2 size={20} /> },
    { to: '/debts', label: 'Պարտքեր', icon: <AlertCircle size={20} className="text-red-500" /> },
    { to: '/courses', label: 'Դասընթացներ', icon: <BookOpen size={20} /> },
    { to: '/instructors', label: 'Դասախոսներ', icon: <GraduationCap size={20} /> },
    { to: '/payments', label: 'Վճարումներ', icon: <CreditCard size={20} /> },
    { to: '/site', label: 'Կայքի կառավարում', icon: <Globe size={20} /> },
  ];

  return (
    <aside className={`${isCollapsed ? 'w-20' : 'w-64'} min-h-screen bg-white border-r border-gray-200 flex flex-col shadow-sm transition-all duration-300 flex-shrink-0 select-none`}>
      <div className={`p-4 border-b border-gray-100 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
        {!isCollapsed && (
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <span className="bg-brand text-black px-2 py-0.5 rounded font-black tracking-wider text-xl">CRM</span>
          </h1>
        )}
        <button
          type="button"
          onClick={toggleSidebar}
          className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition flex items-center justify-center"
          title={isCollapsed ? "Բացել կողային վահանակը" : "Ծալել կողային վահանակը"}
        >
          {isCollapsed ? <ChevronRight size={20} className="text-gray-600" /> : <ChevronLeft size={20} />}
        </button>
      </div>
      
      <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            title={isCollapsed ? link.label : undefined}
            className={({ isActive }) =>
              `flex items-center ${isCollapsed ? 'justify-center px-2 py-3' : 'gap-3 px-3.5 py-2.5'} rounded-xl transition-all duration-200 ${
                isActive 
                  ? 'bg-brand/15 text-brand border border-brand/30 font-bold shadow-xs' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border border-transparent'
              }`
            }
          >
            <div className="flex-shrink-0">{link.icon}</div>
            {!isCollapsed && <span className="font-medium whitespace-nowrap text-sm">{link.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-gray-100">
        <NavLink
          to="/settings"
          title={isCollapsed ? "Կարգավորումներ" : undefined}
          className={({ isActive }) =>
            `flex items-center ${isCollapsed ? 'justify-center px-2 py-3' : 'gap-3 px-3.5 py-2.5'} rounded-xl transition-all duration-200 ${
              isActive 
                ? 'bg-brand/15 text-brand border border-brand/30 font-bold' 
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border border-transparent'
            }`
          }
        >
          <div className="flex-shrink-0"><Settings size={20} /></div>
          {!isCollapsed && <span className="font-medium whitespace-nowrap text-sm">Կարգավորումներ</span>}
        </NavLink>
      </div>
    </aside>
  );
};

export default Sidebar;
