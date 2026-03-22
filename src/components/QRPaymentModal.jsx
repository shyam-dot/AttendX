import React from 'react';

export default function QRPaymentModal({ student, tickCount, flaggedDates, onDismiss, onMarkPaid }) {
  if (!student) return null;

  const sets = Math.floor(tickCount / 3);
  const fineAmount = sets * 25;

  return (
    <div className="modal-overlay">
      <div className="modal-box glass-card border border-red-500/40 overflow-hidden shadow-[0_0_60px_rgba(239,68,68,0.25)] rounded-2xl">
        {/* Header alert tape */}
        <div className="h-2 w-full bg-[repeating-linear-gradient(45deg,#ef4444,#ef4444_12px,#b91c1c_12px,#b91c1c_24px)]" />
        
        <div className="p-7">
          <div className="flex items-start gap-4 mb-5">
            <div className="w-14 h-14 rounded-full bg-red-500/10 border-2 border-red-500/40 flex items-center justify-center text-3xl animate-pulse-red shrink-0 shadow-[0_0_15px_rgba(239,68,68,0.3)]">
              ⚠️
            </div>
            <div className="flex-1 min-w-0 pt-1">
              <h2 className="text-2xl font-black text-red-500 mb-1 font-sora tracking-tight">Limit Reached!</h2>
              <p className="text-sm text-gray-300 font-bold truncate">
                <span className="text-white text-base">{student.name}</span> <span className="text-cyan-400 font-mono">({student.roll})</span>
              </p>
              <p className="text-[11px] text-gray-500 uppercase tracking-widest font-black mt-1">
                {student.dept} Department
              </p>
            </div>
          </div>

          <div className="bg-red-950/40 rounded-xl p-5 mb-6 border border-red-500/20 shadow-inner">
            <p className="text-[15px] text-gray-300 mb-3 font-medium text-center border-b border-red-500/10 pb-3">
              <span className="font-black text-red-400 text-lg">{tickCount} late marks</span> = <span className="font-bold text-gray-100">{sets} sets</span> × ₹25 = <span className="font-black text-cyan-400 text-xl">₹{fineAmount}</span> fine
            </p>
            <div className="text-xs text-gray-400 font-mono bg-black/60 p-3 rounded-lg border border-white/5 max-h-24 overflow-y-auto mb-4 leading-relaxed custom-scrollbar">
              <span className="text-gray-500 font-bold uppercase block mb-1">Flagged Dates:</span>
              {flaggedDates.join(', ')}
            </div>
            <p className="text-sm text-gray-200 font-bold text-center mt-2 flex items-center justify-center gap-2">
              Ask student to scan and pay <span className="text-cyan-400 text-2xl font-black px-2 py-1 bg-cyan-900/30 rounded-lg border border-cyan-500/30">₹{fineAmount}</span> via UPI
            </p>
          </div>

          {/* QR Code Section */}
          <div className="flex flex-col items-center justify-center mb-8 relative">
            <div className="absolute inset-0 bg-cyan-400/5 blur-2xl rounded-full" />
            <div className="p-3.5 bg-white rounded-2xl shadow-[0_0_30px_rgba(0,229,255,0.25)] rotate-1 hover:rotate-0 hover:scale-105 transition-all duration-300 z-10 border-4 border-gray-100/50">
              <img 
                src="/assets/upi_qr.png" 
                alt="UPI QR Code" 
                className="w-48 h-48 object-cover rounded-xl"
                onError={(e) => {
                  e.target.src = 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=placeholder@upi';
                }}
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button 
              className="flex-1 bg-green-500/15 hover:bg-green-500/25 hover:shadow-[0_0_20px_rgba(34,197,94,0.2)] border border-green-500/40 text-green-400 py-3.5 rounded-xl font-black text-sm flex justify-center items-center gap-2 transition-all uppercase tracking-wide"
              onClick={() => onMarkPaid(fineAmount)}
            >
              ✅ Mark as Paid
            </button>
            <button 
              className="flex-1 btn-secondary py-3.5 rounded-xl text-sm font-bold uppercase tracking-wide border-gray-700/50 hover:bg-gray-800"
              onClick={onDismiss}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
