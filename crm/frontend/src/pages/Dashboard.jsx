import React from 'react';

const Dashboard = () => {
  return (
    <div className="p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Ô³Õ¬Õ­Õ¡Õ¾Õ¸Ö€</h1>
        <p className="text-gray-500">Ô²Õ¡Ö€Õ« Õ£Õ¡Õ¬Õ¸Ö‚Õ½Õ¿ CRM Õ°Õ¡Õ´Õ¡Õ¯Õ¡Ö€Õ£Ö‰</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { title: 'Ô¸Õ¶Õ¤Õ°Õ¡Õ¶Õ¸Ö‚Ö€ Õ¸Ö‚Õ½Õ¡Õ¶Õ¸Õ²Õ¶Õ¥Ö€', value: '20' },
          { title: 'Ô±Õ¯Õ¿Õ«Õ¾ Õ¤Õ¡Õ½Õ¨Õ¶Õ©Õ¡ÖÕ¶Õ¥Ö€', value: '2' },
          { title: 'Ô´Õ¡Õ½Õ¡Õ­Õ¸Õ½Õ¶Õ¥Ö€', value: '2' },
          { title: 'Ô±Õ´Õ½Õ¡Õ¯Õ¡Õ¶ Õ¥Õ¯Õ¡Õ´Õ¸Ö‚Õ¿', value: '1,800,000 Ö' },
        ].map((stat, idx) => (
          <div key={idx} className="glass-panel p-6">
            <h3 className="text-gray-500 text-sm font-medium mb-1">{stat.title}</h3>
            <p className="text-3xl font-bold text-brand">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="glass-panel p-6 min-h-[400px]">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">ÕŽÕ¥Ö€Õ»Õ«Õ¶ Õ£Õ¸Ö€Õ®Õ¸Õ²Õ¸Ö‚Õ©ÕµÕ¸Ö‚Õ¶Õ¶Õ¥Ö€</h2>
        <div className="text-gray-400 flex items-center justify-center h-[300px]">
          Ô´Õ¥Õ¼Ö‡Õ½ Õ¸Õ¹Õ«Õ¶Õ¹ Õ¹Õ¯Õ¡ ÖÕ¸Ö‚ÖÕ¡Õ¤Ö€Õ¥Õ¬Õ¸Ö‚Ö‰
        </div>
      </div>
    </div>
  );
};

export default Dashboard;



