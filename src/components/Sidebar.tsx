import React from 'react';
import { 
  FolderClosed, 
  Trash2, 
  Download, 
  Upload, 
  ChevronLeft, 
  ChevronRight,
  ShieldCheck,
  HardDrive
} from 'lucide-react';
import { FolderItem, ImageItem } from '../types';

interface SidebarProps {
  currentView: 'folders' | 'trash';
  onSwitchView: (view: 'folders' | 'trash') => void;
  folders: FolderItem[];
  images: ImageItem[];
  isCompact: boolean;
  onToggleCompact: () => void;
  onExportBackup: () => void;
  onImportBackup: (e: React.ChangeEvent<HTMLInputElement>) => void;
  serverSynced: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onSwitchView,
  folders,
  images,
  isCompact,
  onToggleCompact,
  onExportBackup,
  onImportBackup,
  serverSynced,
}) => {
  const activeFoldersCount = folders.filter((f) => !f.isTrash).length;
  const trashItemsCount =
    folders.filter((f) => f.isTrash).length + images.filter((i) => i.isTrash).length;
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  return (
    <aside
      id="app-sidebar"
      className={`${
        isCompact ? 'w-20' : 'w-64'
      } bg-slate-900 border-r border-slate-800 flex flex-col z-20 transition-all duration-300 relative select-none`}
    >
      {/* App Logo & Toggle Button */}
      <div className="p-4 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center space-x-3 overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 shrink-0">
            <span className="font-extrabold text-xl text-white tracking-tight">e</span>
          </div>
          {!isCompact && (
            <div className="whitespace-nowrap overflow-hidden">
              <h1 className="text-xl font-bold tracking-wider bg-gradient-to-r from-indigo-400 to-violet-300 bg-clip-text text-transparent">
                ebya
              </h1>
              <p className="text-[11px] text-slate-400">Personal Image Vault</p>
            </div>
          )}
        </div>

        {/* Sidebar Compact Toggle Button */}
        <button
          id="toggle-sidebar-btn"
          onClick={onToggleCompact}
          title={isCompact ? 'Expand Sidebar' : 'Collapse Sidebar'}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
        >
          {isCompact ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Navigation Section */}
      <div className="p-3 flex-1 overflow-y-auto space-y-6">
        <div>
          {!isCompact && (
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 px-3">
              Navigation
            </p>
          )}
          <nav className="space-y-1.5">
            {/* Folders Button */}
            <button
              id="nav-folders-btn"
              onClick={() => onSwitchView('folders')}
              title="Folders"
              className={`w-full flex items-center ${
                isCompact ? 'justify-center p-3' : 'justify-between px-3 py-2.5'
              } rounded-xl text-sm font-medium transition ${
                currentView === 'folders'
                  ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30 shadow-sm shadow-indigo-500/10'
                  : 'text-slate-400 hover:bg-slate-800/70 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center space-x-3">
                <FolderClosed size={18} className={currentView === 'folders' ? 'text-indigo-400' : 'text-slate-400'} />
                {!isCompact && <span>Folders</span>}
              </div>
              {!isCompact && (
                <span className="text-xs bg-slate-800 px-2 py-0.5 rounded-full text-slate-400 font-semibold">
                  {activeFoldersCount}
                </span>
              )}
            </button>

            {/* Recycle Bin Button */}
            <button
              id="nav-trash-btn"
              onClick={() => onSwitchView('trash')}
              title="Recycle Bin"
              className={`w-full flex items-center ${
                isCompact ? 'justify-center p-3' : 'justify-between px-3 py-2.5'
              } rounded-xl text-sm font-medium transition ${
                currentView === 'trash'
                  ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30 shadow-sm'
                  : 'text-slate-400 hover:bg-slate-800/70 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Trash2 size={18} className={currentView === 'trash' ? 'text-indigo-400' : 'text-slate-400'} />
                {!isCompact && <span>Recycle Bin</span>}
              </div>
              {!isCompact && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                    trashItemsCount > 0
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {trashItemsCount}
                </span>
              )}
            </button>
          </nav>
        </div>

        {/* Data Tools */}
        <div className="space-y-1.5 pt-4 border-t border-slate-800/80">
          {!isCompact && (
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 px-3">
              Backup & Sync
            </p>
          )}

          <button
            id="export-backup-btn"
            onClick={onExportBackup}
            title="Export JSON Backup"
            className={`w-full text-left rounded-xl text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-slate-200 flex items-center ${
              isCompact ? 'justify-center p-3' : 'px-3 py-2.5 space-x-3'
            } transition`}
          >
            <Download size={16} className="text-indigo-400" />
            {!isCompact && <span>Export Backup</span>}
          </button>

          <button
            id="import-backup-btn"
            onClick={() => fileInputRef.current?.click()}
            title="Restore from JSON Backup"
            className={`w-full text-left rounded-xl text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-slate-200 flex items-center ${
              isCompact ? 'justify-center p-3' : 'px-3 py-2.5 space-x-3'
            } transition`}
          >
            <Upload size={16} className="text-emerald-400" />
            {!isCompact && <span>Restore Backup</span>}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={onImportBackup}
          />
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/40 text-xs">
        <div className="flex items-center space-x-2">
          <div
            className={`w-2 h-2 rounded-full ${
              serverSynced ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50' : 'bg-amber-500 animate-pulse'
            }`}
          />
          {!isCompact && (
            <span className="text-[11px] text-slate-400 font-medium">
              {serverSynced ? 'Node.js Backend Synced' : 'Syncing Backend...'}
            </span>
          )}
        </div>
      </div>
    </aside>
  );
};
