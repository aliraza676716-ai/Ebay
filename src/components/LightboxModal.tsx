import React, { useState, useEffect } from 'react';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  Trash2, 
  FolderInput, 
  Tag, 
  Check, 
  FileText,
  Calendar,
  Layers
} from 'lucide-react';
import { FolderItem, ImageItem } from '../types';
import { formatBytes, downloadImageFile } from '../utils';

interface LightboxModalProps {
  isOpen: boolean;
  images: ImageItem[];
  currentIndex: number;
  folders: FolderItem[];
  onClose: () => void;
  onNavigate: (newIndex: number) => void;
  onUpdateImage: (id: string, updates: Partial<ImageItem>) => void;
  onDeleteImage: (id: string) => void;
}

export const LightboxModal: React.FC<LightboxModalProps> = ({
  isOpen,
  images,
  currentIndex,
  folders,
  onClose,
  onNavigate,
  onUpdateImage,
  onDeleteImage,
}) => {
  const currentImage = images[currentIndex];
  const [tagInput, setTagInput] = useState('');
  const [tagsSaved, setTagsSaved] = useState(false);

  useEffect(() => {
    if (currentImage) {
      setTagInput(currentImage.tags || '');
    }
  }, [currentImage]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onNavigate((currentIndex - 1 + images.length) % images.length);
      if (e.key === 'ArrowRight') onNavigate((currentIndex + 1) % images.length);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, images.length, onClose, onNavigate]);

  if (!isOpen || !currentImage) return null;

  const validFolders = folders.filter((f) => !f.isTrash);

  const handleTagsBlur = () => {
    if (tagInput !== currentImage.tags) {
      onUpdateImage(currentImage.id, { tags: tagInput });
      setTagsSaved(true);
      setTimeout(() => setTagsSaved(false), 2000);
    }
  };

  const handleMoveFolder = (targetFolderId: string) => {
    onUpdateImage(currentImage.id, { folderId: targetFolderId || null });
  };

  return (
    <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-md z-50 flex flex-col select-none animate-in fade-in duration-150">
      {/* Top Header Bar */}
      <div className="p-4 flex items-center justify-between border-b border-slate-800/80 bg-slate-900/60">
        <div className="flex items-center space-x-3 min-w-0">
          <div className="flex items-center space-x-2 truncate">
            <span className="text-sm font-semibold text-slate-200 truncate max-w-xs sm:max-w-md">
              {currentImage.name}
            </span>
          </div>
          <span className="text-xs text-slate-500 hidden sm:inline-block">
            • {formatBytes(currentImage.size)} • {new Date(currentImage.createdAt).toLocaleDateString()}
          </span>
          <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-medium">
            {currentIndex + 1} of {images.length}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {/* Download Button */}
          <button
            onClick={() => downloadImageFile(currentImage.dataUrl, currentImage.name)}
            title="Download Image"
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <Download size={18} />
          </button>

          {/* Delete to Trash Button */}
          <button
            onClick={() => {
              onDeleteImage(currentImage.id);
              if (images.length <= 1) {
                onClose();
              } else {
                onNavigate(Math.min(currentIndex, images.length - 2));
              }
            }}
            title={currentImage.isTrash ? 'Permanently Delete' : 'Move to Trash'}
            className="p-2 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition"
          >
            <Trash2 size={18} />
          </button>

          {/* Close Lightbox */}
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Main Image Stage with Navigation */}
      <div className="flex-1 flex items-center justify-center p-4 relative overflow-hidden">
        {images.length > 1 && (
          <button
            onClick={() => onNavigate((currentIndex - 1 + images.length) % images.length)}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 bg-slate-900/90 border border-slate-700/60 rounded-full text-slate-300 hover:text-white flex items-center justify-center z-10 transition hover:scale-110 shadow-xl"
            title="Previous Image (Left Arrow)"
          >
            <ChevronLeft size={22} />
          </button>
        )}

        <div className="relative max-w-full max-h-full flex items-center justify-center p-2">
          <img
            src={currentImage.dataUrl}
            alt={currentImage.name}
            className="max-h-[75vh] max-w-full object-contain rounded-xl shadow-2xl border border-slate-800/80"
          />
        </div>

        {images.length > 1 && (
          <button
            onClick={() => onNavigate((currentIndex + 1) % images.length)}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 bg-slate-900/90 border border-slate-700/60 rounded-full text-slate-300 hover:text-white flex items-center justify-center z-10 transition hover:scale-110 shadow-xl"
            title="Next Image (Right Arrow)"
          >
            <ChevronRight size={22} />
          </button>
        )}
      </div>

      {/* Bottom Metadata & Tools Bar */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-900/70 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
        {/* Move to folder */}
        <div className="flex items-center space-x-2">
          <FolderInput size={14} className="text-indigo-400" />
          <span className="text-slate-300 font-medium">Folder:</span>
          <select
            value={currentImage.folderId || ''}
            onChange={(e) => handleMoveFolder(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
          >
            <option value="">📁 Root Gallery</option>
            {validFolders.map((f) => (
              <option key={f.id} value={f.id}>
                📁 {f.name}
              </option>
            ))}
          </select>
        </div>

        {/* Tags management */}
        <div className="flex items-center space-x-2 flex-1 max-w-md">
          <Tag size={14} className="text-violet-400 shrink-0" />
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onBlur={handleTagsBlur}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleTagsBlur();
            }}
            placeholder="Add search tags separated by commas (e.g. travel, summer)..."
            className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-1.5 w-full focus:outline-none focus:border-indigo-500"
          />
          {tagsSaved && (
            <span className="text-emerald-400 flex items-center space-x-1 text-[11px] shrink-0">
              <Check size={12} />
              <span>Saved</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
