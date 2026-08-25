export interface FolderItem {
  id: string;
  name: string;
  color: 'indigo' | 'emerald' | 'amber' | 'rose' | 'purple' | 'sky' | string;
  parentId: string | null;
  pin: string;
  isTrash: boolean;
  createdAt: number;
}

export interface ImageItem {
  id: string;
  folderId: string | null;
  name: string;
  size: number;
  type: string;
  dataUrl: string;
  isTrash: boolean;
  tags: string;
  createdAt: number;
}

export interface VaultState {
  folders: FolderItem[];
  images: ImageItem[];
  currentView: 'folders' | 'trash';
  currentFolderId: string | null;
  currentLayout: 'grid' | 'list';
  searchQuery: string;
  isSidebarCompact: boolean;
}
