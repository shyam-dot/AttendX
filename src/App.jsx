import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Header from './components/Header';
import StatsBar from './components/StatsBar';
import AttendanceTable from './components/AttendanceTable';
import QRPaymentModal from './components/QRPaymentModal';
import CalendarPicker from './components/CalendarPicker';

const TICK_ALERT_THRESHOLD = 3;

const DEPTS_Y1_Y2 = ['CSE-A', 'CSE-B', 'ECE-A', 'ECE-B', 'MECH', 'CIVIL', 'IT-A', 'IT-B', 'AIDS-A', 'AIDS-B', 'EEE'];
const DEPTS_Y3_Y4 = ['CSE', 'MECH', 'CIVIL', 'AIDS', 'IT', 'EEE'];

// Helper: Get today's date formatted
function getTodayStr() {
  const now = new Date();
  return now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' });
}

export default function App() {
  const [activeYear, setActiveYear] = useState('2nd Year');
  const [activeClass, setActiveClass] = useState('CSE-B');
  
  const [studentsData, setStudentsData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Per-class State arrays
  const [dates, setDates] = useState([]);
  const [ticks, setTicks] = useState({});
  const [checkIns, setCheckIns] = useState({});
  const [streaks, setStreaks] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  
  // New features state
  const [showHistory, setShowHistory] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  
  // Modal & Notification
  const [paymentModalStudent, setPaymentModalStudent] = useState(null);
  const [notification, setNotification] = useState(null);

  // Auto-switch department when year changes
  useEffect(() => {
    const list = (activeYear === '1st Year' || activeYear === '2nd Year') ? DEPTS_Y1_Y2 : DEPTS_Y3_Y4;
    if (!list.includes(activeClass)) {
      setActiveClass(list[0]);
    }
  }, [activeYear, activeClass]);

  // --- 1. Load Data for Active Class ---
  useEffect(() => {
    let isMounted = true;
    const prefixMap = { '1st Year': 'Y1', '2nd Year': 'Y2', '3rd Year': 'Y3', '4th Year': 'Y4' };
    const prefix = prefixMap[activeYear];
    
    // Ensure the combination is valid (avoids loading wrong files during auto-switch)
    const list = (activeYear === '1st Year' || activeYear === '2nd Year') ? DEPTS_Y1_Y2 : DEPTS_Y3_Y4;
    if (!list.includes(activeClass)) return;

    const loadClassData = async () => {
      setLoading(true);
      const todayStr = getTodayStr();
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
          jsonStudents.forEach(s => loadedStreaks[s.id] = 0);
        }

        if (!loadedDates.includes(todayStr)) loadedDates.push(todayStr);

        setDates(loadedDates);
        setTicks(loadedTicks);
        setCheckIns(loadedCheckIns);
        setStreaks(loadedStreaks);

      } catch (err) {
        console.error("Error loading JSON:", err);
        if (isMounted) setStudentsData([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    
    loadClassData();
    return () => { isMounted = false; };
  }, [activeYear, activeClass]);

  // --- 2. Persist Data for Active Class ---
  useEffect(() => {
    if (loading) return; 
    const prefixMap = { '1st Year': 'Y1', '2nd Year': 'Y2', '3rd Year': 'Y3', '4th Year': 'Y4' };
    const prefix = prefixMap[activeYear];
    const storageKey = `attendx_${prefix}_${activeClass}_attendance`;
    
    localStorage.setItem(storageKey, JSON.stringify({
      dates, ticks, checkIns, streaks
    }));
  }, [activeYear, activeClass, dates, ticks, checkIns, streaks, loading]);

  const showNotif = useCallback((msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  }, []);

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
    const student = studentsData.find(s => s.id === studentId);
    
    setTicks(prev => {
      const isTickAdded = !prev[key];
      const updated = { ...prev, [key]: isTickAdded };
      
      if (isTickAdded) {
        setStreaks(sPrev => ({ ...sPrev, [studentId]: 0 }));
      }
      return updated;
    });
  }, [dates, studentsData]);

  // Handle single check-in
  const handleCheckIn = useCallback((studentId, checked) => {
    if (checked) {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true });
      const istHourStr = now.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', hour12: false });
      const istMinStr = now.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', minute: '2-digit' });
      const istHour = parseInt(istHourStr, 10);
      const istMin = parseInt(istMinStr, 10);
      
      const isLate = istHour > 8 || (istHour === 8 && istMin > 30);
      const today = getTodayStr();

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

  // Handle Select All Check-in
  const handleCheckInAll = useCallback(() => {
    const allChecked = studentsData.every(s => checkIns[s.id]);
    
    if (allChecked) {
      // Uncheck all
      setCheckIns({});
    } else {
      // Check in all current students
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true });
      const istHourStr = now.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', hour12: false });
      const istMinStr = now.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', minute: '2-digit' });
      const istHour = parseInt(istHourStr, 10);
      const istMin = parseInt(istMinStr, 10);
      
      const isLate = istHour > 8 || (istHour === 8 && istMin > 30);
      const today = getTodayStr();

      setCheckIns(prev => {
        const updated = { ...prev };
        const newStreaks = { ...streaks };
        
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
      showNotif('✅ Checked in ALL students successfully!');
    }
  }, [studentsData, checkIns, streaks, getTickCount, showNotif]);

  const markAsPaid = useCallback((fineAmount) => {
    if (!paymentModalStudent) return;
    const studentId = paymentModalStudent.id;
    
    setTicks(prev => {
      const updated = { ...prev };
      dates.forEach(d => {
        delete updated[`${studentId}_${d}`];
      });
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
        idx + 1,
        s.roll,
        s.name,
        s.dept,
        tickCount,
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
    const prefix = prefixMap[activeYear];
    a.download = `AttendX_${prefix}_${activeClass}_${new Date().toLocaleDateString('en-GB').replace(/\//g, '-')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showNotif('📊 CSV exported successfully!');
  }, [studentsData, dates, ticks, checkIns, streaks, getTickCount, activeYear, activeClass, showNotif]);

  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return studentsData;
    const lowerQ = searchQuery.toLowerCase();
    return studentsData.filter(s => 
      s.name.toLowerCase().includes(lowerQ) || 
      s.roll.toLowerCase().includes(lowerQ)
    );
  }, [studentsData, searchQuery]);

  const todayStr = getTodayStr();
  const totalStudents = studentsData.length;
  const presentToday = Object.values(checkIns).filter(c => c && c.date === todayStr).length;
  const lateToday = Object.entries(checkIns).filter(([_, c]) => c && c.date === todayStr && c.isLate).length;
  const onTimeToday = Object.entries(checkIns).filter(([_, c]) => c && c.date === todayStr && !c.isLate).length;
  const alertCount = studentsData.filter(s => getTickCount(s.id) >= TICK_ALERT_THRESHOLD).length;
  const allCheckedIn = studentsData.length > 0 && studentsData.every(s => checkIns[s.id]);

  return (
    <div className="min-h-screen relative z-10 w-full overflow-x-hidden pt-4 pb-12">
      <div className="max-w-[1600px] mx-auto px-4 space-y-8">
        
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
              <div className="glass-card flex flex-col items-center justify-center p-20 text-center border-dashed border-gray-700/50 rounded-3xl mt-8">
                <span className="text-6xl mb-6 opacity-30">📂</span>
                <h3 className="text-2xl font-black text-gray-400 font-sora mb-3">No students added yet</h3>
                <p className="text-gray-500 font-semibold text-lg">
                  Edit <code className="text-cyan-400 bg-cyan-900/20 px-3 py-1.5 rounded-lg border border-cyan-500/20 shadow-inner">src/data/students_{activeYear === '1st Year' ? 'Y1' : activeYear === '2nd Year' ? 'Y2' : activeYear === '3rd Year' ? 'Y3' : 'Y4'}_{activeClass}.json</code> to add students.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Date Selection & History Toggle */}
                <div className="flex flex-wrap items-center justify-between gap-4 bg-gray-900/40 p-5 rounded-2xl border border-gray-800 shadow-[0_4px_30px_rgba(0,0,0,0.3)] mt-8">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <input
                        type="text"
                        readOnly
                        placeholder="Select a date column..."
                        className="input-field px-4 py-3 w-64 text-sm font-bold tracking-wide border-gray-700 cursor-pointer hover:border-cyan-500/50 bg-gray-900 focus:bg-gray-800 transition-colors shadow-inner"
                        onClick={() => setIsCalendarOpen(true)}
                        value=""
                      />
                      <svg className="w-5 h-5 absolute right-4 top-1/2 -translate-y-1/2 text-cyan-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      {isCalendarOpen && (
                        <CalendarPicker 
                          onSelectDate={addDate} 
                          addedDates={dates} 
                          onClose={() => setIsCalendarOpen(false)} 
                        />
                      )}
                    </div>
                  </div>
                  
                  {/* Show History Toggle */}
                  <div className="flex items-center gap-3 bg-gray-900/80 px-4 py-2.5 rounded-xl border border-gray-800 shadow-inner">
                    <span className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      Show History
                    </span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={showHistory}
                        onChange={() => setShowHistory(!showHistory)}
                      />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500 shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]"></div>
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

      {paymentModalStudent && (
        <QRPaymentModal 
          student={paymentModalStudent}
          tickCount={getTickCount(paymentModalStudent.id)}
          flaggedDates={dates.filter(d => ticks[`${paymentModalStudent.id}_${d}`])}
          onDismiss={() => setPaymentModalStudent(null)}
          onMarkPaid={markAsPaid}
        />
      )}

      {notification && (
        <div className={`fixed bottom-8 right-8 z-50 px-6 py-4 rounded-xl text-sm font-black tracking-wide flex items-center gap-4 animate-slideUp shadow-[0_10px_40px_rgba(0,0,0,0.5)] border ${
          notification.type === 'error' ? 'border-red-500/50 text-red-50 shadow-red-500/20 bg-red-600/90 backdrop-blur-md' : 'border-cyan-400 text-cyan-50 shadow-cyan-500/20 bg-cyan-600/90 backdrop-blur-md'
        }`} style={{ minWidth: 300 }}>
          <span className={`pulse-dot shrink-0 shadow-sm ${notification.type === 'error' ? 'bg-red-200' : 'bg-cyan-200'}`} />
          {notification.msg}
        </div>
      )}
    </div>
  );
}
