import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Header from './components/Header';
import StatsBar from './components/StatsBar';
import AttendanceTable from './components/AttendanceTable';
import QRPaymentModal from './components/QRPaymentModal';
import CalendarPicker from './components/CalendarPicker';

const LATE_ALERT_THRESHOLD = 3;

const DEPTS_Y1_Y2 = ['CSE-A', 'CSE-B', 'ECE-A', 'ECE-B', 'MECH', 'CIVIL', 'IT-A', 'IT-B', 'AIDS-A', 'AIDS-B', 'EEE'];
const DEPTS_Y3_Y4 = ['CSE', 'MECH', 'CIVIL', 'AIDS', 'IT', 'EEE'];

/** Returns today's date string in IST — "22 Mar 26" */
function getTodayIST() {
  return new Date().toLocaleDateString('en-GB', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: '2-digit',
  });
}

/**
 * Given a date string like "22 Mar 26", returns the next calendar day
 * in the same format — "23 Mar 26".
 */
function getNextDay(dateStr) {
  // Parse "22 Mar 26" → full year 2026
  const monthMap = { Jan:0, Feb:1, Mar:2, Apr:3, May:4, Jun:5, Jul:6, Aug:7, Sep:8, Oct:9, Nov:10, Dec:11 };
  const parts  = dateStr.trim().split(' ');
  const day    = parseInt(parts[0], 10);
  const month  = monthMap[parts[1]];
  const year   = 2000 + parseInt(parts[2], 10);
  const d      = new Date(year, month, day);
  d.setDate(d.getDate() + 1);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' });
}

