import React from 'react';

const Groups = () => {
  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Groups</h1>
          <p className="text-white/60">Manage student groups and cohorts.</p>
        </div>
        <button className="glass-button">Create Group</button>
      </div>

      <div className="glass-panel p-6 text-white/50 text-center py-12">
        Groups listing will be populated here.
      </div>
    </div>
  );
};

export default Groups;
