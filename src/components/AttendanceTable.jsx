import React, { useState } from 'react';

export default function AttendanceTable({
  students, dates, ticks, checkIns, streaks, 
  onToggleTick, onCheckIn, onPayFine, onRemoveDate, getTickCount,
  alertThreshold, showHistory, onCheckInAll, allCheckedIn
}) {
  const [hoveredDate, setHoveredDate] = useState(null);
  const [confirmRemoveDate, setConfirmRemoveDate] = useState(null);
  
  // Sorting state: { column: 'TICKS'|'STREAK'|null, direction: 'asc'|'desc' }
  const [sortConfig, setSortConfig] = useState({ column: null, direction: null });

  // Handle Sort Click
  const handleSort = (column) => {
    let direction = 'desc';
    if (sortConfig.column === column && sortConfig.direction === 'desc') {
      direction = 'asc';
    } else if (sortConfig.column === column && sortConfig.direction === 'asc') {
      direction = null;
    }
    setSortConfig({ column: direction ? column : null, direction });
  };

  // Sort function
  const sortedStudents = React.useMemo(() => {
    if (!sortConfig.column) return students;

    return [...students].sort((a, b) => {
      let aValue = 0;
      let bValue = 0;

      if (sortConfig.column === 'TICKS') {
        aValue = getTickCount(a.id);
        bValue = getTickCount(b.id);
      } else if (sortConfig.column === 'STREAK') {
        aValue = streaks[a.id] || 0;
        bValue = streaks[b.id] || 0;
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      
      // Secondary sort by roll number
      return a.roll.localeCompare(b.roll);
    });
  }, [students, sortConfig, getTickCount, streaks]);

  // UI Helper for Sort Icon
  const getSortIcon = (column) => {
    if (sortConfig.column !== column) return <span className="text-gray-600">⇵</span>;
    if (sortConfig.direction === 'desc') return <span className="text-cyan-400">↓</span>;
    return <span className="text-cyan-400">↑</span>;
  };

  const todayStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' });
  const visibleDates = showHistory ? dates : [todayStr]; 

  return (
    <div className="table-wrapper border border-gray-800/80 shadow-[0_4px_30px_rgba(0,0,0,0.5)] rounded-2xl overflow-hidden">
      <div className="overflow-x-auto w-full">
        <table className="attendance-table w-full border-separate border-spacing-0">
          <thead>
            <tr>
              <th className="text-left pl-6 sticky left-0 z-20 w-12 border-r border-white/5 shadow-[5px_0_15px_rgba(0,0,0,0.3)]" style={{ background: '#0f1923' }}>#</th>
              <th className="text-left sticky left-12 z-20 font-black tracking-wider text-xs border-r border-white/5 shadow-[5px_0_15px_rgba(0,0,0,0.3)]" style={{ background: '#0f1923', minWidth: 200 }}>STUDENT</th>
              <th className="text-left min-w-[140px] font-black tracking-wider text-xs">ROLL NUMBER</th>
              <th className="min-w-[140px]">
                <div className="flex flex-col items-center justify-center gap-2">
                  <span className="font-black tracking-wider text-xs text-cyan-400">CHECK-IN</span>
                  {/* Select All Checkbox */}
                  <label className="flex items-center gap-2 cursor-pointer group hover:bg-cyan-900/30 px-3 py-1.5 rounded-lg border border-cyan-500/10 transition-colors">
                    <div className="relative">
                      <input
                        type="checkbox"
                        className="peer sr-only"
                        checked={allCheckedIn}
                        onChange={onCheckInAll}
                      />
                      <div className="w-4 h-4 rounded border-2 border-cyan-700/50 flex items-center justify-center transition-all peer-checked:bg-cyan-400 peer-checked:border-cyan-400 group-hover:border-cyan-400">
                        {allCheckedIn && (
                          <svg className="w-2.5 h-2.5 text-black" fill="none" stroke="currentColor" strokeWidth="4" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        )}
                      </div>
                    </div>
                    <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest group-hover:text-cyan-300 transition-colors hidden sm:inline">Select All</span>
                  </label>
                </div>
              </th>
              
              {/* Dynamic Date Columns */}
              {visibleDates.map(date => (
                <th
                  key={date}
                  className={`min-w-[100px] group ${date === todayStr && !showHistory ? 'bg-cyan-900/10 border-b border-cyan-500/20' : ''}`}
                  onMouseEnter={() => setHoveredDate(date)}
                  onMouseLeave={() => setHoveredDate(null)}
                >
                  <div className="flex flex-col items-center justify-center gap-1.5 h-full min-h-[50px]">
                    <span className={`font-black text-[11px] tracking-wide ${date === todayStr ? 'text-cyan-300' : 'text-gray-400'}`}>
                      {date} {date === todayStr && <span className="text-[10px] text-cyan-500 block text-center">(Today)</span>}
                    </span>
                    {hoveredDate === date && dates.includes(date) && (
                      <button
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-widest transition-all absolute top-1"
                        onClick={() => setConfirmRemoveDate(date)}
                        title="Remove date"
                      >
                        ✕ Remove
                      </button>
                    )}
                  </div>
                </th>
              ))}
              
              {/* Sortable TICKS */}
              <th 
                className="cursor-pointer hover:bg-cyan-900/30 transition-colors select-none min-w-[100px]"
                onClick={() => handleSort('TICKS')}
                title="Sort by Ticks"
              >
                <div className="flex flex-col items-center gap-1">
                  <span className="font-black text-xs tracking-widest">TICKS</span>
                  <div className="bg-gray-800/50 px-2 py-0.5 rounded text-[10px] shadow-inner">{getSortIcon('TICKS')}</div>
                </div>
              </th>
              {/* Sortable STREAK */}
              <th 
                className="cursor-pointer hover:bg-cyan-900/30 transition-colors select-none min-w-[100px]"
                onClick={() => handleSort('STREAK')}
                title="Sort by Streak"
              >
                <div className="flex flex-col items-center gap-1">
                  <span className="font-black text-xs tracking-widest">STREAK</span>
                  <div className="bg-gray-800/50 px-2 py-0.5 rounded text-[10px] shadow-inner">{getSortIcon('STREAK')}</div>
                </div>
              </th>
              <th className="min-w-[140px] font-black text-xs tracking-widest">ACTION</th>
            </tr>
          </thead>
          <tbody>
            {sortedStudents.map((student, idx) => {
              const tickCount = getTickCount(student.id);
              const isAlert = tickCount >= alertThreshold;
              const fineCalculated = Math.floor(tickCount / 3) * 25; // 3 ticks = ₹25, 6 = ₹50, etc.

              const checkIn = checkIns[student.id];
              const streak = streaks[student.id] || 0;

              return (
                <tr
                  key={student.id}
                  id={`row-${student.id}`}
                  className={`${isAlert ? 'alert-row font-medium bg-red-950/20' : ''} hover:bg-gray-800/20 transition-all duration-200 border-b border-gray-800/30`}
                >
                  {/* ID */}
                  <td className="text-gray-500 text-xs pl-6 text-left font-mono sticky left-0 z-10 border-r border-white/5 shadow-[5px_0_15px_rgba(0,0,0,0.3)]" style={{ background: '#0d1117' }}>
                    {idx + 1}
                  </td>

                  {/* Name & Dept */}
                  <td className="text-left py-3.5 sticky left-12 z-10 border-r border-white/5 shadow-[5px_0_15px_rgba(0,0,0,0.3)]" style={{ background: '#0d1117' }}>
                    <div className="flex flex-col gap-1">
                      <span className={`font-bold text-sm tracking-wide ${isAlert ? 'text-red-400' : 'text-gray-200'}`}>
                        {student.name}
                      </span>
                      <span className="text-[10px] text-gray-500 font-black tracking-[0.1em] uppercase bg-gray-900/50 w-fit px-1.5 py-0.5 rounded border border-gray-800">
                        {student.dept}
                      </span>
                    </div>
                  </td>

                  {/* Roll Number */}
                  <td className="text-left">
                    <span className="font-mono text-xs text-cyan-400 tracking-tight font-black bg-cyan-900/10 px-2 py-1 rounded border border-cyan-500/10">
                      {student.roll}
                    </span>
                  </td>

                  {/* Check-In */}
                  <td>
                    <div className="flex flex-col items-center justify-center gap-2 min-h-[50px]">
                      <div className="relative">
                        <input
                          type="checkbox"
                          className="peer sr-only"
                          checked={!!checkIn}
                          onChange={(e) => onCheckIn(student.id, e.target.checked)}
                          id={`check-${student.id}`}
                        />
                        <label 
                          htmlFor={`check-${student.id}`} 
                          className="cursor-pointer flex items-center justify-center w-6 h-6 rounded-md border-2 border-gray-600 transition-all peer-checked:bg-cyan-400 peer-checked:border-cyan-400 hover:border-cyan-400 hover:shadow-[0_0_10px_rgba(0,229,255,0.3)] bg-gray-900"
                        >
                          {!!checkIn && (
                            <svg className="w-3.5 h-3.5 text-black" fill="none" stroke="currentColor" strokeWidth="4" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </label>
                      </div>
                      {checkIn && (
                        <span className={checkIn.isLate ? 'time-badge-late scale-90 origin-top shadow-sm' : 'time-badge-ontime scale-90 origin-top shadow-sm'}>
                          {checkIn.isLate ? '🟠 LATE' : '🟢 ON TIME'} 
                          <span className="opacity-80 ml-1 font-mono tracking-tighter text-[10px] font-black">{checkIn.time}</span>
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Dates (Ticks) */}
                  {visibleDates.map(date => {
                    const isTicked = !!ticks[`${student.id}_${date}`];
                    // If the date exists in `dates`, render toggle. Else, show placeholder because date column exists but maybe not recorded properly (shouldn't happen with our logic)
                    if (!dates.includes(date)) {
                       return <td key={date} className="text-gray-700 text-xs">—</td>;
                    }
                    return (
                      <td key={date} className={`${date === todayStr && !showHistory ? 'bg-cyan-900/5' : ''}`}>
                        <button
                          className={`tick-btn w-10 h-10 ${isTicked ? 'ticked bg-red-500/10 border-red-500/50 hover:bg-red-500/20' : 'hover:border-red-400/50 hover:bg-red-500/5'} border-2 transition-all`}
                          onClick={() => onToggleTick(student.id, date)}
                          title={isTicked ? `Remove tick for ${date}` : `Mark tick for ${date}`}
                        >
                          {isTicked ? <span className="text-sm shadow-sm opacity-100">✅</span> : ''}
                        </button>
                      </td>
                    );
                  })}

                  {/* Ticks Badge */}
                  <td>
                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-black font-mono shadow-sm ${
                      isAlert
                        ? 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)] border-2 border-red-400'
                        : tickCount > 0
                        ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
                        : 'bg-gray-800 text-gray-500 border border-gray-700'
                    }`}>
                      {tickCount}
                    </span>
                  </td>

                  {/* Streak */}
                  <td>
                    {streak >= 1 && tickCount === 0 ? (
                      <span className="streak-badge animate-fadeIn px-3 py-1 text-sm shadow-[0_0_10px_rgba(251,146,60,0.2)] bg-orange-500/10 border-orange-500/30">🔥 {streak}</span>
                    ) : (
                      <span className="text-gray-700 text-xs font-black">—</span>
                    )}
                  </td>

                  {/* Action Column */}
                  <td>
                    {isAlert && fineCalculated > 0 ? (
                      <button
                        className="btn-danger w-[120px] py-2 text-xs font-black rounded-lg shadow-lg shadow-red-500/20 mx-auto flex justify-center items-center gap-1.5 hover:scale-105 active:scale-95 uppercase tracking-wide border border-red-500/50 bg-red-500/10"
                        onClick={() => onPayFine(student)}
                      >
                        Pay Fine ₹{fineCalculated}
                      </button>
                    ) : (
                      <span className="text-gray-700 text-xs font-black">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Confirm remove date modal */}
      {confirmRemoveDate && (
        <div className="modal-overlay" onClick={() => setConfirmRemoveDate(null)}>
          <div className="modal-box glass-card p-6 border-red-500/30" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-gray-100 mb-2 font-sora">Remove Date Column?</h3>
            <p className="text-gray-400 text-sm mb-6 leading-relaxed">
              Are you sure you want to remove <span className="text-cyan-400 font-mono font-bold bg-cyan-900/30 px-2 py-1 rounded">"{confirmRemoveDate}"</span>? 
              <br/>All attendance marks for this date will be permanently deleted for all students.
            </p>
            <div className="flex gap-3 justify-end">
              <button className="btn-secondary px-6 py-2.5 text-sm font-bold uppercase tracking-wide rounded-lg" onClick={() => setConfirmRemoveDate(null)}>Cancel</button>
              <button className="bg-red-500 hover:bg-red-600 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)] border-none px-6 py-2.5 text-sm font-bold uppercase tracking-wide rounded-lg transition-all hover:scale-105 active:scale-95" onClick={() => { onRemoveDate(confirmRemoveDate); setConfirmRemoveDate(null); }}>
                Yes, Remove Date
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
