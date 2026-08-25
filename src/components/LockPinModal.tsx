import React, { useState, useEffect } from 'react';
import { Lock, KeyRound, X, AlertCircle } from 'lucide-react';
import { FolderItem } from '../types';

interface LockPinModalProps {
  isOpen: boolean;
  folder: FolderItem | null;
  onClose: () => void;
  onUnlock: (folderId: string) => void;
}

export const LockPinModal: React.FC<LockPinModalProps> = ({
  isOpen,
  folder,
  onClose,
  onUnlock,
}) => {
  const [pinInput, setPinInput] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    setPinInput('');
    setError(false);
  }, [isOpen, folder]);

  if (!isOpen || !folder) return null;

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (folder.pin === pinInput.trim()) {
      setError(false);
      onUnlock(folder.id);
      onClose();
    } else {
      setError(true);
      setPinInput('');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-400 flex items-center justify-center mx-auto mb-3 border border-amber-500/30 shadow-lg shadow-amber-500/10">
            <Lock size={22} />
          </div>
          <h3 className="text-base font-bold text-slate-100">Folder Protected</h3>
          <p className="text-xs text-slate-400 mt-1">
            Enter PIN code for &ldquo;{folder.name}&rdquo;
          </p>
        </div>

        <form onSubmit={handleUnlock} className="space-y-3">
          <div className="relative">
            <input
              type="password"
              maxLength={6}
              autoFocus
              value={pinInput}
              onChange={(e) => {
                setPinInput(e.target.value);
                setError(false);
              }}
              placeholder="••••"
              className="w-full text-center tracking-[0.4em] text-xl font-bold bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-3 text-slate-100 focus:outline-none focus:border-indigo-500 transition shadow-inner font-mono"
            />
          </div>

          {error && (
            <div className="flex items-center justify-center space-x-1.5 text-xs text-rose-400 animate-shake">
              <AlertCircle size={13} />
              <span>Incorrect PIN. Please try again.</span>
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-1.5"
            >
              <KeyRound size={14} />
              <span>Unlock</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
