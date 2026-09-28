import React from 'react';

const Instructors = () => {
  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Instructors</h1>
          <p className="text-white/60">Manage your teaching staff.</p>
        </div>
        <button className="glass-button">Add Instructor</button>
      </div>

      <div className="glass-panel p-6 text-white/50 text-center py-12">
        Instructor directory will be displayed here.
      </div>
    </div>
  );
};

export default Instructors;
