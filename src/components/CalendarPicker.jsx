import React, { useState, useEffect, useRef } from 'react';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export default function CalendarPicker({ onSelectDate, addedDates, onClose }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const modalRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Generate calendar grid
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  
  const today = new Date();
  
  const grid = [];
  let day = 1;

  for (let i = 0; i < 6; i++) {
    const row = [];
    for (let j = 0; j < 7; j++) {
      if (i === 0 && j < firstDayOfMonth) {
        row.push(null);
      } else if (day > daysInMonth) {
        row.push(null);
      } else {
        row.push(day);
        day++;
      }
    }
    grid.push(row);
    if (day > daysInMonth) break;
  }

  return (
    <div className="absolute top-12 left-0 z-50 glass-card p-4 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.6)] border border-cyan-electric/20 w-72 animate-slideUp" ref={modalRef}>
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <button onClick={handlePrevMonth} className="text-gray-400 hover:text-cyan-400 P-1">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <span className="font-bold text-gray-200">{MONTHS[month]} {year}</span>
        <button onClick={handleNextMonth} className="text-gray-400 hover:text-cyan-400 p-1">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>

      {/* Days of week */}
      <div className="grid grid-cols-7 gap-1 mb-2 text-center text-xs font-bold text-gray-500">
        {DAYS.map(d => <div key={d}>{d}</div>)}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-1">
        {grid.map((row, i) => (
          <React.Fragment key={i}>
            {row.map((d, j) => {
              if (d === null) return <div key={`empty-${j}`} />;
              
              const cellDate = new Date(year, month, d);
              const dateStr = cellDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' });
              
              const isToday = cellDate.toDateString() === today.toDateString();
              const isAdded = addedDates.includes(dateStr);

              return (
                <button
                  key={d}
                  disabled={isAdded}
                  onClick={() => { onSelectDate(dateStr); onClose(); }}
                  className={`h-8 w-8 flex items-center justify-center rounded-lg text-sm transition-all
                    ${isToday ? 'border border-cyan-400 font-bold' : ''}
                    ${isAdded 
                      ? 'bg-cyan-900/40 text-cyan-500/50 cursor-not-allowed' 
                      : 'hover:bg-gray-800 text-gray-300 hover:text-white'
                    }
                  `}
                >
                  {d}
                </button>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
