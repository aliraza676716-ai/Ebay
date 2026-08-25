import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Folder, 
  FolderLock, 
  FolderPlus, 
  CloudUpload, 
  LayoutGrid, 
  List, 
  MoreVertical, 
  Edit, 
  Trash2, 
  RotateCcw, 
  Download, 
  Tag, 
  FolderOpen, 
  Lock, 
  Check, 
  Sparkles, 
  Layers
} from 'lucide-react';
import { FolderItem, ImageItem } from './types';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { FolderModal } from './components/FolderModal';
import { LockPinModal } from './components/LockPinModal';
import { LightboxModal } from './components/LightboxModal';
import { ToastContainer, ToastMessage } from './components/Toast';
import { colorThemeMap, formatBytes, downloadImageFile } from './utils';

export default function App() {
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [images, setImages] = useState<ImageItem[]>([]);
  const [currentView, setCurrentView] = useState<'folders' | 'trash'>('folders');
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [currentLayout, setCurrentLayout] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarCompact, setIsSidebarCompact] = useState(false);
  const [serverSynced, setServerSynced] = useState(false);

  // Modals & UI States
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<FolderItem | null>(null);
  const [lockModalFolder, setLockModalFolder] = useState<FolderItem | null>(null);
  const [unlockedFolderIds, setUnlockedFolderIds] = useState<Set<string>>(new Set());
  const [activeMenuFolderId, setActiveMenuFolderId] = useState<string | null>(null);

  // Lightbox
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Drag & Drop overlay
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const fileUploadInputRef = useRef<HTMLInputElement>(null);

  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = 'toast_' + Date.now() + '_' + Math.random().toString(36).slice(2, 5);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Fetch all Vault data from the Node.js Express backend
  const fetchVaultData = useCallback(async () => {
    try {
      const res = await fetch('/api/vault');
      if (res.ok) {
        const data = await res.json();
        setFolders(data.folders || []);
        setImages(data.images || []);
        setServerSynced(true);
      } else {
        setServerSynced(false);
      }
    } catch (err) {
      console.warn('Backend fetch error, retrying in background:', err);
      setServerSynced(false);
    }
  }, []);

  useEffect(() => {
    fetchVaultData();
    const interval = setInterval(fetchVaultData, 10000);
    return () => clearInterval(interval);
  }, [fetchVaultData]);

  // Close context menu on outside click
  useEffect(() => {
    const handleWindowClick = () => {
      setActiveMenuFolderId(null);
    };
    window.addEventListener('click', handleWindowClick);
    return () => window.removeEventListener('click', handleWindowClick);
  }, []);

  // Folder actions
  const handleSaveFolder = async (folderData: {
    name: string;
    color: string;
    pin: string;
    parentId: string | null;
  }) => {
    try {
      if (editingFolder) {
        const res = await fetch(`/api/folders/${editingFolder.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(folderData),
        });
        if (res.ok) {
          const updated = await res.json();
          setFolders((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
          addToast('Folder updated successfully', 'success');
        }
      } else {
        const res = await fetch('/api/folders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(folderData),
        });
        if (res.ok) {
          const created = await res.json();
          setFolders((prev) => [...prev, created]);
          addToast('New folder created', 'success');
        }
      }
    } catch (err) {
      addToast('Failed to save folder', 'error');
    }
  };

  const handleFolderClick = (folder: FolderItem) => {
    if (folder.pin && !unlockedFolderIds.has(folder.id)) {
      setLockModalFolder(folder);
    } else {
      setCurrentFolderId(folder.id);
      setCurrentView('folders');
    }
  };

  const handleUnlockFolder = (folderId: string) => {
    setUnlockedFolderIds((prev) => new Set(prev).add(folderId));
    setCurrentFolderId(folderId);
    setCurrentView('folders');
    addToast('Folder unlocked', 'success');
  };

  const handleToggleTrashFolder = async (folder: FolderItem) => {
    const isMovingToTrash = !folder.isTrash;
    try {
      const res = await fetch(`/api/folders/${folder.id}/trash`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isTrash: isMovingToTrash }),
      });
      if (res.ok) {
        const updated = await res.json();
        setFolders((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
        addToast(
          isMovingToTrash ? 'Folder moved to Recycle Bin' : 'Folder restored',
          'info'
        );
      }
    } catch (err) {
      addToast('Action failed', 'error');
    }
  };

  const handleDeleteFolderPermanent = async (folderId: string) => {
    try {
      const res = await fetch(`/api/folders/${folderId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setFolders((prev) => prev.filter((f) => f.id !== folderId));
        setImages((prev) => prev.filter((img) => img.folderId !== folderId));
        addToast('Folder deleted permanently', 'info');
      }
    } catch (err) {
      addToast('Failed to delete folder', 'error');
    }
  };

  // Image Upload handler
  const handleUploadFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (fileArray.length === 0) return;

    addToast(`Uploading ${fileArray.length} image(s)...`, 'info');

    const imagePayloads: Partial<ImageItem>[] = [];

    for (const file of fileArray) {
      const dataUrl = await readFileAsDataURL(file);
      imagePayloads.push({
        folderId: currentFolderId,
        name: file.name,
        size: file.size,
        type: file.type,
        dataUrl,
        tags: '',
        createdAt: Date.now(),
      });
    }

    try {
      const res = await fetch('/api/images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images: imagePayloads }),
      });
      if (res.ok) {
        const addedImages: ImageItem[] = await res.json();
        setImages((prev) => [...prev, ...addedImages]);
        addToast('All images uploaded and saved to server!', 'success');
      }
    } catch (err) {
      addToast('Error uploading images to backend', 'error');
    }
  };

  const readFileAsDataURL = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.readAsDataURL(file);
    });
  };

  // Image update / trash actions
  const handleUpdateImage = async (id: string, updates: Partial<ImageItem>) => {
    try {
      const res = await fetch(`/api/images/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const updated = await res.json();
        setImages((prev) => prev.map((img) => (img.id === updated.id ? updated : img)));
      }
    } catch (err) {
      addToast('Failed to update image', 'error');
    }
  };

  const handleToggleTrashImage = async (img: ImageItem) => {
    const isMovingToTrash = !img.isTrash;
    try {
      const res = await fetch(`/api/images/${img.id}/trash`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isTrash: isMovingToTrash }),
      });
      if (res.ok) {
        const updated = await res.json();
        setImages((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
        addToast(
          isMovingToTrash ? 'Image moved to Recycle Bin' : 'Image restored',
          'info'
        );
      }
    } catch (err) {
      addToast('Action failed', 'error');
    }
  };

  const handleDeleteImagePermanent = async (id: string) => {
    try {
      const res = await fetch(`/api/images/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setImages((prev) => prev.filter((i) => i.id !== id));
        addToast('Image permanently deleted', 'info');
      }
    } catch (err) {
      addToast('Failed to delete image', 'error');
    }
  };

  const handleEmptyTrash = async () => {
    try {
      const res = await fetch('/api/trash/empty', { method: 'POST' });
      if (res.ok) {
        setFolders((prev) => prev.filter((f) => !f.isTrash));
        setImages((prev) => prev.filter((i) => !i.isTrash));
        addToast('Recycle Bin emptied', 'success');
      }
    } catch (err) {
      addToast('Failed to empty Recycle Bin', 'error');
    }
  };

  // Backups
  const handleExportBackup = () => {
    window.location.href = '/api/backup/export';
    addToast('Vault backup downloaded', 'success');
  };

  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!data.folders || !data.images) {
        addToast('Invalid backup file format', 'error');
        return;
      }

      const res = await fetch('/api/backup/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        addToast('Backup restored successfully!', 'success');
        fetchVaultData();
      }
    } catch (err) {
      addToast('Error restoring backup file', 'error');
    }
    e.target.value = '';
  };

  // Navigation handlers
  const handleGoBack = () => {
    if (currentView === 'trash') {
      setCurrentView('folders');
      return;
    }
    if (!currentFolderId) return;
    const curr = folders.find((f) => f.id === currentFolderId);
    setCurrentFolderId(curr ? curr.parentId : null);
  };

  // Drag and Drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current += 1;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current -= 1;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUploadFiles(e.dataTransfer.files);
    }
  };

  // Filter items based on current view & search query
  const cleanSearch = searchQuery.trim().toLowerCase();

  let displayedFolders: FolderItem[] = [];
  let displayedImages: ImageItem[] = [];

  if (currentView === 'folders') {
    if (!currentFolderId) {
      displayedFolders = folders.filter((f) => !f.isTrash && !f.parentId);
      displayedImages = images.filter((i) => !i.isTrash && !i.folderId);
    } else {
      displayedFolders = folders.filter((f) => !f.isTrash && f.parentId === currentFolderId);
      displayedImages = images.filter((i) => !i.isTrash && i.folderId === currentFolderId);
    }
  } else if (currentView === 'trash') {
    displayedFolders = folders.filter((f) => f.isTrash);
    displayedImages = images.filter((i) => i.isTrash);
  }

  if (cleanSearch) {
    displayedFolders = displayedFolders.filter((f) =>
      f.name.toLowerCase().includes(cleanSearch)
    );
    displayedImages = displayedImages.filter(
      (img) =>
        img.name.toLowerCase().includes(cleanSearch) ||
        (img.tags && img.tags.toLowerCase().includes(cleanSearch))
    );
  }

  const currentFolder = folders.find((f) => f.id === currentFolderId);

  return (
    <div
      className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans select-none"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Sidebar */}
      <Sidebar
        currentView={currentView}
        onSwitchView={(v) => {
          setCurrentView(v);
          setCurrentFolderId(null);
        }}
        folders={folders}
        images={images}
        isCompact={isSidebarCompact}
        onToggleCompact={() => setIsSidebarCompact(!isSidebarCompact)}
        onExportBackup={handleExportBackup}
        onImportBackup={handleImportBackup}
        serverSynced={serverSynced}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-950 relative">
        {/* Header */}
        <Header
          currentView={currentView}
          currentFolderId={currentFolderId}
          folders={folders}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onNavigateFolder={(id) => setCurrentFolderId(id)}
          onGoBack={handleGoBack}
          onOpenCreateFolder={() => {
            setEditingFolder(null);
            setIsFolderModalOpen(true);
          }}
          onTriggerUpload={() => fileUploadInputRef.current?.click()}
          serverSynced={serverSynced}
        />

        {/* Hidden Multi-file input */}
        <input
          ref={fileUploadInputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            if (e.target.files) handleUploadFiles(e.target.files);
            e.target.value = '';
          }}
        />

        {/* Toolbar Bar */}
        <div className="px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 bg-slate-900/30">
          <div className="flex items-center space-x-3">
            <h2 className="text-base font-bold text-slate-100 flex items-center space-x-2">
              <span>
                {currentView === 'trash'
                  ? 'Recycle Bin'
                  : currentFolder
                  ? currentFolder.name
                  : 'Folders & Photos'}
              </span>
              {currentFolder?.pin && <Lock size={14} className="text-amber-400" />}
            </h2>
            <span className="text-xs bg-slate-800 text-slate-400 px-2.5 py-0.5 rounded-full font-medium border border-slate-700/50">
              {displayedFolders.length + displayedImages.length} items
            </span>
          </div>

          <div className="flex items-center space-x-3">
            {/* Trash Action */}
            {currentView === 'trash' && displayedFolders.length + displayedImages.length > 0 && (
              <button
                onClick={handleEmptyTrash}
                className="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition"
              >
                <Trash2 size={13} />
                <span>Empty Recycle Bin</span>
              </button>
            )}

            {/* Grid vs List View toggle */}
            <div className="flex items-center bg-slate-900 rounded-xl p-1 border border-slate-800 shadow-inner">
              <button
                id="view-mode-grid"
                onClick={() => setCurrentLayout('grid')}
                className={`px-2.5 py-1 rounded-lg text-xs transition ${
                  currentLayout === 'grid'
                    ? 'text-indigo-400 bg-slate-800 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Grid Layout"
              >
                <LayoutGrid size={15} />
              </button>
              <button
                id="view-mode-list"
                onClick={() => setCurrentLayout('list')}
                className={`px-2.5 py-1 rounded-lg text-xs transition ${
                  currentLayout === 'list'
                    ? 'text-indigo-400 bg-slate-800 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="List Layout"
              >
                <List size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Vault Content Stage */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar relative">
          {/* Drag & Drop Visual Overlay */}
          {isDragging && (
            <div className="absolute inset-0 bg-indigo-950/80 backdrop-blur-sm z-40 flex flex-col items-center justify-center border-4 border-dashed border-indigo-500 rounded-3xl m-4 animate-in fade-in duration-200 pointer-events-none">
              <CloudUpload size={54} className="text-indigo-400 mb-3 animate-bounce" />
              <p className="text-xl font-bold text-white">Drop images anywhere to upload</p>
              <p className="text-xs text-indigo-300 mt-1">
                Images will be saved directly into current folder location
              </p>
            </div>
          )}

          {/* Folders Section */}
          {displayedFolders.length > 0 && (
            <div className="mb-8">
              <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3.5 flex items-center space-x-1.5">
                <FolderOpen size={13} className="text-indigo-400" />
                <span>Folders ({displayedFolders.length})</span>
              </h3>

              {currentLayout === 'grid' ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {displayedFolders.map((folder) => {
                    const theme = colorThemeMap[folder.color] || colorThemeMap.indigo;
                    const photoCount = images.filter(
                      (i) => i.folderId === folder.id && !i.isTrash
                    ).length;
                    const isLocked = Boolean(folder.pin && folder.pin.length > 0);

                    return (
                      <div
                        key={folder.id}
                        onClick={() => handleFolderClick(folder)}
                        className={`group relative ${theme.bg} ${theme.border} border rounded-2xl p-4 cursor-pointer hover:scale-[1.02] transition-all duration-200 shadow-lg`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-900/60 flex items-center justify-center border border-slate-700/40">
                            {isLocked ? (
                              <FolderLock size={22} className="text-amber-400" />
                            ) : (
                              <Folder size={22} className={theme.text} />
                            )}
                          </div>

                          {/* Context menu button */}
                          <div
                            className="relative"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuFolderId(
                                activeMenuFolderId === folder.id ? null : folder.id
                              );
                            }}
                          >
                            <button
                              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/80 transition"
                              title="Folder Actions"
                            >
                              <MoreVertical size={16} />
                            </button>

                            {activeMenuFolderId === folder.id && (
                              <div className="absolute right-0 top-7 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-30 py-1 w-40 text-xs animate-in fade-in duration-100">
                                <button
                                  onClick={() => {
                                    setEditingFolder(folder);
                                    setIsFolderModalOpen(true);
                                    setActiveMenuFolderId(null);
                                  }}
                                  className="w-full text-left px-3 py-2 hover:bg-slate-800 text-slate-300 flex items-center space-x-2"
                                >
                                  <Edit size={13} className="text-indigo-400" />
                                  <span>Edit / Security</span>
                                </button>
                                <button
                                  onClick={() => {
                                    handleToggleTrashFolder(folder);
                                    setActiveMenuFolderId(null);
                                  }}
                                  className="w-full text-left px-3 py-2 hover:bg-slate-800 text-rose-400 flex items-center space-x-2"
                                >
                                  {folder.isTrash ? (
                                    <>
                                      <RotateCcw size={13} />
                                      <span>Restore Folder</span>
                                    </>
                                  ) : (
                                    <>
                                      <Trash2 size={13} />
                                      <span>Move to Trash</span>
                                    </>
                                  )}
                                </button>
                                {folder.isTrash && (
                                  <button
                                    onClick={() => {
                                      handleDeleteFolderPermanent(folder.id);
                                      setActiveMenuFolderId(null);
                                    }}
                                    className="w-full text-left px-3 py-2 hover:bg-slate-800 text-rose-500 font-semibold flex items-center space-x-2 border-t border-slate-800"
                                  >
                                    <Trash2 size={13} />
                                    <span>Delete Permanent</span>
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-xs text-slate-200 truncate">
                            {folder.name}
                          </h4>
                          {isLocked && <Lock size={11} className="text-amber-400 shrink-0 ml-1" />}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5 font-medium">
                          {photoCount} {photoCount === 1 ? 'photo' : 'photos'}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Folders List Layout */
                <div className="space-y-2">
                  {displayedFolders.map((folder) => {
                    const theme = colorThemeMap[folder.color] || colorThemeMap.indigo;
                    const photoCount = images.filter(
                      (i) => i.folderId === folder.id && !i.isTrash
                    ).length;
                    const isLocked = Boolean(folder.pin && folder.pin.length > 0);

                    return (
                      <div
                        key={folder.id}
                        onClick={() => handleFolderClick(folder)}
                        className={`flex items-center justify-between p-3.5 ${theme.bg} ${theme.border} border rounded-xl hover:border-slate-700 cursor-pointer transition`}
                      >
                        <div className="flex items-center space-x-3.5 min-w-0">
                          {isLocked ? (
                            <FolderLock size={22} className="text-amber-400 shrink-0" />
                          ) : (
                            <Folder size={22} className={`${theme.text} shrink-0`} />
                          )}
                          <div className="truncate">
                            <div className="flex items-center space-x-2">
                              <p className="text-xs font-semibold text-slate-200 truncate">
                                {folder.name}
                              </p>
                              {isLocked && (
                                <span className="flex items-center space-x-1 text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                                  <Lock size={9} />
                                  <span>PIN</span>
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-400">
                              {photoCount} {photoCount === 1 ? 'photo' : 'photos'}
                            </p>
                          </div>
                        </div>

                        <div
                          className="flex items-center space-x-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => {
                              setEditingFolder(folder);
                              setIsFolderModalOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                            title="Edit / Security"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => handleToggleTrashFolder(folder)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition"
                            title={folder.isTrash ? 'Restore' : 'Move to Trash'}
                          >
                            {folder.isTrash ? <RotateCcw size={14} /> : <Trash2 size={14} />}
                          </button>
                          {folder.isTrash && (
                            <button
                              onClick={() => handleDeleteFolderPermanent(folder.id)}
                              className="p-1.5 text-rose-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition"
                              title="Delete Permanently"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Photos Section */}
          {displayedImages.length > 0 && (
            <div>
              <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3.5 flex items-center space-x-1.5">
                <Layers size={13} className="text-violet-400" />
                <span>Photos ({displayedImages.length})</span>
              </h3>

              {currentLayout === 'grid' ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {displayedImages.map((img, idx) => (
                    <div
                      key={img.id}
                      onClick={() => setLightboxIndex(idx)}
                      className="group relative bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden cursor-pointer hover:border-indigo-500/60 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-200"
                    >
                      <div className="aspect-square bg-slate-950 overflow-hidden relative">
                        <img
                          src={img.dataUrl}
                          alt={img.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                        {/* Hover Overlay Actions */}
                        <div className="absolute inset-0 bg-slate-950/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              downloadImageFile(img.dataUrl, img.name);
                            }}
                            className="w-8 h-8 rounded-full bg-slate-900/90 text-white flex items-center justify-center hover:scale-110 transition shadow-lg"
                            title="Download Photo"
                          >
                            <Download size={14} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleTrashImage(img);
                            }}
                            className="w-8 h-8 rounded-full bg-slate-900/90 text-rose-400 flex items-center justify-center hover:scale-110 transition shadow-lg"
                            title={img.isTrash ? 'Restore' : 'Move to Trash'}
                          >
                            {img.isTrash ? <RotateCcw size={14} /> : <Trash2 size={14} />}
                          </button>
                        </div>
                      </div>

                      <div className="p-2.5 bg-slate-900">
                        <p className="text-xs font-medium text-slate-200 truncate">{img.name}</p>
                        <div className="flex items-center justify-between mt-1 text-[10px] text-slate-400">
                          <span>{formatBytes(img.size)}</span>
                          {img.tags && (
                            <span className="flex items-center space-x-0.5 text-violet-400 truncate max-w-[80px]">
                              <Tag size={9} />
                              <span className="truncate">{img.tags}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Photos List Layout */
                <div className="space-y-2">
                  {displayedImages.map((img, idx) => (
                    <div
                      key={img.id}
                      onClick={() => setLightboxIndex(idx)}
                      className="flex items-center justify-between p-2.5 bg-slate-900 border border-slate-800 rounded-xl hover:border-slate-700 cursor-pointer transition"
                    >
                      <div className="flex items-center space-x-3.5 min-w-0">
                        <img
                          src={img.dataUrl}
                          alt={img.name}
                          className="w-12 h-12 rounded-lg object-cover bg-slate-950 border border-slate-800"
                        />
                        <div className="truncate">
                          <p className="text-xs font-medium text-slate-200 truncate">{img.name}</p>
                          <p className="text-[10px] text-slate-400">
                            {formatBytes(img.size)} • {new Date(img.createdAt).toLocaleDateString()}
                            {img.tags && ` • #${img.tags}`}
                          </p>
                        </div>
                      </div>

                      <div
                        className="flex items-center space-x-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => downloadImageFile(img.dataUrl, img.name)}
                          className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                          title="Download"
                        >
                          <Download size={14} />
                        </button>
                        <button
                          onClick={() => handleToggleTrashImage(img)}
                          className="p-2 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition"
                          title={img.isTrash ? 'Restore' : 'Move to Trash'}
                        >
                          {img.isTrash ? <RotateCcw size={14} /> : <Trash2 size={14} />}
                        </button>
                        {img.isTrash && (
                          <button
                            onClick={() => handleDeleteImagePermanent(img.id)}
                            className="p-2 text-rose-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition"
                            title="Delete Permanently"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Empty State */}
          {displayedFolders.length === 0 && displayedImages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-center select-none">
              <div className="w-20 h-20 bg-slate-900 rounded-3xl flex items-center justify-center text-slate-600 mb-4 border border-slate-800 shadow-xl">
                <FolderOpen size={36} />
              </div>
              <h3 className="text-base font-bold text-slate-200">
                {currentView === 'trash' ? 'Recycle Bin is empty' : 'No folders or images here'}
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                {currentView === 'trash'
                  ? 'Items moved to the Recycle Bin will appear here.'
                  : cleanSearch
                  ? `No items matched "${searchQuery}". Try clearing search.`
                  : 'Create a new folder or drag & drop images to organize your personal media in ebya.'}
              </p>

              {currentView === 'folders' && !cleanSearch && (
                <div className="flex items-center space-x-3 mt-5">
                  <button
                    onClick={() => {
                      setEditingFolder(null);
                      setIsFolderModalOpen(true);
                    }}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition"
                  >
                    Create Folder
                  </button>
                  <button
                    onClick={() => fileUploadInputRef.current?.click()}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30 transition"
                  >
                    Upload Images
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Folder Creation / Edit Modal */}
      <FolderModal
        isOpen={isFolderModalOpen}
        onClose={() => {
          setIsFolderModalOpen(false);
          setEditingFolder(null);
        }}
        onSave={handleSaveFolder}
        editingFolder={editingFolder}
        currentFolderId={currentFolderId}
        allFolders={folders}
      />

      {/* Folder PIN Unlock Security Modal */}
      <LockPinModal
        isOpen={Boolean(lockModalFolder)}
        folder={lockModalFolder}
        onClose={() => setLockModalFolder(null)}
        onUnlock={handleUnlockFolder}
      />

      {/* Fullscreen Lightbox Modal */}
      {lightboxIndex !== null && (
        <LightboxModal
          isOpen={lightboxIndex !== null}
          images={displayedImages}
          currentIndex={lightboxIndex}
          folders={folders}
          onClose={() => setLightboxIndex(null)}
          onNavigate={(newIdx) => setLightboxIndex(newIdx)}
          onUpdateImage={handleUpdateImage}
          onDeleteImage={(id) => {
            const img = images.find((i) => i.id === id);
            if (img) handleToggleTrashImage(img);
          }}
        />
      )}

      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}
