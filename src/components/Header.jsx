import React from 'react';

const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
const DEPTS_Y1_Y2 = ['CSE-A', 'CSE-B', 'ECE-A', 'ECE-B', 'MECH', 'CIVIL', 'IT-A', 'IT-B', 'AIDS-A', 'AIDS-B', 'EEE'];
const DEPTS_Y3_Y4 = ['CSE', 'MECH', 'CIVIL', 'AIDS', 'IT', 'EEE'];

export default function Header({ 
  activeYear, 
  setActiveYear, 
  activeClass, 
  setActiveClass, 
  onExportCSV, 
  searchQuery, 
  setSearchQuery 
}) {
  const currentDepts = (activeYear === '1st Year' || activeYear === '2nd Year') ? DEPTS_Y1_Y2 : DEPTS_Y3_Y4;

  return (
    <div className="space-y-4">

      {/* ── Title Row (collapses subtitle on mobile) ── */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* Icon always visible */}
          <div 
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-2xl sm:text-3xl shadow-[0_0_20px_rgba(0,229,255,0.15)] flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, rgba(0,229,255,0.15), rgba(0,151,167,0.3))', border: '1px solid rgba(0,229,255,0.3)' }}
          >
            📋
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tighter text-cyan-400 font-sora drop-shadow-md leading-none">
              AttendX
            </h1>
            {/* Subtitle hidden on very small screens */}
            <p className="hidden sm:block text-[10px] text-gray-400 font-bold tracking-[0.18em] uppercase mt-0.5">
              {activeYear} — {activeClass} — Attendance Tracker
            </p>
            {/* Compact subtitle on mobile */}
            <p className="block sm:hidden text-[10px] text-cyan-600 font-bold tracking-wider uppercase mt-0.5">
              {activeYear} · {activeClass}
            </p>
          </div>
        </div>

        {/* Search bar — visible on sm+ in header, hidden on mobile (shown in action bar) */}
        <div className="hidden sm:flex items-center gap-3">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              id="search-input"
              type="text"
              className="input-field w-56 pl-10 pr-8 py-2.5 text-sm font-semibold"
              placeholder="Search name or roll..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-cyan-400 transition-colors"
                onClick={() => setSearchQuery('')}
              >✕</button>
            )}
          </div>

          <button
            id="export-csv-btn"
            onClick={onExportCSV}
            className="btn-secondary px-4 py-2 text-sm font-bold flex items-center gap-2 whitespace-nowrap"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
            Export CSV
          </button>
        </div>
      </div>

      {/* ── Level 1: Year Tabs (horizontally scrollable on mobile) ── */}
      <div className="year-tabs-row">
        {YEARS.map(yr => (
          <button
            key={yr}
            onClick={() => setActiveYear(yr)}
            className={`year-tab-btn ${activeYear === yr ? 'active' : ''}`}
          >
            {yr.toUpperCase()}
          </button>
        ))}
      </div>

      {/* ── Level 2: Department Tabs (pill row, scrollable) ── */}
      <div className="dept-tabs-row">
        {currentDepts.map(dept => (
          <button
            key={dept}
            onClick={() => setActiveClass(dept)}
            className={`dept-tab-btn ${activeClass === dept ? 'active' : ''}`}
          >
            {dept}
          </button>
        ))}
      </div>

      {/* ── Mobile Search Bar (below dept tabs on mobile only) ── */}
      <div className="flex sm:hidden">
        <div className="relative w-full">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            id="search-input-mobile"
            type="text"
            className="input-field w-full pl-10 pr-8 py-2.5 text-sm font-semibold"
            placeholder="Search name or roll..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-cyan-400 transition-colors"
              onClick={() => setSearchQuery('')}
            >✕</button>
          )}
        </div>
      </div>
    </div>
  );
}
