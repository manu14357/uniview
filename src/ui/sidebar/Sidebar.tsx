import type { SidebarProps } from './sidebar.types';

/**
 * Collapsible sidebar shell — 280px wide with smooth slide transition.
 */
export default function Sidebar({ open, children }: SidebarProps) {
  return (
    <aside
      className={`flex-shrink-0 overflow-hidden border-r border-gray-200 bg-gray-50 transition-all duration-200 dark:border-gray-700 dark:bg-gray-850 ${
        open ? 'w-[280px]' : 'w-0'
      }`}
      role="complementary"
      aria-label="Document sidebar"
      aria-hidden={!open}
    >
      <div className="flex h-full w-[280px] flex-col overflow-y-auto">
        {children}
      </div>
    </aside>
  );
}
