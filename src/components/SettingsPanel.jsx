import React, { useState } from 'react';

export default function SettingsPanel({ apiKey, onSave, onClose }) {
  const [localKey, setLocalKey] = useState(apiKey);
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="modal-overlay">
      <div className="modal-box glass-card border border-cyan-electric/20 p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-6 border-b border-cyan-electric/10 pb-4">
          <h2 className="text-xl font-bold text-cyan-electric flex items-center gap-2">
            ⚙️ Settings
          </h2>
          <button className="text-gray-400 hover:text-white" onClick={onClose}>✕</button>
        </div>

        <div className="space-y-6">
          <div className="bg-cyan-900/10 border border-cyan-electric/20 p-4 rounded-xl">
            <h3 className="font-semibold text-gray-200 mb-2">Web3Forms API Key</h3>
            <p className="text-sm text-gray-400 mb-4 leading-relaxed">
              Required to send automated fine notice emails. You can get a free key from <a href="https://web3forms.com/" target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline">web3forms.com</a>. No backend required.
            </p>
            
            <div className="relative">
              <input 
                type={isVisible ? "text" : "password"} 
                className="input-field w-full py-2.5 px-3 pr-10 font-mono text-sm"
                placeholder="Paste your Access Key here (e.g. 8a2b3c4d-...)"
                value={localKey}
                onChange={e => setLocalKey(e.target.value)}
              />
              <button 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-cyan-400"
                onClick={() => setIsVisible(!isVisible)}
              >
                {isVisible ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <div className="bg-gray-800/30 p-4 rounded-xl border border-gray-700/50">
            <h3 className="font-semibold text-gray-300 text-sm mb-2">Data Persistence</h3>
            <p className="text-xs text-gray-500 mb-0">
              Your attendance data is automatically saved locally in your browser. It will persist even if you reload the page.
            </p>
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-3">
          <button className="px-5 py-2.5 btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="px-5 py-2.5 btn-primary text-black font-bold" onClick={() => onSave(localKey)}>
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
