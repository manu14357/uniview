export interface SidebarProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export type SidebarTab = 'thumbnails' | 'bookmarks' | 'layers';
