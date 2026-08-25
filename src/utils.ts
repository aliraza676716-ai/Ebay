import { FolderItem, ImageItem } from './types';

export function formatBytes(bytes: number, decimals: number = 1): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export const colorThemeMap: Record<string, { bg: string; text: string; border: string; ring: string; badge: string }> = {
  indigo: {
    bg: 'bg-indigo-500/10 hover:bg-indigo-500/20',
    text: 'text-indigo-400',
    border: 'border-indigo-500/30',
    ring: 'ring-indigo-500',
    badge: 'bg-indigo-500',
  },
  emerald: {
    bg: 'bg-emerald-500/10 hover:bg-emerald-500/20',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
    ring: 'ring-emerald-500',
    badge: 'bg-emerald-500',
  },
  amber: {
    bg: 'bg-amber-500/10 hover:bg-amber-500/20',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
    ring: 'ring-amber-500',
    badge: 'bg-amber-500',
  },
  rose: {
    bg: 'bg-rose-500/10 hover:bg-rose-500/20',
    text: 'text-rose-400',
    border: 'border-rose-500/30',
    ring: 'ring-rose-500',
    badge: 'bg-rose-500',
  },
  purple: {
    bg: 'bg-purple-500/10 hover:bg-purple-500/20',
    text: 'text-purple-400',
    border: 'border-purple-500/30',
    ring: 'ring-purple-500',
    badge: 'bg-purple-500',
  },
  sky: {
    bg: 'bg-sky-500/10 hover:bg-sky-500/20',
    text: 'text-sky-400',
    border: 'border-sky-500/30',
    ring: 'ring-sky-500',
    badge: 'bg-sky-500',
  },
};

export function downloadImageFile(dataUrl: string, filename: string) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename || 'download.png';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
