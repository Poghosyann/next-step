import React from 'react';

const Dashboard = () => {
  return (
    <div className="p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Գլխավոր</h1>
        <p className="text-gray-500">Բարի գալուստ CRM համակարգ։</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { title: 'Ընդհանուր ուսանողներ', value: '20' },
          { title: 'Ակտիվ դասընթացներ', value: '2' },
          { title: 'Դասախոսներ', value: '2' },
          { title: 'Ամսական եկամուտ', value: '1,800,000 ֏' },
        ].map((stat, idx) => (
          <div key={idx} className="glass-panel p-6">
            <h3 className="text-gray-500 text-sm font-medium mb-1">{stat.title}</h3>
            <p className="text-3xl font-bold text-brand">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="glass-panel p-6 min-h-[400px]">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Վերջին գործողություններ</h2>
        <div className="text-gray-400 flex items-center justify-center h-[300px]">
          Դեռևս ոչինչ չկա ցուցադրելու։
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
