import React, { useState, useEffect } from 'react';
import { X, Lock, Shield, Check, Palette, Folder } from 'lucide-react';
import { FolderItem } from '../types';
import { colorThemeMap } from '../utils';

interface FolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (folder: { name: string; color: string; pin: string; parentId: string | null }) => void;
  editingFolder?: FolderItem | null;
  currentFolderId: string | null;
  allFolders: FolderItem[];
}

const AVAILABLE_COLORS = ['indigo', 'emerald', 'amber', 'rose', 'purple', 'sky'];

export const FolderModal: React.FC<FolderModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingFolder,
  currentFolderId,
  allFolders,
}) => {
  const [name, setName] = useState('');
  const [color, setColor] = useState('indigo');
  const [hasPin, setHasPin] = useState(false);
  const [pin, setPin] = useState('');
  const [parentId, setParentId] = useState<string | null>(null);

  useEffect(() => {
    if (editingFolder) {
      setName(editingFolder.name);
      setColor(editingFolder.color || 'indigo');
      setHasPin(Boolean(editingFolder.pin && editingFolder.pin.length > 0));
      setPin(editingFolder.pin || '');
      setParentId(editingFolder.parentId);
    } else {
      setName('');
      setColor('indigo');
      setHasPin(false);
      setPin('');
      setParentId(currentFolderId);
    }
  }, [editingFolder, isOpen, currentFolderId]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      name: name.trim(),
      color,
      pin: hasPin ? pin.trim() : '',
      parentId: parentId || null,
    });
    onClose();
  };

  // Exclude current folder and its children from parent selector to prevent cyclic hierarchy
  const availableParents = allFolders.filter(
    (f) => !f.isTrash && (!editingFolder || f.id !== editingFolder.id)
  );

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <Folder size={18} />
            </div>
            <h3 className="text-base font-bold text-slate-100">
              {editingFolder ? 'Edit Folder & Security' : 'Create New Folder'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Folder Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Folder Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Travel 2026, Work Assets, Private"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition shadow-inner"
            />
          </div>

          {/* Color Tag Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2 flex items-center space-x-1.5">
              <Palette size={13} className="text-indigo-400" />
              <span>Folder Color Tag</span>
            </label>
            <div className="flex items-center space-x-3">
              {AVAILABLE_COLORS.map((c) => {
                const isSelected = color === c;
                const theme = colorThemeMap[c];
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-7 h-7 rounded-full ${theme.badge} transition-transform flex items-center justify-center ${
                      isSelected ? 'ring-2 ring-white scale-110 shadow-lg' : 'opacity-80 hover:opacity-100'
                    }`}
                  >
                    {isSelected && <Check size={14} className="text-white drop-shadow" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Parent Location Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Location / Parent Folder
            </label>
            <select
              value={parentId || ''}
              onChange={(e) => setParentId(e.target.value || null)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition"
            >
              <option value="">📁 Root Vault (Top Level)</option>
              {availableParents.map((f) => (
                <option key={f.id} value={f.id}>
                  📁 {f.name}
                </option>
              ))}
            </select>
          </div>

          {/* Security PIN Lock Section */}
          <div className="pt-3 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Shield size={16} className="text-amber-400" />
                <div>
                  <p className="text-xs font-semibold text-slate-200">Folder PIN Lock</p>
                  <p className="text-[10px] text-slate-400">
                    Protect folder with a security PIN code
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                id="folder-pin-checkbox"
                checked={hasPin}
                onChange={(e) => setHasPin(e.target.checked)}
                className="w-4 h-4 rounded bg-slate-950 border-slate-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
            </div>

            {hasPin && (
              <div className="mt-3 space-y-1.5 animate-in fade-in duration-150">
                <input
                  type="password"
                  maxLength={6}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="Enter 4-6 digit numeric PIN (e.g. 1234)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 font-mono tracking-wider focus:outline-none focus:border-amber-500 transition shadow-inner"
                />
                <p className="text-[10px] text-amber-400/90">
                  ⚠️ Remember this PIN! It will be required every time you open this folder.
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition shadow-md shadow-indigo-600/30"
            >
              {editingFolder ? 'Update Folder' : 'Create Folder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