export default function App() {
  const [activeYear, setActiveYear] = useState('2nd Year');
  const [activeClass, setActiveClass] = useState('CSE-B');

  const [studentsData, setStudentsData] = useState([]);
  const [loading, setLoading] = useState(true);

  /**
   * dates: ordered array of date strings ["22 Mar 26", "23 Mar 26", …]
   * Always includes today.
   */
  const [dates, setDates] = useState([]);

  /**
   * selectedDate: the ONE date currently shown in the attendance table.
   * Default is today. Teacher can nav with ← → arrows.
   */
  const [selectedDate, setSelectedDate] = useState(getTodayIST());

  /**
   * checkIns: { "[studentId]_[date]": true }
   * Per-student per-date. True = present.
   */
  const [checkIns, setCheckIns] = useState({});

  /**
   * ticks: { "[studentId]_[date]": { time, isLate } }
   * Arrival circle data. Auto-cleared when checkIn removed.
   */
  const [ticks, setTicks] = useState({});

  const [streaks, setStreaks] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [paymentModalStudent, setPaymentModalStudent] = useState(null);
  const [notification, setNotification] = useState(null);

  // ── Auto-switch dept when year changes ───────────────────────────────────
  useEffect(() => {
    const list = (activeYear === '1st Year' || activeYear === '2nd Year') ? DEPTS_Y1_Y2 : DEPTS_Y3_Y4;
    if (!list.includes(activeClass)) setActiveClass(list[0]);
  }, [activeYear, activeClass]);

  // ── Load Data ─────────────────────────────────────────────────────────────
  useEffect(() => {
    let isMounted = true;
    const prefixMap = { '1st Year': 'Y1', '2nd Year': 'Y2', '3rd Year': 'Y3', '4th Year': 'Y4' };
    const prefix = prefixMap[activeYear];
    const list = (activeYear === '1st Year' || activeYear === '2nd Year') ? DEPTS_Y1_Y2 : DEPTS_Y3_Y4;
    if (!list.includes(activeClass)) return;

    const load = async () => {
      setLoading(true);
      const todayStr = getTodayIST();
      try {
        const rawJson = await import(`./data/students_${prefix}_${activeClass}.json`);
        const jsonStudents = rawJson.default || rawJson;
        if (!isMounted) return;
        setStudentsData(jsonStudents);

        const storageKey = `attendx_${prefix}_${activeClass}_v2_attendance`;
        const saved = localStorage.getItem(storageKey);

        let loadedDates    = [todayStr];
        let loadedCheckIns = {};
        let loadedTicks    = {};
        let loadedStreaks   = {};

        if (saved) {
          const parsed = JSON.parse(saved);
          loadedDates    = parsed.dates    || [todayStr];
          loadedCheckIns = parsed.checkIns || {};
          loadedTicks    = parsed.ticks    || {};
          loadedStreaks   = parsed.streaks  || {};
        } else {
          jsonStudents.forEach(s => { loadedStreaks[s.id] = 0; });
        }

        // Always ensure today is in the list
        if (!loadedDates.includes(todayStr)) {
          loadedDates = [todayStr, ...loadedDates];
        }

        setDates(loadedDates);
        setCheckIns(loadedCheckIns);
        setTicks(loadedTicks);
        setStreaks(loadedStreaks);
        // Default to today
        setSelectedDate(todayStr);
      } catch (err) {
        console.error('Error loading JSON:', err);
        if (isMounted) setStudentsData([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    load();
    return () => { isMounted = false; };
  }, [activeYear, activeClass]);

  // ── Persist ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (loading) return;
    const prefixMap = { '1st Year': 'Y1', '2nd Year': 'Y2', '3rd Year': 'Y3', '4th Year': 'Y4' };
    const prefix = prefixMap[activeYear];
    const storageKey = `attendx_${prefix}_${activeClass}_v2_attendance`;
    localStorage.setItem(storageKey, JSON.stringify({ dates, checkIns, ticks, streaks }));
  }, [activeYear, activeClass, dates, checkIns, ticks, streaks, loading]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const showNotif = useCallback((msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  }, []);

  /** Count LATE ticks (isLate=true) across ALL dates */
  const getLateCount = useCallback((studentId) => {
    return dates.reduce((sum, d) => {
      const t = ticks[`${studentId}_${d}`];
      return sum + (t && t.isLate ? 1 : 0);
    }, 0);
  }, [ticks, dates]);

  const addDate = useCallback((dStr) => {
    const d = dStr.trim();
    if (!d) return;
    if (dates.includes(d)) {
      showNotif(`"${d}" is already added!`, 'error');
      return;
    }
    setDates(prev => [...prev, d]);
    setSelectedDate(d); // jump to newly added date
    showNotif(`✅ Added ${d}`);
  }, [dates, showNotif]);

  const removeDate = useCallback((date) => {
    // Determine the new selected date before removing
    const today = getTodayIST();
    setDates(prev => prev.filter(d => d !== date));
    setSelectedDate(cur => {
      if (cur !== date) return cur;
      // The removed date was selected — fallback to today or first remaining
      // We look at the current dates array minus the removed one
      const remaining = dates.filter(d => d !== date);
      return remaining.includes(today) ? today : (remaining[0] || today);
    });
    const suffix = `_${date}`;
    setCheckIns(prev => { const u = { ...prev }; Object.keys(u).forEach(k => { if (k.endsWith(suffix)) delete u[k]; }); return u; });
    setTicks(prev => { const u = { ...prev }; Object.keys(u).forEach(k => { if (k.endsWith(suffix)) delete u[k]; }); return u; });
  }, [dates]);

  /** Navigate to previous date (disabled at first) */
  const navPrev = useCallback(() => {
    setSelectedDate(cur => {
      const idx = dates.indexOf(cur);
      if (idx <= 0) return cur;
      return dates[idx - 1];
    });
  }, [dates]);

  /**
   * Navigate to next date.
   * If already at the last date, auto-creates the next calendar day.
   * NOTE: All state calls MUST be at the top level — never inside another
   * state updater callback (React ignores side-effects inside updaters).
   */
  const goNext = useCallback(() => {
    const idx = dates.indexOf(selectedDate);
    if (idx >= 0 && idx < dates.length - 1) {
      // Just move forward to the existing next date
      setSelectedDate(dates[idx + 1]);
    } else {
      // At the end — auto-create the next calendar day
      const next = getNextDay(selectedDate);
      if (!dates.includes(next)) {
        setDates(prev => [...prev, next]);
        showNotif(`✅ Added ${next}`);
      }
      setSelectedDate(next);
    }
  }, [dates, selectedDate, showNotif]);

  /** Check-in per student per date. Absent → auto-clears tick. */
  const handleCheckIn = useCallback((studentId, date, checked) => {
    const key = `${studentId}_${date}`;
    if (checked) {
      setCheckIns(prev => ({ ...prev, [key]: true }));
    } else {
      setCheckIns(prev => { const u = { ...prev }; delete u[key]; return u; });
      setTicks(prev => { if (!prev[key]) return prev; const u = { ...prev }; delete u[key]; return u; });
    }
  }, []);

  /** Select-all for one date's CHECK-IN column */
  const handleCheckInAllForDate = useCallback((date) => {
    const allChecked = studentsData.every(s => checkIns[`${s.id}_${date}`]);
    if (allChecked) {
      setCheckIns(prev => { const u = { ...prev }; studentsData.forEach(s => { delete u[`${s.id}_${date}`]; }); return u; });
      setTicks(prev => { const u = { ...prev }; studentsData.forEach(s => { delete u[`${s.id}_${date}`]; }); return u; });
      showNotif(`☑️ Cleared all for ${date}`);
    } else {
      setCheckIns(prev => { const u = { ...prev }; studentsData.forEach(s => { u[`${s.id}_${date}`] = true; }); return u; });
      showNotif(`✅ Checked in ALL for ${date}`);
    }
  }, [studentsData, checkIns, showNotif]);

  /** Toggle arrival-time circle (stamps IST time, determines late if after 08:30 IST) */
  const toggleTick = useCallback((studentId, date) => {
    const key = `${studentId}_${date}`;
    setTicks(prev => {
      if (prev[key]) {
        const u = { ...prev }; delete u[key]; return u;
      }
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true });
      const istH = parseInt(now.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', hour12: false }), 10);
      const istM = parseInt(now.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', minute: '2-digit' }), 10);
      const isLate = istH > 8 || (istH === 8 && istM > 30);
      return { ...prev, [key]: { time: timeStr, isLate } };
    });
  }, []);

  const markAsPaid = useCallback((fineAmount) => {
    if (!paymentModalStudent) return;
    const sid = paymentModalStudent.id;
    setTicks(prev => { const u = { ...prev }; dates.forEach(d => { delete u[`${sid}_${d}`]; }); return u; });
    setStreaks(prev => ({ ...prev, [sid]: 0 }));
    showNotif(`₹${fineAmount} fine paid for ${paymentModalStudent.name}. Late marks reset!`);
    setPaymentModalStudent(null);
  }, [paymentModalStudent, dates, showNotif]);

  /** Export CSV: Roll | Name | Date | Present/Absent | Arrival Time | Late (Yes/No) */
  const exportCSV = useCallback(() => {
    if (!studentsData.length) return;
    const prefixMap = { '1st Year': 'Y1', '2nd Year': 'Y2', '3rd Year': 'Y3', '4th Year': 'Y4' };
    const prefix = prefixMap[activeYear];
    const header = ['Roll Number', 'Name', 'Date', 'Present/Absent', 'Arrival Time', 'Late (Yes/No)'];
    const sorted = [...studentsData].sort((a, b) => a.roll.localeCompare(b.roll));
    const rows = [];
    dates.forEach(date => {
      sorted.forEach(s => {
        const isP = !!checkIns[`${s.id}_${date}`];
        const tick = ticks[`${s.id}_${date}`];
        rows.push([s.roll, s.name, date, isP ? 'Present' : 'Absent', tick ? tick.time : '—', tick ? (tick.isLate ? 'Yes' : 'No') : '—']);
      });
    });
    const csv = [header, ...rows].map(r => r.map(v => `"${String(v || '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const a = document.createElement('a');
    a.href = url;
    const now = new Date();
    a.download = `AttendX_${prefix}_${activeClass}_${String(now.getDate()).padStart(2,'0')}-${now.toLocaleString('en-GB',{month:'short'})}-${now.getFullYear()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showNotif('📊 CSV exported!');
  }, [studentsData, dates, checkIns, ticks, activeYear, activeClass, showNotif]);

  // ── Derived ───────────────────────────────────────────────────────────────
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return studentsData;
    const lq = searchQuery.toLowerCase();
    return studentsData.filter(s => s.name.toLowerCase().includes(lq) || s.roll.toLowerCase().includes(lq));
  }, [studentsData, searchQuery]);

  const todayStr = getTodayIST();

  // Stats always from the SELECTED date (updates as teacher navigates dates)
  const totalStudents  = studentsData.length;
  const presentToday   = studentsData.filter(s => !!checkIns[`${s.id}_${selectedDate}`]).length;
  const lateToday      = studentsData.filter(s => { const t = ticks[`${s.id}_${selectedDate}`]; return t && t.isLate; }).length;
  const onTimeToday    = studentsData.filter(s => { const t = ticks[`${s.id}_${selectedDate}`]; return !!checkIns[`${s.id}_${selectedDate}`] && t && !t.isLate; }).length;
  const alertCount     = studentsData.filter(s => getLateCount(s.id) >= LATE_ALERT_THRESHOLD).length;

  const activePrefix = { '1st Year': 'Y1', '2nd Year': 'Y2', '3rd Year': 'Y3', '4th Year': 'Y4' }[activeYear];

  // ── Dynamic document title ────────────────────────────────────────────────
  useEffect(() => {
    document.title = `AttendX — ${activeYear} ${activeClass} · ${selectedDate}`;
  }, [activeYear, activeClass, selectedDate]);

  return (
    <div className="min-h-screen relative z-10 w-full overflow-x-hidden pt-4 main-content-area">
      <div className="max-w-[1600px] mx-auto px-3 sm:px-4 space-y-5 sm:space-y-7 pb-6">

        <Header
          activeYear={activeYear} setActiveYear={setActiveYear}
          activeClass={activeClass} setActiveClass={setActiveClass}
          onExportCSV={exportCSV}
          searchQuery={searchQuery} setSearchQuery={setSearchQuery}
        />

        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="animate-spin text-5xl">⏳</div>
          </div>
        ) : (
          <>
            <StatsBar
              totalStudents={totalStudents}
              presentToday={presentToday}
              lateToday={lateToday}
              onTimeToday={onTimeToday}
              alertCount={alertCount}
              dateLabel={selectedDate}
            />

            {studentsData.length === 0 ? (
              <div className="glass-card flex flex-col items-center justify-center p-12 sm:p-20 text-center border-dashed border-gray-700/50 rounded-3xl mt-4">
                <span className="text-5xl mb-5 opacity-30">📂</span>
                <h3 className="text-xl font-black text-gray-400 mb-3">No students added yet</h3>
                <p className="text-gray-500 font-semibold text-sm leading-relaxed">
                  Edit <code className="text-cyan-400 bg-cyan-900/20 px-2 py-1 rounded-lg border border-cyan-500/20 text-xs break-all">
                    src/data/students_{activePrefix}_{activeClass}.json
                  </code> to add students.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* ── Controls bar ── */}
                <div className="flex flex-wrap items-center gap-3 bg-gray-900/40 p-4 rounded-2xl border border-gray-800 shadow-[0_4px_20px_rgba(0,0,0,0.3)]">

                  {/* Calendar trigger */}
                  <div className="relative">
                    <button
                      id="calendar-trigger-btn"
                      className="input-field px-4 py-2.5 flex items-center gap-3 text-sm font-bold text-gray-400 hover:text-cyan-300 hover:border-cyan-500/50 transition-colors cursor-pointer min-w-[180px]"
                      onClick={() => setIsCalendarOpen(v => !v)}
                    >
                      <svg className="w-4 h-4 text-cyan-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Add Date
                      <span className="ml-auto text-xs bg-gray-800 text-gray-500 px-2 py-0.5 rounded font-mono">{dates.length}</span>
                    </button>
                    {isCalendarOpen && (
                      <CalendarPicker
                        onSelectDate={addDate}
                        addedDates={dates}
                        onClose={() => setIsCalendarOpen(false)}
                      />
                    )}
                  </div>

                  {/* Date navigator — shown when NOT in history mode */}
                  {!showHistory && (
                    <div className="flex items-center gap-2 flex-1 justify-center">
                      <button
                        className="btn-secondary px-3 py-2 text-xs font-black rounded-lg disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1 hover:scale-105 active:scale-95 transition-transform"
                        onClick={navPrev}
                        disabled={dates.indexOf(selectedDate) <= 0}
                        title="Previous date"
                      >
                        ← Prev
                      </button>

                      <div className={`flex flex-col items-center px-5 py-2 rounded-xl border font-black tracking-wide min-w-[140px] text-center transition-all ${
                        selectedDate === todayStr
                          ? 'border-cyan-500/50 bg-cyan-900/20 text-cyan-300 shadow-[0_0_14px_rgba(0,229,255,0.15)]'
                          : 'border-gray-700 bg-gray-900/60 text-gray-300'
                      }`}>
                        <span className="text-sm uppercase tracking-widest">{selectedDate}</span>
                        {selectedDate === todayStr && (
                          <span className="text-[8px] text-cyan-500/70 uppercase tracking-widest font-bold">Today</span>
                        )}
                      </div>

                      {/* Next → always enabled: navigates forward or auto-creates next calendar day */}
                      <button
                        className="btn-secondary px-3 py-2 text-xs font-black rounded-lg flex items-center gap-1 hover:scale-105 active:scale-95 transition-transform hover:border-cyan-500/50 hover:text-cyan-300"
                        onClick={goNext}
                        title={dates.indexOf(selectedDate) >= dates.length - 1
                          ? `Auto-create ${getNextDay(selectedDate)}`
                          : 'Next date'
                        }
                      >
                        Next →
                      </button>
                    </div>
                  )}

                  {/* History toggle */}
                  <div className="flex items-center gap-3 bg-gray-900/80 px-4 py-2.5 rounded-xl border border-gray-800 shadow-inner ml-auto">
                    <span className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 whitespace-nowrap">
                      <svg className="w-4 h-4 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      History
                    </span>
                    <label className="toggle-switch">
                      <input type="checkbox" checked={showHistory} onChange={() => setShowHistory(v => !v)} />
                    </label>
                  </div>
                </div>

                {/* ── Table ── */}
                <AttendanceTable
                  students={filteredStudents}
                  allStudents={studentsData}
                  dates={dates}
                  selectedDate={selectedDate}
                  ticks={ticks}
                  checkIns={checkIns}
                  streaks={streaks}
                  onToggleTick={toggleTick}
                  onCheckIn={handleCheckIn}
                  onCheckInAllForDate={handleCheckInAllForDate}
                  onPayFine={st => setPaymentModalStudent(st)}
                  onRemoveDate={removeDate}
                  getLateCount={getLateCount}
                  alertThreshold={LATE_ALERT_THRESHOLD}
                  showHistory={showHistory}
                  todayStr={todayStr}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* QR Payment Modal */}
      {paymentModalStudent && (
        <QRPaymentModal
          student={paymentModalStudent}
          tickCount={getLateCount(paymentModalStudent.id)}
          flaggedDates={dates.filter(d => { const t = ticks[`${paymentModalStudent.id}_${d}`]; return t && t.isLate; })}
          onDismiss={() => setPaymentModalStudent(null)}
          onMarkPaid={markAsPaid}
        />
      )}

      {/* Toast */}
      {notification && (
        <div className={`fixed bottom-24 sm:bottom-8 right-4 sm:right-8 z-50 px-5 py-3.5 rounded-xl text-sm font-black tracking-wide flex items-center gap-3 animate-slideUp shadow-[0_10px_40px_rgba(0,0,0,0.5)] border max-w-xs sm:max-w-sm ${
          notification.type === 'error'
            ? 'border-red-500/50 text-red-50 bg-red-600/90 backdrop-blur-md'
            : 'border-cyan-400/60 text-cyan-50 bg-cyan-600/90 backdrop-blur-md'
        }`}>
          <span className={`pulse-dot ${notification.type === 'error' ? 'bg-red-200' : 'bg-cyan-200'}`} />
          {notification.msg}
        </div>
      )}

      {/* Mobile bottom bar */}
      <div className="mobile-action-bar">
        <button onClick={exportCSV} className="flex-1 btn-secondary py-2.5 text-sm font-bold flex items-center justify-center gap-2 rounded-xl" style={{ touchAction: 'manipulation' }}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          </svg>
          Export CSV
        </button>
      </div>
    </div>
  );
}
