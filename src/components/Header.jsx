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
    <div className="space-y-6">
      {/* 2-Level Multi-Selector */}
      <div className="flex flex-col gap-3">
        {/* Level 1: Year Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-gray-800 pb-2">
          {YEARS.map(yr => (
            <button
              key={yr}
              onClick={() => setActiveYear(yr)}
              className={`px-5 py-2.5 rounded-t-xl text-[15px] font-black tracking-wide transition-all border-b-[3px] ${
                activeYear === yr 
                  ? 'text-cyan-400 border-cyan-400 bg-cyan-900/10' 
                  : 'text-gray-500 border-transparent hover:text-gray-300 hover:bg-gray-800/30'
              }`}
            >
              {yr.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Level 2: Department Tabs */}
        <div className="flex flex-wrap items-center gap-2 pb-2">
          {currentDepts.map(dept => (
            <button
              key={dept}
              onClick={() => setActiveClass(dept)}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
                activeClass === dept 
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' 
                  : 'bg-gray-800/40 text-gray-500 border border-transparent hover:text-gray-300 hover:bg-gray-800/70'
              }`}
            >
              {dept}
            </button>
          ))}
        </div>
      </div>

      {/* Title Row */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-3xl shadow-[0_0_20px_rgba(0,229,255,0.15)]"
              style={{ background: 'linear-gradient(135deg, rgba(0,229,255,0.15), rgba(0,151,167,0.3))', border: '1px solid rgba(0,229,255,0.3)' }}>
              📋
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tighter text-cyan-electric font-sora drop-shadow-md">
                AttendX
              </h1>
              <p className="text-[10px] text-gray-400 font-bold tracking-[0.2em] uppercase mt-0.5">
                {activeYear} — {activeClass} DEPARTMENT — ATTENDANCE TRACKER
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative max-w-md hidden sm:block">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              id="search-input"
              type="text"
              className="input-field w-64 pl-10 pr-4 py-2.5 text-sm font-semibold"
              placeholder="Search by name or roll..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-cyan-400"
                onClick={() => setSearchQuery('')}
              >
                ✕
              </button>
            )}
          </div>

          <button
            id="export-csv-btn"
            onClick={onExportCSV}
            className="btn-secondary px-5 py-2.5 text-sm font-bold flex items-center gap-2 h-10 shadow-lg hover:shadow-cyan-500/20"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
            Export CSV
          </button>
        </div>
      </div>
    </div>
  );
}
