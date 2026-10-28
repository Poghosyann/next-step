import React, { useState, useEffect } from 'react';
import api from '../api';
import { Users, BookOpen, GraduationCap, DollarSign, Wallet, AlertCircle } from 'lucide-react';

const Dashboard = () => {
  const [stats, setStats] = useState({
    total_students: 0,
    active_students: 0,
    active_courses: 0,
    instructors: 0,
    monthly_revenue: 0,
    actual_month_revenue: 0,
    total_debt_amount: 0,
    total_debtors: 0,
    daily_trend: []
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/stats');
        setStats({
          total_students: res.data.total_students || 0,
          active_students: res.data.active_students ?? res.data.total_students ?? 0,
          active_courses: res.data.active_courses || 0,
          instructors: res.data.instructors || 0,
          monthly_revenue: res.data.monthly_revenue || 0,
          actual_month_revenue: res.data.actual_month_revenue || 0,
          total_debt_amount: res.data.total_debt_amount || 0,
          total_debtors: res.data.total_debtors || 0,
          daily_trend: Array.isArray(res.data.daily_trend) ? res.data.daily_trend : []
        });
      } catch (err) {
        console.error('Error fetching stats:', err);
      }
    };
    fetchStats();
  }, []);

  const trend = stats.daily_trend || [];
  const maxCount = Math.max(...trend.map(d => d.count || 0), 1);

  return (
    <div className="p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Գլխավոր</h1>
        <p className="text-gray-500">Բարի գալուստ CRM համակարգ։</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {[
          {
            title: 'Ընդհանուր ուսանողներ',
            value: stats.total_students,
            sub: `Ակտիվ ուսանողներ՝ ${stats.active_students}`,
            icon: <Users size={22} />,
            color: 'text-brand',
            bg: 'bg-brand/10 text-brand'
          },
          {
            title: 'Ակտիվ դասընթացներ',
            value: stats.active_courses,
            sub: 'Գործող ուղղություններ',
            icon: <BookOpen size={22} />,
            color: 'text-brand',
            bg: 'bg-brand/10 text-brand'
          },
          {
            title: 'Դասախոսներ',
            value: stats.instructors,
            sub: 'Ակտիվ դասավանդողներ',
            icon: <GraduationCap size={22} />,
            color: 'text-brand',
            bg: 'bg-brand/10 text-brand'
          },
          {
            title: 'Ակնկալվող ամսական եկամուտ',
            value: `${stats.monthly_revenue.toLocaleString()} ֏`,
            sub: 'Հաշվի առնելով զեղչերը և նվեր քարտերը',
            icon: <DollarSign size={22} />,
            color: 'text-brand',
            bg: 'bg-brand/10 text-brand'
          },
          {
            title: 'Փաստացի մուտքեր (այս ամիս)',
            value: `${stats.actual_month_revenue.toLocaleString()} ֏`,
            sub: 'Ամսվա 1-ից գրանցված վճարումներ',
            icon: <Wallet size={22} />,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50 text-emerald-600'
          },
          {
            title: 'Ընդհանուր պարտքեր',
            value: `${stats.total_debt_amount.toLocaleString()} ֏`,
            sub: `Պարտք ունեցող ուսանողներ՝ ${stats.total_debtors}`,
            icon: <AlertCircle size={22} />,
            color: stats.total_debt_amount > 0 ? 'text-red-600' : 'text-gray-700',
            bg: stats.total_debt_amount > 0 ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-500'
          },
        ].map((stat, idx) => (
          <div key={idx} className="glass-panel p-6 flex items-center justify-between">
            <div>
              <h3 className="text-gray-500 text-sm font-medium mb-1">{stat.title}</h3>
              <p className={`text-2xl sm:text-3xl font-bold ${stat.color}`}>{stat.value}</p>
              {stat.sub && <p className="text-xs text-gray-400 mt-1">{stat.sub}</p>}
            </div>
            <div className={`p-3 rounded-xl ${stat.bg}`}>
              {stat.icon}
            </div>
          </div>
        ))}
      </div>

      <div className="glass-panel p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Ուսանողների քանակի դինամիկան (վերջին 30 օր)</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Օրական բաշխվածություն՝ ըստ ակտիվ ուսանողների թվի փոփոխության
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
              <span>Աճ կամ անփոփոխ</span>
            </div>
            <div className="flex items-center gap-1.5 text-red-600 bg-red-50 border border-red-200 px-3 py-1.5 rounded-full">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block"></span>
              <span>Նվազում</span>
            </div>
          </div>
        </div>

        {trend.length === 0 ? (
          <div className="text-gray-400 flex items-center justify-center h-[300px]">
            Տվյալները բեռնվում են...
          </div>
        ) : (
          <div className="pt-6">
            <div className="h-[280px] flex items-end justify-between gap-1.5 sm:gap-2 px-2 pb-2 border-b border-gray-200">
              {trend.map((day, idx) => {
                const isDown = day.status === 'down' || day.diff < 0;
                const heightPercent = day.count > 0
                  ? Math.max(12, Math.round((day.count / maxCount) * 100))
                  : 6;
                const diffLabel = day.diff > 0 ? `+${day.diff}` : `${day.diff}`;

                return (
                  <div
                    key={day.date || idx}
                    className="flex-1 flex flex-col items-center h-full justify-end group relative"
                  >
                    {/* Hover Tooltip */}
                    <div className="opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 absolute -top-12 z-20 bg-gray-900 text-white text-[11px] rounded-lg px-2.5 py-1.5 shadow-lg whitespace-nowrap flex flex-col items-center">
                      <span className="font-bold">{day.date}</span>
                      <span>
                        Քանակ՝ <b>{day.count}</b> ({diffLabel === '0' ? 'անփոփոխ' : diffLabel})
                      </span>
                    </div>

                    {/* Value label on top of bar */}
                    <span className={`text-[10px] font-bold mb-1 transition-all ${
                      isDown ? 'text-red-600' : 'text-emerald-700'
                    }`}>
                      {day.count}
                    </span>

                    {/* Bar */}
                    <div
                      style={{ height: `${heightPercent}%` }}
                      title={`${day.date} • Ուսանողներ՝ ${day.count} (${day.diff > 0 ? `+${day.diff}` : day.diff === 0 ? 'փոփոխություն չկա' : day.diff})`}
                      className={`w-full max-w-[26px] rounded-t-md transition-all duration-300 cursor-pointer shadow-xs ${
                        isDown
                          ? 'bg-gradient-to-t from-red-600 to-red-400 hover:from-red-700 hover:to-red-500 border border-red-600/30'
                          : 'bg-gradient-to-t from-emerald-600 to-emerald-400 hover:from-emerald-700 hover:to-emerald-500 border border-emerald-600/30'
                      }`}
                    />
                  </div>
                );
              })}
            </div>

            {/* X-Axis Date Labels */}
            <div className="flex items-center justify-between gap-1.5 sm:gap-2 px-2 pt-2">
              {trend.map((day, idx) => {
                const showLabel = idx % 2 === 0 || idx === trend.length - 1;
                return (
                  <div key={day.date || idx} className="flex-1 text-center overflow-hidden">
                    <span className={`text-[10px] font-medium text-gray-500 block ${showLabel ? '' : 'hidden md:block'}`}>
                      {day.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
