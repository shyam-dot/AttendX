import React, { useState, useMemo } from 'react';

const DATES_PER_PAGE = 5;

// ─────────────────────────────────────────────────────────────────────────────
export default function AttendanceTable({
  students, allStudents, dates, selectedDate,
  ticks, checkIns, streaks,
  onToggleTick, onCheckIn, onCheckInAllForDate,
  onPayFine, onRemoveDate,
  getLateCount, alertThreshold, showHistory, todayStr,
}) {
  const [confirmRemoveDate, setConfirmRemoveDate] = useState(null);
  const [sortConfig, setSortConfig]               = useState({ column: null, direction: null });
  const [historyFilter, setHistoryFilter]         = useState('all');
  const [histPage, setHistPage]                   = useState(0);

  // ── Sort helpers ─────────────────────────────────────────────────────────
  const handleSort = col => {
    setSortConfig(prev => {
      if (col === 'STUDENT') {
        if (prev.column !== 'STUDENT') return { column: 'STUDENT', direction: 'present' };
        if (prev.direction === 'present') return { column: 'STUDENT', direction: 'absent' };
        return { column: null, direction: null };
      }
      if (prev.column !== col) return { column: col, direction: 'desc' };
      if (prev.direction === 'desc') return { column: col, direction: 'asc' };
      return { column: null, direction: null };
    });
  };

  const sortedStudents = useMemo(() => {
    if (!sortConfig.column) return students;
    return [...students].sort((a, b) => {
      if (sortConfig.column === 'STUDENT') {
        const aP = checkIns[`${a.id}_${selectedDate}`] ? 1 : 0;
        const bP = checkIns[`${b.id}_${selectedDate}`] ? 1 : 0;
        if (aP !== bP) return sortConfig.direction === 'present' ? bP - aP : aP - bP;
        return a.roll.localeCompare(b.roll);
      }
      let av = 0, bv = 0;
      if (sortConfig.column === 'LATE_COUNT') { av = getLateCount(a.id); bv = getLateCount(b.id); }
      else if (sortConfig.column === 'STREAK') { av = streaks[a.id] || 0; bv = streaks[b.id] || 0; }
      if (av !== bv) return sortConfig.direction === 'asc' ? av - bv : bv - av;
      return a.roll.localeCompare(b.roll);
    });
  }, [students, sortConfig, getLateCount, streaks, checkIns, selectedDate]);

  const studentSortIcon = () => {
    if (sortConfig.column !== 'STUDENT') return <span className="text-gray-600 text-[10px]">⇵</span>;
    return sortConfig.direction === 'present'
      ? <span className="text-green-400 text-[10px]">↑P</span>
      : <span className="text-red-400 text-[10px]">↑A</span>;
  };
  const sortIcon = col => {
    if (sortConfig.column !== col) return <span className="text-gray-600">⇵</span>;
    return sortConfig.direction === 'desc' ? <span className="text-cyan-400">↓</span> : <span className="text-cyan-400">↑</span>;
  };

  // ── Paginated dates for history ───────────────────────────────────────────
  const totalHistDatePages = Math.ceil(dates.length / DATES_PER_PAGE);
  const safeHistPage       = Math.min(histPage, Math.max(0, totalHistDatePages - 1));
  const histDates          = dates.slice(safeHistPage * DATES_PER_PAGE, (safeHistPage + 1) * DATES_PER_PAGE);

  // ══════════════════════════════════════════════════════════════════════════
  // HISTORY VIEW — student-first, one row per student, date pills
  // ══════════════════════════════════════════════════════════════════════════
  if (showHistory) {
    return (
      <div className="space-y-3">
        {/* Filter bar */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-black text-gray-500 uppercase tracking-widest">Filter:</span>
          {[
            { key: 'all',     emoji: '🗂',  label: 'All'     },
            { key: 'present', emoji: '🟢',  label: 'Present' },
            { key: 'absent',  emoji: '🔴',  label: 'Absent'  },
            { key: 'late',    emoji: '🟠',  label: 'Late'    },
            { key: 'ontime',  emoji: '🟢',  label: 'On Time' },
          ].map(({ key, emoji, label }) => (
            <button
              key={key}
              onClick={() => { setHistoryFilter(key); setHistPage(0); }}
              className={`px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider border transition-all ${
                historyFilter === key
                  ? 'bg-cyan-400/20 text-cyan-300 border-cyan-400/60 shadow-[0_0_8px_rgba(0,229,255,0.2)]'
                  : 'bg-gray-800/50 text-gray-500 border-gray-700/50 hover:border-gray-600 hover:text-gray-300'
              }`}
            >
              {emoji} {label}
            </button>
          ))}
          <span className="ml-auto text-xs text-gray-600 font-mono">{students.length} students · {histDates.length}/{dates.length} dates shown</span>
        </div>

        {/* Date page nav */}
        {totalHistDatePages > 1 && (
          <div className="flex items-center justify-center gap-4 py-1">
            <button className="btn-secondary px-3 py-1.5 text-xs font-black rounded-lg disabled:opacity-30 disabled:cursor-not-allowed" onClick={() => setHistPage(p => Math.max(0, p - 1))} disabled={safeHistPage === 0}>← Prev</button>
            <span className="text-xs font-black text-gray-400">
              Page <span className="text-cyan-400">{safeHistPage + 1}</span> of <span className="text-cyan-400">{totalHistDatePages}</span> <span className="text-gray-600">(dates)</span>
            </span>
            <button className="btn-secondary px-3 py-1.5 text-xs font-black rounded-lg disabled:opacity-30 disabled:cursor-not-allowed" onClick={() => setHistPage(p => Math.min(totalHistDatePages - 1, p + 1))} disabled={safeHistPage === totalHistDatePages - 1}>Next →</button>
          </div>
        )}

        {/* Student cards */}
        <div className="space-y-2">
          {students.map((student, idx) => {
            const lateCount = getLateCount(student.id);
            const isAlert   = lateCount >= alertThreshold;

            // Compute per-date info across ALL dates (not just histDates — for summary)
            const allDateInfo = dates.map(d => {
              const isPresent  = !!checkIns[`${student.id}_${d}`];
              const tick       = ticks[`${student.id}_${d}`];
              const hasArrival = !!tick;
              const isLate     = hasArrival && tick.isLate;
              const isOnTime   = isPresent && hasArrival && !tick.isLate;
              return { date: d, isPresent, tick, hasArrival, isLate, isOnTime };
            });

            const presentCount = allDateInfo.filter(x => x.isPresent).length;
            const absentCount  = allDateInfo.filter(x => !x.isPresent).length;
            const lateCountAll = allDateInfo.filter(x => x.isLate).length;
            const onTimeCount  = allDateInfo.filter(x => x.isOnTime).length;

            // Left border color
            const borderColor = lateCount >= alertThreshold
              ? 'border-l-red-500'
              : lateCount > 0
              ? 'border-l-orange-400'
              : presentCount >= absentCount
              ? 'border-l-green-500'
              : 'border-l-red-400';

            // Pill data for current page of dates only
            const pageInfo = histDates.map(d => {
              const isPresent  = !!checkIns[`${student.id}_${d}`];
              const tick       = ticks[`${student.id}_${d}`];
              const hasArrival = !!tick;
              const isLate     = hasArrival && tick.isLate;
              const isOnTime   = isPresent && hasArrival && !tick.isLate;
              return { date: d, isPresent, tick, hasArrival, isLate, isOnTime };
            });

            // Render pill content per filter
            const renderPills = () => {
              if (historyFilter === 'all') {
                return pageInfo.map(({ date, isPresent, tick, hasArrival, isLate }) => (
                  <span key={date} className={`inline-flex flex-col items-center px-2 py-1 rounded-lg text-[9px] font-black border gap-0.5 ${
                    isPresent
                      ? isLate
                        ? 'bg-orange-500/10 text-orange-400 border-orange-500/30'
                        : 'bg-green-500/10 text-green-400 border-green-500/30'
                      : 'bg-red-500/10 text-red-400 border-red-500/30'
                  }`}>
                    <span className="font-mono">{date}</span>
                    <span>{isPresent ? (isLate ? '🟠 Late' : hasArrival ? '🟢 On Time' : '✅ Present') : '🔴 Absent'}</span>
                    {hasArrival && <span className="text-[8px] opacity-80">{tick.time}</span>}
                  </span>
                ));
              }

              if (historyFilter === 'present') {
                return pageInfo.map(({ date, isPresent, tick, hasArrival, isLate }) => (
                  <span key={date} className={`inline-flex flex-col items-center px-2 py-1 rounded-lg text-[9px] font-black border gap-0.5 ${
                    isPresent
                      ? 'bg-green-500/10 text-green-400 border-green-500/30'
                      : 'bg-gray-800/30 text-gray-700 border-gray-800'
                  }`}>
                    <span className="font-mono">{date}</span>
                    <span>{isPresent ? '🟢 Present' : '—'}</span>
                  </span>
                ));
              }

              if (historyFilter === 'absent') {
                const absentDates = pageInfo.filter(x => !x.isPresent);
                if (absentDates.length === 0) {
                  return <span className="text-green-400 text-xs font-black">✅ No absences this page</span>;
                }
                return absentDates.map(({ date }) => (
                  <span key={date} className="inline-flex items-center px-2 py-1 rounded-lg text-[9px] font-black bg-red-500/12 text-red-400 border border-red-500/30">
                    🔴 {date}
                  </span>
                ));
              }

              if (historyFilter === 'late') {
                const lateDates = pageInfo.filter(x => x.isLate);
                if (lateDates.length === 0) {
                  return <span className="text-green-400 text-xs font-black">✅ Always on time this page</span>;
                }
                return lateDates.map(({ date, tick }) => (
                  <span key={date} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-black bg-orange-500/12 text-orange-400 border border-orange-500/30">
                    🟠 {date} {tick.time}
                  </span>
                ));
              }

              if (historyFilter === 'ontime') {
                const onTimeDates = pageInfo.filter(x => x.isOnTime);
                if (onTimeDates.length === 0) {
                  return <span className="text-gray-600 text-xs font-black">— No on-time arrivals this page</span>;
                }
                return onTimeDates.map(({ date }) => (
                  <span key={date} className="inline-flex items-center px-2 py-1 rounded-lg text-[9px] font-black bg-green-500/12 text-green-400 border border-green-500/30">
                    🟢 {date}
                  </span>
                ));
              }

              return null;
            };

            return (
              <div
                key={student.id}
                className={`bg-gray-900/60 border border-gray-800 border-l-4 ${borderColor} rounded-xl p-4 transition-all hover:bg-gray-900/80 hover:border-gray-700${isAlert ? ' shadow-[0_0_12px_rgba(239,68,68,0.12)]' : ''}`}
              >
                {/* Student header */}
                <div className="flex items-start gap-3 mb-2">
                  <span className="text-gray-600 text-xs font-mono w-5 flex-shrink-0 mt-1">{idx + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className={`font-bold text-sm ${isAlert ? 'text-red-400' : 'text-gray-100'}`}>{student.name}</span>
                      <span className="font-mono text-xs text-cyan-400 font-black bg-cyan-900/10 px-2 py-0.5 rounded border border-cyan-500/10">{student.roll}</span>
                      <span className="text-[9px] text-gray-600 font-black tracking-widest uppercase bg-gray-900/50 px-1.5 py-0.5 rounded border border-gray-800">{student.dept}</span>
                    </div>
                    {/* Summary line */}
                    <div className="flex items-center gap-3 flex-wrap text-[9px] font-black tracking-wider">
                      <span className="text-green-400">Present: {presentCount}</span>
                      <span className="text-red-400">Absent: {absentCount}</span>
                      <span className="text-orange-400">Late: {lateCountAll}</span>
                      <span className="text-teal-400">On Time: {onTimeCount}</span>
                      <span className="text-gray-600">/ {dates.length} days</span>
                    </div>
                  </div>
                  {/* Late count badge */}
                  {lateCount > 0 && (
                    <span className={`flex-shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-black font-mono ${
                      lateCount >= alertThreshold
                        ? 'bg-red-500 text-white shadow-[0_0_12px_rgba(239,68,68,0.5)] border-2 border-red-400'
                        : 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
                    }`}>{lateCount}</span>
                  )}
                </div>

                {/* Date pills */}
                <div className="flex flex-wrap gap-1.5 pl-8">
                  {renderPills()}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // NORMAL VIEW — single date pair (CHECK-IN + ARRIVAL for selectedDate only)
  // ══════════════════════════════════════════════════════════════════════════
  const allCheckedForDate = (allStudents || students).every(s => checkIns[`${s.id}_${selectedDate}`]);
  const isToday = selectedDate === todayStr;

  return (
    <div className="space-y-3">
      <div className="table-wrapper shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
        <div className="table-scroll">
          <table className="attendance-table">
            <thead>
              {/* Row 1: group header */}
              <tr className="date-group-row">
                <th className="col-sr border-b border-gray-800/60" rowSpan={2}>#</th>
                <th
                  className="col-name text-left font-black tracking-wider text-xs cursor-pointer hover:bg-cyan-900/20 select-none border-b border-gray-800/60"
                  rowSpan={2}
                  onClick={() => handleSort('STUDENT')}
                  title="Sort by today's attendance"
                >
                  <div className="flex items-center gap-1">STUDENT {studentSortIcon()}</div>
                </th>
                <th className="col-roll text-left font-black tracking-wider text-xs border-b border-gray-800/60" rowSpan={2}>ROLL</th>

                {/* Date group header — spans 2 (CHECK-IN + ARRIVAL) */}
                <th
                  colSpan={2}
                  className={`date-group-header ${isToday ? 'today-group' : ''}`}
                >
                  <div className="flex items-center justify-center gap-3 py-0.5 group relative">
                    <div className="flex flex-col items-center">
                      <span className={`font-black text-[12px] tracking-wide ${isToday ? 'text-cyan-300' : 'text-gray-300'}`}>
                        {selectedDate}
                      </span>
                      {isToday && <span className="text-[8px] text-cyan-500/70 font-bold uppercase tracking-wider">Today</span>}
                    </div>
                    {/* Del button for non-today */}
                    {!isToday && (
                      <button
                        className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 hover:bg-red-500/10 px-1.5 py-0.5 rounded text-[8px] uppercase font-bold tracking-widest transition-all ml-2"
                        onClick={() => setConfirmRemoveDate(selectedDate)}
                        title="Remove this date"
                      >
                        ✕ Del
                      </button>
                    )}
                  </div>
                </th>

                <th className="cursor-pointer hover:bg-cyan-900/30 transition-colors select-none min-w-[72px] border-b border-gray-800/60" rowSpan={2} onClick={() => handleSort('LATE_COUNT')} title="Sort by Late Count">
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="font-black text-[9px] tracking-widest">LATE</span>
                    <span className="font-black text-[9px] tracking-widest">COUNT</span>
                    <div className="bg-gray-800/50 px-1.5 py-0.5 rounded text-[9px]">{sortIcon('LATE_COUNT')}</div>
                  </div>
                </th>
                <th className="cursor-pointer hover:bg-cyan-900/30 transition-colors select-none min-w-[72px] border-b border-gray-800/60" rowSpan={2} onClick={() => handleSort('STREAK')} title="Sort by Streak">
                  <div className="flex flex-col items-center gap-1">
                    <span className="font-black text-[9px] tracking-widest">STREAK</span>
                    <div className="bg-gray-800/50 px-1.5 py-0.5 rounded text-[9px]">{sortIcon('STREAK')}</div>
                  </div>
                </th>
                <th className="min-w-[120px] font-black text-xs tracking-widest border-b border-gray-800/60" rowSpan={2}>ACTION</th>
              </tr>

              {/* Row 2: CHECK-IN + ARRIVAL sub-headers */}
              <tr>
                {/* CHECK-IN sub-header */}
                <th className={`date-sub-th check-in-sub ${isToday ? 'bg-cyan-900/10' : ''}`}>
                  <div className="flex flex-col items-center gap-1">
                    <span className="font-black text-[9px] text-cyan-400 tracking-widest">CHECK-IN</span>
                    <label className="flex items-center gap-1 cursor-pointer group hover:bg-cyan-900/30 px-1.5 py-0.5 rounded border border-cyan-500/10 transition-colors touch-manipulation" title={`${allCheckedForDate ? 'Clear' : 'Check'} all for ${selectedDate}`}>
                      <div className="relative flex-shrink-0">
                        <input type="checkbox" className="peer sr-only" checked={allCheckedForDate} onChange={() => onCheckInAllForDate(selectedDate)} />
                        <div className="w-4 h-4 rounded border-2 border-cyan-700/50 flex items-center justify-center transition-all peer-checked:bg-cyan-400 peer-checked:border-cyan-400 group-hover:border-cyan-400">
                          {allCheckedForDate && (
                            <svg className="w-2.5 h-2.5 text-black" fill="none" stroke="currentColor" strokeWidth="4" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </div>
                      <span className="text-[8px] font-bold text-gray-600 group-hover:text-cyan-300">All</span>
                    </label>
                  </div>
                </th>
                {/* ARRIVAL sub-header */}
                <th className={`date-sub-th arrival-sub ${isToday ? 'bg-cyan-900/10' : ''}`}>
                  <span className="font-black text-[9px] text-gray-500 tracking-widest">ARRIVAL</span>
                </th>
              </tr>
            </thead>

            <tbody>
              {sortedStudents.map((student, idx) => {
                const key          = `${student.id}_${selectedDate}`;
                const isPresent    = !!checkIns[key];
                const tick         = ticks[key];
                const hasArrival   = !!tick;
                const isLateCircle = hasArrival && tick.isLate;
                const lateCount    = getLateCount(student.id);
                const isAlert      = lateCount >= alertThreshold;
                const fine         = Math.floor(lateCount / 3) * 25;
                const streak       = streaks[student.id] || 0;

                // Status badge based on selected date
                let statusBadge;
                if (!isPresent) {
                  statusBadge = <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-black bg-red-500/15 text-red-400 border border-red-500/25 whitespace-nowrap">🔴 Absent</span>;
                } else if (isLateCircle) {
                  statusBadge = <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-black bg-orange-500/15 text-orange-400 border border-orange-500/25 whitespace-nowrap">🟠 Late</span>;
                } else {
                  statusBadge = <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-black bg-green-500/15 text-green-400 border border-green-500/25 whitespace-nowrap">🟢 Present</span>;
                }

                return (
                  <tr key={student.id} id={`row-${student.id}`} className={`${isAlert ? 'alert-row' : ''} hover:bg-gray-800/20 transition-all duration-200`}>
                    <td className="col-sr text-gray-500 text-xs pl-3 text-left font-mono">{idx + 1}</td>

                    <td className="col-name text-left py-3">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`font-bold text-sm leading-tight ${isAlert ? 'text-red-400' : 'text-gray-200'}`}>{student.name}</span>
                          {statusBadge}
                        </div>
                        <span className="text-[10px] text-gray-500 font-black tracking-[0.1em] uppercase bg-gray-900/50 w-fit px-1.5 py-0.5 rounded border border-gray-800">{student.dept}</span>
                      </div>
                    </td>

                    <td className="col-roll text-left">
                      <span className="font-mono text-xs text-cyan-400 font-black bg-cyan-900/10 px-2 py-1 rounded border border-cyan-500/10 whitespace-nowrap">{student.roll}</span>
                    </td>

                    {/* CHECK-IN cell */}
                    <td className={`date-sub-td check-in-sub ${isToday ? 'bg-cyan-900/5' : ''}`}>
                      <div className="flex items-center justify-center">
                        <div className="relative">
                          <input
                            type="checkbox"
                            className="peer sr-only"
                            checked={isPresent}
                            onChange={e => onCheckIn(student.id, selectedDate, e.target.checked)}
                            id={`chk-${student.id}`}
                          />
                          <label
                            htmlFor={`chk-${student.id}`}
                            className="cursor-pointer flex items-center justify-center w-10 h-10 rounded-xl border-2 border-gray-600 transition-all peer-checked:bg-cyan-400 peer-checked:border-cyan-400 hover:border-cyan-400 hover:shadow-[0_0_8px_rgba(0,229,255,0.25)] bg-gray-900 touch-manipulation"
                          >
                            {isPresent && (
                              <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" strokeWidth="3.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </label>
                        </div>
                      </div>
                    </td>

                    {/* ARRIVAL cell */}
                    <td className={`date-sub-td arrival-sub ${isToday ? 'bg-cyan-900/5' : ''}`}>
                      <div className="flex items-center justify-center">
                        <button
                          className={`arrival-circle-btn${hasArrival ? (isLateCircle ? ' arrival-late' : ' arrival-ontime') : ''}${!isPresent ? ' arrival-disabled' : ''}`}
                          onClick={() => isPresent && onToggleTick(student.id, selectedDate)}
                          disabled={!isPresent}
                          title={!isPresent ? 'Mark present first' : hasArrival ? `${isLateCircle ? '🟠 LATE' : '🟢 ON TIME'} — ${tick.time} · Click to clear` : `Tap to stamp arrival time`}
                          style={{ touchAction: 'manipulation' }}
                        >
                          {hasArrival ? (
                            <span className="flex flex-col items-center leading-none gap-[2px]">
                              <span className={`text-[6px] font-black uppercase tracking-widest ${isLateCircle ? 'text-orange-200' : 'text-green-200'}`}>
                                {isLateCircle ? 'LATE' : 'OK'}
                              </span>
                              <span className={`font-mono text-[6px] font-bold ${isLateCircle ? 'text-orange-100' : 'text-green-100'}`}>
                                {tick.time}
                              </span>
                            </span>
                          ) : (
                            <span className={`text-lg leading-none ${isPresent ? 'text-gray-600' : 'text-gray-800'}`}>○</span>
                          )}
                        </button>
                      </div>
                    </td>

                    {/* LATE COUNT */}
                    <td>
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-black font-mono shadow-sm ${
                        lateCount >= alertThreshold
                          ? 'bg-red-500 text-white shadow-[0_0_14px_rgba(239,68,68,0.5)] border-2 border-red-400'
                          : lateCount >= 1
                          ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40'
                          : 'bg-gray-800 text-gray-500 border border-gray-700'
                      }`}>
                        {lateCount}
                      </span>
                    </td>

                    {/* STREAK */}
                    <td>
                      {streak >= 1 && lateCount === 0
                        ? <span className="streak-badge">🔥 {streak}</span>
                        : <span className="text-gray-700 text-xs font-black">—</span>
                      }
                    </td>

                    {/* ACTION */}
                    <td>
                      {isAlert && fine > 0 ? (
                        <button
                          className="pay-fine-btn btn-danger py-2.5 px-3 text-xs font-black rounded-lg shadow-lg shadow-red-500/15 flex justify-center items-center gap-1 hover:scale-105 active:scale-95 uppercase tracking-wide w-full sm:w-auto"
                          onClick={() => onPayFine(student)}
                          style={{ touchAction: 'manipulation' }}
                        >
                          💸 Pay ₹{fine}
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
      </div>

      <ConfirmRemoveModal confirmRemoveDate={confirmRemoveDate} setConfirmRemoveDate={setConfirmRemoveDate} onRemoveDate={onRemoveDate} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
function ConfirmRemoveModal({ confirmRemoveDate, setConfirmRemoveDate, onRemoveDate }) {
  if (!confirmRemoveDate) return null;
  return (
    <div className="modal-overlay" onClick={() => setConfirmRemoveDate(null)}>
      <div className="modal-box glass-card p-6 border-red-500/30" onClick={e => e.stopPropagation()}>
        <h3 className="text-xl font-bold text-gray-100 mb-2">Remove Date?</h3>
        <p className="text-gray-400 text-sm mb-6 leading-relaxed">
          Remove <span className="text-cyan-400 font-mono font-bold bg-cyan-900/30 px-2 py-1 rounded">"{confirmRemoveDate}"</span>?
          <br />All check-ins and arrival marks for this date will be permanently deleted.
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
  );
}
