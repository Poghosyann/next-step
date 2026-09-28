import React from 'react';

const Dashboard = () => {
  return (
    <div className="p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-white/60">Welcome to the CRM overview.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { title: 'Total Students', value: '1,248' },
          { title: 'Active Courses', value: '42' },
          { title: 'Instructors', value: '18' },
          { title: 'Revenue', value: '$45,200' },
        ].map((stat, idx) => (
          <div key={idx} className="glass-panel p-6">
            <h3 className="text-white/60 text-sm font-medium mb-1">{stat.title}</h3>
            <p className="text-3xl font-bold text-brand">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="glass-panel p-6 min-h-[400px]">
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        <div className="text-white/50 flex items-center justify-center h-[300px]">
          No recent activity to display.
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
