import React from 'react';

export default function QRPaymentModal({ student, tickCount, flaggedDates, onDismiss, onMarkPaid }) {
  if (!student) return null;

  const sets = Math.floor(tickCount / 3);
  const fineAmount = sets * 25;

  return (
    <div className="modal-overlay" onClick={onDismiss}>
      <div className="modal-box glass-card border border-red-500/40 overflow-hidden shadow-[0_0_60px_rgba(239,68,68,0.25)]" onClick={e => e.stopPropagation()}>
        {/* Alert tape */}
        <div className="h-2 w-full bg-[repeating-linear-gradient(45deg,#ef4444,#ef4444_12px,#b91c1c_12px,#b91c1c_24px)]" />

        <div className="p-5 sm:p-7">
          {/* Header */}
          <div className="flex items-start gap-4 mb-5">
            <div className="w-12 h-12 rounded-full bg-red-500/10 border-2 border-red-500/40 flex items-center justify-center text-2xl animate-pulse shrink-0 shadow-[0_0_15px_rgba(239,68,68,0.3)]">
              ⚠️
            </div>
            <div className="flex-1 min-w-0 pt-1">
              <h2 className="text-xl sm:text-2xl font-black text-red-500 mb-1 tracking-tight">Fine Alert!</h2>
              <p className="text-sm text-gray-300 font-bold">
                <span className="text-white">{student.name}</span>{' '}
                <span className="text-cyan-400 font-mono">({student.roll})</span>
              </p>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black mt-0.5">
                {student.dept} Department
              </p>
            </div>
          </div>

          {/* Fine Breakdown */}
          <div className="bg-red-950/40 rounded-xl p-4 mb-5 border border-red-500/20 shadow-inner">
            <p className="text-[15px] text-gray-300 font-medium text-center border-b border-red-500/10 pb-3 mb-3">
              <span className="font-black text-red-400 text-lg">{tickCount} late marks</span>
              {' = '}
              <span className="font-bold text-gray-100">{sets} sets</span>
              {' × ₹25 = '}
              <span className="font-black text-cyan-400 text-xl">₹{fineAmount}</span>
              {' fine'}
            </p>
            {flaggedDates.length > 0 && (
              <div className="text-xs text-gray-400 font-mono bg-black/50 p-3 rounded-lg border border-white/5 max-h-20 overflow-y-auto mb-3 leading-relaxed custom-scrollbar">
                <span className="text-gray-500 font-bold uppercase block mb-1">Flagged Dates:</span>
                {flaggedDates.join(', ')}
              </div>
            )}
            <p className="text-sm text-gray-200 font-bold text-center flex items-center justify-center gap-2 flex-wrap">
              Ask student to scan and pay
              <span className="text-cyan-400 text-2xl font-black px-2 py-1 bg-cyan-900/30 rounded-lg border border-cyan-500/30">
                ₹{fineAmount}
              </span>
              via UPI
            </p>
          </div>

          {/* QR Code — large & centered */}
          <div className="flex flex-col items-center justify-center mb-6 relative">
            <div className="absolute inset-0 bg-cyan-400/5 blur-3xl rounded-full pointer-events-none" />
            <div className="p-3 bg-white rounded-2xl shadow-[0_0_30px_rgba(0,229,255,0.25)] hover:scale-105 transition-all duration-300 z-10 border-4 border-gray-100/40">
              <img
                src="/assets/upi_qr.png"
                alt="UPI QR Code"
                className="w-52 h-52 sm:w-60 sm:h-60 object-cover rounded-xl"
                onError={(e) => {
                  e.target.src = 'https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=upi://pay?pa=placeholder@upi';
                }}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              className="flex-1 bg-green-500/15 hover:bg-green-500/25 hover:shadow-[0_0_20px_rgba(34,197,94,0.2)] border border-green-500/40 text-green-400 py-3.5 rounded-xl font-black text-sm flex justify-center items-center gap-2 transition-all uppercase tracking-wide"
              onClick={() => onMarkPaid(fineAmount)}
              style={{ touchAction: 'manipulation' }}
            >
              ✅ Mark as Paid — ₹{fineAmount}
            </button>
            <button
              className="flex-1 btn-secondary py-3.5 rounded-xl text-sm font-bold uppercase tracking-wide"
              onClick={onDismiss}
              style={{ touchAction: 'manipulation' }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
