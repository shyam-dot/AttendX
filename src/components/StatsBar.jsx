import React from 'react';

function StatCard({ icon, label, value, accent, sublabel }) {
  return (
    <div className="glass-card p-4 sm:p-5 flex items-center gap-4 border border-white/5 hover:border-white/10 transition-all duration-300 group hover:translate-y-[-2px] hover:shadow-[0_10px_30px_rgba(0,0,0,0.4)] relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent pointer-events-none" />
      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-xl sm:text-2xl shadow-sm z-10"
        style={{ background: `linear-gradient(135deg, ${accent}22, ${accent}44)`, border: `1px solid ${accent}33`, color: accent }}>
        {icon}
      </div>
      <div className="flex flex-col z-10">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-0.5">{label}</p>
        <p className="text-xl sm:text-2xl font-black font-mono tracking-tight" style={{ color: accent }}>{value}</p>
        {sublabel && <p className="text-[9px] text-gray-500 font-bold uppercase mt-0.5 tracking-wider">{sublabel}</p>}
      </div>
    </div>
  );
}

export default function StatsBar({ totalStudents, presentToday, lateToday, onTimeToday, alertCount }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-5 w-full">
      <StatCard 
        icon="👨‍🎓" 
        label="Total Students" 
        value={totalStudents} 
        accent="#00e5ff" 
        sublabel="In Class"
      />
      <StatCard 
        icon="✅" 
        label="Present Today" 
        value={presentToday} 
        accent="#10b981" 
        sublabel={`${totalStudents - presentToday} Absent`}
      />
      <StatCard 
        icon="⏰" 
        label="Late Today" 
        value={lateToday} 
        accent="#fbbf24" 
        sublabel="After 8:30 AM"
      />
      <StatCard 
        icon="🟢" 
        label="On Time" 
        value={onTimeToday} 
        accent="#34d399" 
        sublabel="Before 8:30 AM"
      />
      <StatCard 
        icon="⚠️" 
        label="Alerts" 
        value={alertCount} 
        accent="#ff4444" 
        sublabel="3+ Ticks"
      />
    </div>
  );
}
