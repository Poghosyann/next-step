import React from 'react';

const Courses = () => {
  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Courses</h1>
          <p className="text-white/60">Manage your educational courses.</p>
        </div>
        <button className="glass-button">Create Course</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Placeholder cards */}
        {[1, 2, 3].map((i) => (
          <div key={i} className="glass-panel p-6">
            <div className="h-32 bg-white/5 rounded-lg mb-4 flex items-center justify-center">
              <span className="text-white/30">Course Image</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Sample Course {i}</h3>
            <p className="text-white/60 text-sm mb-4">A brief description of the course and its contents.</p>
            <div className="flex justify-between items-center">
              <span className="text-brand font-medium">Active</span>
              <button className="text-white/80 hover:text-white text-sm">Edit</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Courses;
