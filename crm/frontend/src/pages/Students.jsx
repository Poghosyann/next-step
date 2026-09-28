import React from 'react';

const Students = () => {
  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Students</h1>
          <p className="text-white/60">Manage your students.</p>
        </div>
        <button className="glass-button">Add Student</button>
      </div>

      <div className="glass-panel overflow-hidden">
        <div className="p-4 border-b border-white/10">
          <input 
            type="text" 
            placeholder="Search students..." 
            className="glass-input w-full max-w-md"
          />
        </div>
        <div className="p-6 text-white/50 text-center py-12">
          Student list will be loaded here.
        </div>
      </div>
    </div>
  );
};

export default Students;
