import React, { useState } from 'react';

export default function AttendanceTable({
  students, dates, ticks, checkIns, streaks, 
  onToggleTick, onCheckIn, onPayFine, onRemoveDate, getTickCount,
  alertThreshold, showHistory, onCheckInAll, allCheckedIn
}) {
  const [hoveredDate, setHoveredDate] = useState(null);
  const [confirmRemoveDate, setConfirmRemoveDate] = useState(null);
  
  // Sorting state
  const [sortConfig, setSortConfig] = useState({ column: null, direction: null });

  const handleSort = (column) => {
    let direction = 'desc';
    if (sortConfig.column === column && sortConfig.direction === 'desc') {
      direction = 'asc';
    } else if (sortConfig.column === column && sortConfig.direction === 'asc') {
      direction = null;
    }
    setSortConfig({ column: direction ? column : null, direction });
  };

  const sortedStudents = React.useMemo(() => {
    if (!sortConfig.column) return students;
    return [...students].sort((a, b) => {
      let aValue = 0, bValue = 0;
      if (sortConfig.column === 'TICKS') {
        aValue = getTickCount(a.id);
        bValue = getTickCount(b.id);
      } else if (sortConfig.column === 'STREAK') {
        aValue = streaks[a.id] || 0;
        bValue = streaks[b.id] || 0;
      }
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return a.roll.localeCompare(b.roll);
    });
  }, [students, sortConfig, getTickCount, streaks]);

  const getSortIcon = (column) => {
    if (sortConfig.column !== column) return <span className="text-gray-600">⇵</span>;
    if (sortConfig.direction === 'desc') return <span className="text-cyan-400">↓</span>;
    return <span className="text-cyan-400">↑</span>;
  };

  const todayStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' });
  const visibleDates = showHistory ? dates : dates.filter(d => d === todayStr);

  return (
    <div className="table-wrapper shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
      <div className="table-scroll">
        <table className="attendance-table">
          <thead>
            <tr>
              {/* Frozen col 1: # */}
              <th className="col-sr text-left pl-3">#</th>

              {/* Frozen col 2: Student Name */}
              <th className="col-name text-left font-black tracking-wider text-xs">STUDENT</th>

              {/* Frozen col 3: Roll Number */}
              <th className="col-roll text-left font-black tracking-wider text-xs">ROLL</th>

              {/* Check-in with Select All */}
              <th className="min-w-[120px]">
                <div className="flex flex-col items-center justify-center gap-1.5">
                  <span className="font-black tracking-wider text-xs text-cyan-400">CHECK-IN</span>
                  <label className="flex items-center gap-1.5 cursor-pointer group hover:bg-cyan-900/30 px-2 py-1 rounded-lg border border-cyan-500/10 transition-colors touch-manipulation">
                    <div className="relative flex-shrink-0">
                      <input
                        type="checkbox"
                        className="peer sr-only"
                        checked={allCheckedIn}
                        onChange={onCheckInAll}
                      />
                      <div className="w-5 h-5 rounded border-2 border-cyan-700/50 flex items-center justify-center transition-all peer-checked:bg-cyan-400 peer-checked:border-cyan-400 group-hover:border-cyan-400">
                        {allCheckedIn && (
                          <svg className="w-3 h-3 text-black" fill="none" stroke="currentColor" strokeWidth="4" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest group-hover:text-cyan-300 transition-colors hidden sm:inline">All</span>
                  </label>
                </div>
              </th>

              {/* Dynamic Date Columns */}
              {visibleDates.map(date => (
                <th
                  key={date}
                  className={`date-col-th group ${date === todayStr ? 'bg-cyan-900/10 border-b-2 border-cyan-500/30' : ''}`}
                  onMouseEnter={() => setHoveredDate(date)}
                  onMouseLeave={() => setHoveredDate(null)}
                >
                  <div className="flex flex-col items-center justify-center gap-1 h-full relative py-1">
                    <span className={`font-black text-[11px] tracking-wide leading-tight ${date === todayStr ? 'text-cyan-300' : 'text-gray-400'}`}>
                      {date}
                    </span>
                    {date === todayStr && (
                      <span className="text-[9px] text-cyan-500/70 font-bold uppercase tracking-wider">Today</span>
                    )}
                    {hoveredDate === date && dates.includes(date) && date !== todayStr && (
                      <button
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10 px-1.5 py-0.5 rounded text-[9px] uppercase font-bold tracking-widest transition-all"
                        onClick={() => setConfirmRemoveDate(date)}
                        title="Remove date"
                      >
                        ✕ Del
                      </button>
                    )}
                  </div>
                </th>
              ))}

              {/* Sortable TICKS */}
              <th
                className="cursor-pointer hover:bg-cyan-900/30 transition-colors select-none min-w-[80px]"
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
                className="cursor-pointer hover:bg-cyan-900/30 transition-colors select-none min-w-[80px]"
                onClick={() => handleSort('STREAK')}
                title="Sort by Streak"
              >
                <div className="flex flex-col items-center gap-1">
                  <span className="font-black text-xs tracking-widest">STREAK</span>
                  <div className="bg-gray-800/50 px-2 py-0.5 rounded text-[10px] shadow-inner">{getSortIcon('STREAK')}</div>
                </div>
              </th>

              <th className="min-w-[130px] font-black text-xs tracking-widest">ACTION</th>
            </tr>
          </thead>
          <tbody>
            {sortedStudents.map((student, idx) => {
              const tickCount = getTickCount(student.id);
              const isAlert = tickCount >= alertThreshold;
              const fineCalculated = Math.floor(tickCount / 3) * 25;
              const checkIn = checkIns[student.id];
              const streak = streaks[student.id] || 0;

              return (
                <tr
                  key={student.id}
                  id={`row-${student.id}`}
                  className={`${isAlert ? 'alert-row' : ''} hover:bg-gray-800/20 transition-all duration-200`}
                >
                  {/* Frozen: # */}
                  <td className="col-sr text-gray-500 text-xs pl-3 text-left font-mono">
                    {idx + 1}
                  </td>

                  {/* Frozen: Name */}
                  <td className="col-name text-left py-3">
                    <div className="flex flex-col gap-0.5">
                      <span className={`font-bold text-sm leading-tight ${isAlert ? 'text-red-400' : 'text-gray-200'}`}>
                        {student.name}
                      </span>
                      <span className="text-[10px] text-gray-500 font-black tracking-[0.1em] uppercase bg-gray-900/50 w-fit px-1.5 py-0.5 rounded border border-gray-800">
                        {student.dept}
                      </span>
                    </div>
                  </td>

                  {/* Frozen: Roll */}
                  <td className="col-roll text-left">
                    <span className="font-mono text-xs text-cyan-400 tracking-tight font-black bg-cyan-900/10 px-2 py-1 rounded border border-cyan-500/10 whitespace-nowrap">
                      {student.roll}
                    </span>
                  </td>

                  {/* Check-In */}
                  <td>
                    <div className="flex flex-col items-center justify-center gap-1.5 min-h-[50px]">
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
                          className="cursor-pointer flex items-center justify-center w-11 h-11 rounded-xl border-2 border-gray-600 transition-all peer-checked:bg-cyan-400 peer-checked:border-cyan-400 hover:border-cyan-400 hover:shadow-[0_0_10px_rgba(0,229,255,0.3)] bg-gray-900 touch-manipulation"
                          style={{ touchAction: 'manipulation' }}
                        >
                          {!!checkIn && (
                            <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" strokeWidth="3.5" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </label>
                      </div>
                      {checkIn && (
                        <span className={checkIn.isLate ? 'time-badge-late' : 'time-badge-ontime'}>
                          {checkIn.isLate ? '🟠' : '🟢'}{' '}
                          <span className="font-mono text-[9px]">{checkIn.time}</span>
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Date tick cells */}
                  {visibleDates.map(date => {
                    const isTicked = !!ticks[`${student.id}_${date}`];
                    if (!dates.includes(date)) {
                      return <td key={date} className="date-col-td text-gray-700 text-xs">—</td>;
                    }
                    return (
                      <td key={date} className={`date-col-td ${date === todayStr ? 'bg-cyan-900/5' : ''}`}>
                        <button
                          className={`tick-btn ${isTicked ? 'ticked' : ''}`}
                          onClick={() => onToggleTick(student.id, date)}
                          title={isTicked ? `Remove tick for ${date}` : `Mark tick for ${date}`}
                          style={{ touchAction: 'manipulation' }}
                        >
                          {isTicked ? <span className="text-base">✅</span> : null}
                        </button>
                      </td>
                    );
                  })}

                  {/* Ticks Badge */}
                  <td>
                    <span className={`inline-flex items-center justify-center w-9 h-9 rounded-full text-sm font-black font-mono shadow-sm ${
                      isAlert
                        ? 'bg-red-500 text-white shadow-[0_0_14px_rgba(239,68,68,0.5)] border-2 border-red-400'
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
                      <span className="streak-badge">🔥 {streak}</span>
                    ) : (
                      <span className="text-gray-700 text-xs font-black">—</span>
                    )}
                  </td>

                  {/* Action */}
                  <td>
                    {isAlert && fineCalculated > 0 ? (
                      <button
                        className="pay-fine-btn btn-danger py-2.5 px-3 text-xs font-black rounded-lg shadow-lg shadow-red-500/15 flex justify-center items-center gap-1 hover:scale-105 active:scale-95 uppercase tracking-wide w-full sm:w-auto"
                        onClick={() => onPayFine(student)}
                        style={{ touchAction: 'manipulation' }}
                      >
                        💸 Pay ₹{fineCalculated}
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
            <h3 className="text-xl font-bold text-gray-100 mb-2">Remove Date Column?</h3>
            <p className="text-gray-400 text-sm mb-6 leading-relaxed">
              Remove <span className="text-cyan-400 font-mono font-bold bg-cyan-900/30 px-2 py-1 rounded">"{confirmRemoveDate}"</span>?
              <br />All marks for this date will be permanently deleted.
            </p>
            <div className="flex gap-3 justify-end">
              <button className="btn-secondary px-5 py-2.5 text-sm font-bold uppercase tracking-wide rounded-lg" onClick={() => setConfirmRemoveDate(null)}>Cancel</button>
              <button
                className="bg-red-500 hover:bg-red-600 text-white border-none px-5 py-2.5 text-sm font-bold uppercase tracking-wide rounded-lg transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(239,68,68,0.4)]"
                onClick={() => { onRemoveDate(confirmRemoveDate); setConfirmRemoveDate(null); }}
              >
                Yes, Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
