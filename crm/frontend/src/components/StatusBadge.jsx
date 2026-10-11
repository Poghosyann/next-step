import React from 'react';

export const getStatusBadgeStyle = (status) => {
  const s = (status || '').toLowerCase().trim();
  if (s.includes('նոր')) {
    return 'bg-blue-50 text-blue-700 border-blue-200';
  }
  if (s.includes('հաստատված')) {
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  }
  if (s.includes('ընթացիկ')) {
    return 'bg-amber-50 text-amber-700 border-amber-200';
  }
  if (s.includes('անորոշ')) {
    return 'bg-orange-50 text-orange-700 border-orange-200';
  }
  if (s.includes('արխիվ') || s.includes('ավարտ')) {
    return 'bg-gray-100 text-gray-500 border-gray-200';
  }
  return 'bg-gray-100 text-gray-700 border-gray-200';
};

const StatusBadge = ({ status }) => {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusBadgeStyle(status)}`}>
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-70"></span>
      {status || 'Անորոշ'}
    </span>
  );
};

export default StatusBadge;
