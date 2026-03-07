export interface ToolbarProps {
  toolbar?: boolean;
  sidebar?: boolean;
  annotations?: boolean;
  onToggleSidebar?: () => void;
  onToggleAnnotations?: () => void;
  onFullscreen?: () => void;
  onDownload?: () => void;
  onPrint?: () => void;
}
