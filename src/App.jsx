import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Header from './components/Header';
import StatsBar from './components/StatsBar';
import AttendanceTable from './components/AttendanceTable';
import QRPaymentModal from './components/QRPaymentModal';
import CalendarPicker from './components/CalendarPicker';

const TICK_ALERT_THRESHOLD = 3;

const DEPTS_Y1_Y2 = ['CSE-A', 'CSE-B', 'ECE-A', 'ECE-B', 'MECH', 'CIVIL', 'IT-A', 'IT-B', 'AIDS-A', 'AIDS-B', 'EEE'];
const DEPTS_Y3_Y4 = ['CSE', 'MECH', 'CIVIL', 'AIDS', 'IT', 'EEE'];

/** Returns today's date string in IST formatted as "DD Mon YY" e.g. "22 Mar 26" */
function getTodayIST() {
  const now = new Date();
  return now.toLocaleDateString('en-GB', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: '2-digit',
  });
}

export default function App() {
  const [activeYear, setActiveYear] = useState('2nd Year');
  const [activeClass, setActiveClass] = useState('CSE-B');

  const [studentsData, setStudentsData] = useState([]);
  const [loading, setLoading] = useState(true);

  const [dates, setDates] = useState([]);
  const [ticks, setTicks] = useState({});
  const [checkIns, setCheckIns] = useState({});
  const [streaks, setStreaks] = useState({});
  const [searchQuery, setSearchQuery] = useState('');

  const [showHistory, setShowHistory] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const [paymentModalStudent, setPaymentModalStudent] = useState(null);
  const [notification, setNotification] = useState(null);

  // ── Auto-switch department when year changes ──────────────────────────────
  useEffect(() => {
    const list = (activeYear === '1st Year' || activeYear === '2nd Year') ? DEPTS_Y1_Y2 : DEPTS_Y3_Y4;
    if (!list.includes(activeClass)) {
      setActiveClass(list[0]);
    }
  }, [activeYear, activeClass]);

  // ── Load Data for Active Class ────────────────────────────────────────────
  useEffect(() => {
    let isMounted = true;
    const prefixMap = { '1st Year': 'Y1', '2nd Year': 'Y2', '3rd Year': 'Y3', '4th Year': 'Y4' };
    const prefix = prefixMap[activeYear];

    const list = (activeYear === '1st Year' || activeYear === '2nd Year') ? DEPTS_Y1_Y2 : DEPTS_Y3_Y4;
    if (!list.includes(activeClass)) return;

    const loadClassData = async () => {
      setLoading(true);
      const todayStr = getTodayIST();
      try {
        const rawJson = await import(`./data/students_${prefix}_${activeClass}.json`);
        const jsonStudents = rawJson.default || rawJson;

        if (!isMounted) return;
        setStudentsData(jsonStudents);

        const storageKey = `attendx_${prefix}_${activeClass}_attendance`;
        const saved = localStorage.getItem(storageKey);

        let loadedDates = [todayStr];
        let loadedTicks = {};
        let loadedCheckIns = {};
        let loadedStreaks = {};

        if (saved) {
          const parsed = JSON.parse(saved);
          loadedDates = parsed.dates || [todayStr];
          loadedTicks = parsed.ticks || {};
          loadedCheckIns = parsed.checkIns || {};
          loadedStreaks = parsed.streaks || {};
        } else {
          jsonStudents.forEach(s => { loadedStreaks[s.id] = 0; });
        }

        // Always ensure today is in the dates list
        if (!loadedDates.includes(todayStr)) {
          loadedDates = [...loadedDates, todayStr];
        }

        setDates(loadedDates);
        setTicks(loadedTicks);
        setCheckIns(loadedCheckIns);
        setStreaks(loadedStreaks);
      } catch (err) {
        console.error('Error loading JSON:', err);
        if (isMounted) setStudentsData([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadClassData();
    return () => { isMounted = false; };
  }, [activeYear, activeClass]);

  // ── Persist Data ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (loading) return;
    const prefixMap = { '1st Year': 'Y1', '2nd Year': 'Y2', '3rd Year': 'Y3', '4th Year': 'Y4' };
    const prefix = prefixMap[activeYear];
    const storageKey = `attendx_${prefix}_${activeClass}_attendance`;
    localStorage.setItem(storageKey, JSON.stringify({ dates, ticks, checkIns, streaks }));
  }, [activeYear, activeClass, dates, ticks, checkIns, streaks, loading]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const showNotif = useCallback((msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  }, []);

  /** Always counts across ALL dates regardless of showHistory */
  const getTickCount = useCallback((studentId) => {
    return dates.reduce((sum, date) => sum + (ticks[`${studentId}_${date}`] ? 1 : 0), 0);
  }, [ticks, dates]);

  const addDate = useCallback((dStr) => {
    const d = dStr.trim();
    if (!d) return;
    if (dates.includes(d)) {
      showNotif(`Date "${d}" is already in the table!`, 'error');
      return;
    }
    setDates(prev => [...prev, d]);
    showNotif(`✅ Added ${d} column`);
  }, [dates, showNotif]);

  const removeDate = useCallback((date) => {
    setDates(prev => prev.filter(d => d !== date));
  }, []);

  const toggleTick = useCallback((studentId, date) => {
    const key = `${studentId}_${date}`;
    setTicks(prev => {
      const isTickAdded = !prev[key];
      const updated = { ...prev, [key]: isTickAdded };
      if (isTickAdded) {
        setStreaks(sp => ({ ...sp, [studentId]: 0 }));
      }
      return updated;
    });
  }, []);

  const handleCheckIn = useCallback((studentId, checked) => {
    if (checked) {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true });
      const istHour = parseInt(now.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', hour12: false }), 10);
      const istMin  = parseInt(now.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', minute: '2-digit' }), 10);
      const isLate  = istHour > 8 || (istHour === 8 && istMin > 30);
      const today   = getTodayIST();

      setCheckIns(prev => ({ ...prev, [studentId]: { time: timeStr, isLate, date: today } }));

      if (!isLate && getTickCount(studentId) === 0) {
        setStreaks(prev => ({ ...prev, [studentId]: (prev[studentId] || 0) + 1 }));
      }
    } else {
      setCheckIns(prev => {
        const updated = { ...prev };
        delete updated[studentId];
        return updated;
      });
    }
  }, [getTickCount]);

  const handleCheckInAll = useCallback(() => {
    const allChecked = studentsData.every(s => checkIns[s.id]);

    if (allChecked) {
      setCheckIns({});
      showNotif('☑️ All check-ins cleared');
    } else {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true });
      const istHour = parseInt(now.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', hour12: false }), 10);
      const istMin  = parseInt(now.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', minute: '2-digit' }), 10);
      const isLate  = istHour > 8 || (istHour === 8 && istMin > 30);
      const today   = getTodayIST();

      const newStreaks = { ...streaks };
      setCheckIns(prev => {
        const updated = { ...prev };
        studentsData.forEach(s => {
          if (!updated[s.id]) {
            updated[s.id] = { time: timeStr, isLate, date: today };
            if (!isLate && getTickCount(s.id) === 0) {
              newStreaks[s.id] = (newStreaks[s.id] || 0) + 1;
            }
          }
        });
        setStreaks(newStreaks);
        return updated;
      });
      showNotif('✅ Checked in ALL students!');
    }
  }, [studentsData, checkIns, streaks, getTickCount, showNotif]);

  const markAsPaid = useCallback((fineAmount) => {
    if (!paymentModalStudent) return;
    const studentId = paymentModalStudent.id;
    setTicks(prev => {
      const updated = { ...prev };
      dates.forEach(d => { delete updated[`${studentId}_${d}`]; });
      return updated;
    });
    setStreaks(prev => ({ ...prev, [studentId]: 0 }));
    showNotif(`₹${fineAmount} fine marked as paid for ${paymentModalStudent.name}. Ticks reset!`);
    setPaymentModalStudent(null);
  }, [paymentModalStudent, dates, showNotif]);

  const exportCSV = useCallback(() => {
    if (studentsData.length === 0) return;
    const headers = ['#', 'Roll Number', 'Name', 'Department', 'Total Ticks', ...dates, 'Check-In Today', 'Status', 'Streak'];
    const rows = studentsData.map((s, idx) => {
      const checkIn = checkIns[s.id];
      const tickCount = getTickCount(s.id);
      return [
        idx + 1, s.roll, s.name, s.dept, tickCount,
        ...dates.map(d => ticks[`${s.id}_${d}`] ? '✓' : ''),
        checkIn ? checkIn.time : '',
        checkIn ? (checkIn.isLate ? 'LATE' : 'ON TIME') : '',
        streaks[s.id] || 0,
      ];
    });
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v || '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const prefixMap = { '1st Year': 'Y1', '2nd Year': 'Y2', '3rd Year': 'Y3', '4th Year': 'Y4' };
    a.download = `AttendX_${prefixMap[activeYear]}_${activeClass}_${new Date().toLocaleDateString('en-GB').replace(/\//g, '-')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showNotif('📊 CSV exported successfully!');
  }, [studentsData, dates, ticks, checkIns, streaks, getTickCount, activeYear, activeClass, showNotif]);

  // ── Derived State ────────────────────────────────────────────────────────
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return studentsData;
    const lq = searchQuery.toLowerCase();
    return studentsData.filter(s => s.name.toLowerCase().includes(lq) || s.roll.toLowerCase().includes(lq));
  }, [studentsData, searchQuery]);

  const todayStr     = getTodayIST();
  const totalStudents = studentsData.length;
  const presentToday  = Object.values(checkIns).filter(c => c && c.date === todayStr).length;
  const lateToday     = Object.entries(checkIns).filter(([, c]) => c && c.date === todayStr && c.isLate).length;
  const onTimeToday   = Object.entries(checkIns).filter(([, c]) => c && c.date === todayStr && !c.isLate).length;
  const alertCount    = studentsData.filter(s => getTickCount(s.id) >= TICK_ALERT_THRESHOLD).length;
  const allCheckedIn  = studentsData.length > 0 && studentsData.every(s => checkIns[s.id]);

  const prefixMap = { '1st Year': 'Y1', '2nd Year': 'Y2', '3rd Year': 'Y3', '4th Year': 'Y4' };
  const activePrefix = prefixMap[activeYear];

  return (
    <div className="min-h-screen relative z-10 w-full overflow-x-hidden pt-4 main-content-area">
      <div className="max-w-[1600px] mx-auto px-3 sm:px-4 space-y-5 sm:space-y-7 pb-6">

        <Header
          activeYear={activeYear}
          setActiveYear={setActiveYear}
          activeClass={activeClass}
          setActiveClass={setActiveClass}
          onExportCSV={exportCSV}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
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
            />

            {studentsData.length === 0 ? (
              <div className="glass-card flex flex-col items-center justify-center p-12 sm:p-20 text-center border-dashed border-gray-700/50 rounded-3xl mt-4">
                <span className="text-5xl sm:text-6xl mb-5 opacity-30">📂</span>
                <h3 className="text-xl sm:text-2xl font-black text-gray-400 mb-3">No students added yet</h3>
                <p className="text-gray-500 font-semibold text-sm sm:text-base leading-relaxed">
                  Edit{' '}
                  <code className="text-cyan-400 bg-cyan-900/20 px-2 py-1 rounded-lg border border-cyan-500/20 text-xs sm:text-sm break-all">
                    src/data/students_{activePrefix}_{activeClass}.json
                  </code>
                  {' '}to add students.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Date Selection & History Toggle */}
                <div className="flex flex-wrap items-center justify-between gap-3 bg-gray-900/40 p-4 rounded-2xl border border-gray-800 shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
                  {/* Calendar Picker trigger */}
                  <div className="relative">
                    <button
                      id="calendar-trigger-btn"
                      className="input-field px-4 py-2.5 flex items-center gap-3 text-sm font-bold text-gray-400 hover:text-cyan-300 hover:border-cyan-500/50 transition-colors cursor-pointer min-w-[200px]"
                      onClick={() => setIsCalendarOpen(v => !v)}
                    >
                      <svg className="w-4 h-4 text-cyan-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Add Date Column
                      <span className="ml-auto text-xs bg-gray-800 text-gray-500 px-2 py-0.5 rounded font-mono">
                        {dates.length} dates
                      </span>
                    </button>
                    {isCalendarOpen && (
                      <CalendarPicker
                        onSelectDate={addDate}
                        addedDates={dates}
                        onClose={() => setIsCalendarOpen(false)}
                      />
                    )}
                  </div>

                  {/* Show History Toggle */}
                  <div className="flex items-center gap-3 bg-gray-900/80 px-4 py-2.5 rounded-xl border border-gray-800 shadow-inner">
                    <span className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 whitespace-nowrap">
                      <svg className="w-4 h-4 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      History
                    </span>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={showHistory}
                        onChange={() => setShowHistory(v => !v)}
                      />
                    </label>
                  </div>
                </div>

                <AttendanceTable
                  students={filteredStudents}
                  dates={dates}
                  ticks={ticks}
                  checkIns={checkIns}
                  streaks={streaks}
                  onToggleTick={toggleTick}
                  onCheckIn={handleCheckIn}
                  onPayFine={(st) => setPaymentModalStudent(st)}
                  onRemoveDate={removeDate}
                  getTickCount={getTickCount}
                  alertThreshold={TICK_ALERT_THRESHOLD}
                  showHistory={showHistory}
                  onCheckInAll={handleCheckInAll}
                  allCheckedIn={allCheckedIn}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* ── QR Payment Modal ────────────────────────────────────────────────── */}
      {paymentModalStudent && (
        <QRPaymentModal
          student={paymentModalStudent}
          tickCount={getTickCount(paymentModalStudent.id)}
          flaggedDates={dates.filter(d => ticks[`${paymentModalStudent.id}_${d}`])}
          onDismiss={() => setPaymentModalStudent(null)}
          onMarkPaid={markAsPaid}
        />
      )}

      {/* ── Toast Notification ───────────────────────────────────────────── */}
      {notification && (
        <div
          className={`fixed bottom-24 sm:bottom-8 right-4 sm:right-8 z-50 px-5 py-3.5 rounded-xl text-sm font-black tracking-wide flex items-center gap-3 animate-slideUp shadow-[0_10px_40px_rgba(0,0,0,0.5)] border max-w-xs sm:max-w-sm ${
            notification.type === 'error'
              ? 'border-red-500/50 text-red-50 bg-red-600/90 backdrop-blur-md'
              : 'border-cyan-400/60 text-cyan-50 bg-cyan-600/90 backdrop-blur-md'
          }`}
        >
          <span className={`pulse-dot ${notification.type === 'error' ? 'bg-red-200' : 'bg-cyan-200'}`} />
          {notification.msg}
        </div>
      )}

      {/* ── Mobile Bottom Action Bar ─────────────────────────────────────── */}
      <div className="mobile-action-bar">
        <button
          onClick={exportCSV}
          className="flex-1 btn-secondary py-2.5 text-sm font-bold flex items-center justify-center gap-2 rounded-xl"
          style={{ touchAction: 'manipulation' }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          </svg>
          Export CSV
        </button>
      </div>
    </div>
  );
}
