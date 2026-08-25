import React from 'react';
import { 
  ArrowLeft, 
  Home, 
  ChevronRight, 
  Search, 
  FolderPlus, 
  CloudUpload, 
  Database,
  Lock
} from 'lucide-react';
import { FolderItem } from '../types';

interface HeaderProps {
  currentView: 'folders' | 'trash';
  currentFolderId: string | null;
  folders: FolderItem[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onNavigateFolder: (id: string | null) => void;
  onGoBack: () => void;
  onOpenCreateFolder: () => void;
  onTriggerUpload: () => void;
  serverSynced: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  currentFolderId,
  folders,
  searchQuery,
  onSearchChange,
  onNavigateFolder,
  onGoBack,
  onOpenCreateFolder,
  onTriggerUpload,
  serverSynced,
}) => {
  // Compute breadcrumb path
  const getBreadcrumbs = () => {
    if (!currentFolderId) return [];
    const crumbs: FolderItem[] = [];
    let curr = folders.find((f) => f.id === currentFolderId);
    while (curr) {
      crumbs.unshift(curr);
      curr = folders.find((f) => f.id === curr?.parentId);
    }
    return crumbs;
  };

  const breadcrumbs = getBreadcrumbs();
  const showBackButton = currentView === 'trash' || Boolean(currentFolderId);

  return (
    <header className="h-16 border-b border-slate-800 px-6 flex items-center justify-between bg-slate-900/80 backdrop-blur-md sticky top-0 z-10 select-none">
      {/* Left: Back Button & Breadcrumbs */}
      <div className="flex items-center space-x-3 min-w-0">
        {showBackButton && (
          <button
            id="header-back-btn"
            onClick={onGoBack}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition"
            title="Go Back"
          >
            <ArrowLeft size={14} className="text-indigo-400" />
            <span className="hidden sm:inline">Back</span>
          </button>
        )}

        <div id="breadcrumbs" className="flex items-center space-x-2 text-sm font-medium text-slate-400 overflow-x-auto custom-scrollbar py-1">
          <button
            id="breadcrumb-root"
            onClick={() => onNavigateFolder(null)}
            className="hover:text-white flex items-center space-x-1 transition text-slate-300"
            title="Root Gallery"
          >
            <Home size={15} className="text-indigo-400" />
            <span className="text-xs">Root</span>
          </button>

          {currentView === 'trash' ? (
            <>
              <ChevronRight size={12} className="text-slate-600 shrink-0" />
              <span className="text-rose-400 font-semibold text-xs shrink-0">Recycle Bin</span>
            </>
          ) : (
            breadcrumbs.map((crumb, idx) => {
              const isLast = idx === breadcrumbs.length - 1;
              return (
                <React.Fragment key={crumb.id}>
                  <ChevronRight size={12} className="text-slate-600 shrink-0" />
                  {isLast ? (
                    <span className="text-slate-100 font-semibold text-xs flex items-center space-x-1 shrink-0">
                      <span>{crumb.name}</span>
                      {crumb.pin && <Lock size={11} className="text-amber-400 ml-1" />}
                    </span>
                  ) : (
                    <button
                      onClick={() => onNavigateFolder(crumb.id)}
                      className="hover:text-white text-xs truncate max-w-[120px] transition text-slate-400"
                    >
                      {crumb.name}
                    </button>
                  )}
                </React.Fragment>
              );
            })
          )}
        </div>
      </div>

      {/* Center: Search Input Bar */}
      <div className="flex-1 max-w-md mx-4 hidden md:block">
        <div className="relative">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            id="search-box-input"
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search folders, photo names or #tags..."
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition shadow-inner"
          />
        </div>
      </div>

      {/* Right: Sync Status & Actions */}
      <div className="flex items-center space-x-3 shrink-0">
        {/* Backend Status Indicator */}
        <div
          id="backend-sync-indicator"
          className="hidden sm:flex items-center space-x-2 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs"
          title="Node.js Express Server Live Storage"
        >
          <span
            className={`w-2 h-2 rounded-full ${
              serverSynced ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50' : 'bg-amber-500 animate-pulse'
            }`}
          />
          <span className="text-[11px] font-medium text-slate-300">
            {serverSynced ? 'Server Synced' : 'Syncing...'}
          </span>
        </div>

        {currentView === 'folders' && (
          <div className="flex items-center space-x-2.5">
            {/* New Folder Button */}
            <button
              id="new-folder-btn"
              onClick={onOpenCreateFolder}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center space-x-2 border border-slate-700 transition shadow-sm"
            >
              <FolderPlus size={15} className="text-indigo-400" />
              <span className="hidden sm:inline">New Folder</span>
            </button>

            {/* Upload Images Button */}
            <button
              id="upload-images-btn"
              onClick={onTriggerUpload}
              className="px-4 py-2 bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl text-xs font-semibold flex items-center space-x-2 shadow-lg shadow-indigo-600/30 transition transform active:scale-95"
            >
              <CloudUpload size={15} />
              <span>Upload</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
