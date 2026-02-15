import { motion } from 'framer-motion';
import { Home, CalendarDays, Plus, Clock, Settings } from 'lucide-react';

export type Page = 'home' | 'calendar' | 'history' | 'settings';

interface BottomNavProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  onLogPeriod: () => void;
}

const navItems: { page: Page; icon: typeof Home; label: string }[] = [
  { page: 'home', icon: Home, label: 'Home' },
  { page: 'calendar', icon: CalendarDays, label: 'Calendar' },
  { page: 'history', icon: Clock, label: 'History' },
  { page: 'settings', icon: Settings, label: 'Settings' },
];

export function BottomNav({ currentPage, onNavigate, onLogPeriod }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-30 safe-area-bottom">
      <div className="max-w-lg mx-auto px-4 pb-2">
        <div className="bg-card/90 backdrop-blur-xl rounded-2xl shadow-[0_-2px_20px_rgba(232,84,140,0.08)] border border-border/50 flex items-center justify-around px-2 h-16">
          {navItems.slice(0, 2).map(item => (
            <NavButton
              key={item.page}
              {...item}
              isActive={currentPage === item.page}
              onClick={() => onNavigate(item.page)}
            />
          ))}

          {/* Center FAB — cute pink button */}
          <button
            onClick={onLogPeriod}
            className="relative -mt-7"
          >
            <motion.div
              whileTap={{ scale: 0.85, rotate: 90 }}
              whileHover={{ scale: 1.05 }}
              className="size-14 rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/30 flex items-center justify-center"
            >
              <Plus className="size-6" strokeWidth={2.5} />
            </motion.div>
            {/* Decorative ring */}
            <div className="absolute inset-[-3px] rounded-[19px] border-2 border-primary/20 pointer-events-none" />
          </button>

          {navItems.slice(2).map(item => (
            <NavButton
              key={item.page}
              {...item}
              isActive={currentPage === item.page}
              onClick={() => onNavigate(item.page)}
            />
          ))}
        </div>
      </div>
    </nav>
  );
}

function NavButton({
  icon: Icon,
  label,
  isActive,
  onClick,
}: {
  icon: typeof Home;
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-0.5 py-2 px-3 relative"
    >
      {isActive && (
        <motion.div
          layoutId="activeTab"
          className="absolute inset-x-1 inset-y-0.5 bg-[var(--blush)] dark:bg-primary/15 rounded-xl"
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        />
      )}
      <Icon
        className={`size-5 transition-colors relative z-10 ${
          isActive ? 'text-primary' : 'text-muted-foreground'
        }`}
        strokeWidth={isActive ? 2.5 : 2}
      />
      <span
        className={`text-[10px] font-bold transition-colors relative z-10 ${
          isActive ? 'text-primary' : 'text-muted-foreground'
        }`}
      >
        {label}
      </span>
    </button>
  );
}
