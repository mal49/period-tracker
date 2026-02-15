import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useCycle } from '@/hooks/useCycle';
import { useNotifications } from '@/hooks/useNotifications';
import type { CycleEntry, UserSettings } from '@/types';
import { Dashboard } from '@/components/Dashboard';
import { Calendar } from '@/components/Calendar';
import { LogPeriod } from '@/components/LogPeriod';
import { History } from '@/components/History';
import { Settings } from '@/components/Settings';
import { BottomNav } from '@/components/BottomNav';
import { Onboarding } from '@/components/Onboarding';
import { Mascot } from '@/components/Mascot';
import { InstallPrompt } from '@/components/InstallPrompt';
import type { Page } from '@/components/BottomNav';
import './App.css';

const DEFAULT_SETTINGS: UserSettings = {
  averageCycleLength: 28,
  averagePeriodLength: 5,
  notificationsEnabled: false,
  reminderDaysBefore: 2,
  lutealPhaseLength: 14,
};

const PAGE_TITLES: Record<Page, string> = {
  home: 'Dashboard',
  calendar: 'Calendar',
  history: 'History',
  settings: 'Settings',
};

function App() {
  const [entries, setEntries] = useLocalStorage<CycleEntry[]>('wawa-entries', []);
  const [settings, setSettings] = useLocalStorage<UserSettings>('wawa-settings', DEFAULT_SETTINGS);
  const [hasOnboarded, setHasOnboarded] = useLocalStorage<boolean>('wawa-onboarded', false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [showLogPeriod, setShowLogPeriod] = useState(false);
  const [editingEntry, setEditingEntry] = useState<CycleEntry | null>(null);

  const cycle = useCycle(entries, settings);
  const notifications = useNotifications();

  // Initialize theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('wawa-theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  // Schedule period reminder notification via push server
  useEffect(() => {
    if (
      settings.notificationsEnabled &&
      notifications.permission === 'granted' &&
      notifications.pushSubscription &&
      cycle.nextPeriodDate
    ) {
      const reminderDate = new Date(cycle.nextPeriodDate);
      reminderDate.setDate(reminderDate.getDate() - settings.reminderDaysBefore);

      // Only schedule if the reminder date is in the future
      if (reminderDate.getTime() > Date.now()) {
        notifications.scheduleNotification(
          'Period Coming Soon',
          reminderDate,
          {
            body: `Your period is expected in ${settings.reminderDaysBefore} days. Take care!`,
          }
        );
      }
    }
  }, [cycle.nextPeriodDate, settings.notificationsEnabled, settings.reminderDaysBefore, notifications]);

  const handleSaveEntry = useCallback((entry: CycleEntry) => {
    setEntries(prev => {
      const existingIndex = prev.findIndex(e => e.id === entry.id);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = entry;
        return updated;
      }
      return [...prev, entry];
    });
    setEditingEntry(null);
  }, [setEntries]);

  const handleDeleteEntry = useCallback((id: string) => {
    setEntries(prev => prev.filter(e => e.id !== id));
    setEditingEntry(null);
  }, [setEntries]);

  const handleEditEntry = useCallback((entry: CycleEntry) => {
    setEditingEntry(entry);
    setShowLogPeriod(true);
  }, []);

  const handleImportEntries = useCallback((imported: CycleEntry[]) => {
    setEntries(imported);
  }, [setEntries]);

  const handleClearData = useCallback(() => {
    setEntries([]);
    setSettings(DEFAULT_SETTINGS);
  }, [setEntries, setSettings]);

  const handleOnboardingComplete = useCallback((newSettings: UserSettings, firstEntry?: CycleEntry) => {
    setSettings(newSettings);
    if (firstEntry) {
      setEntries(prev => [...prev, firstEntry]);
    }
    setHasOnboarded(true);
  }, [setSettings, setEntries, setHasOnboarded]);

  const handleDayClick = useCallback((date: Date) => {
    const dayData = cycle.getDayData(date);
    if (dayData.entry) {
      handleEditEntry(dayData.entry);
    } else {
      const dateStr = date.toISOString().split('T')[0];
      setEditingEntry(null);
      setShowLogPeriod(true);
      setTimeout(() => {
        setEditingEntry({
          id: '',
          startDate: dateStr,
          endDate: dateStr,
          flowIntensity: 'medium',
          symptoms: [],
          mood: [],
          notes: '',
        });
      }, 0);
    }
  }, [cycle, handleEditEntry]);

  const pageVariants = {
    initial: { opacity: 0, y: 8 },
    in: { opacity: 1, y: 0 },
    out: { opacity: 0, y: -8 },
  };

  if (!hasOnboarded) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="app-container">
      {/* Header — Joguman-inspired warm header */}
      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl safe-area-top">
        <div className="max-w-lg mx-auto flex items-center justify-between px-5 h-16">
          <div className="flex items-center gap-2.5">
            <Mascot size="sm" mood="happy" animate={false} />
            <div>
              <h1 className="text-lg font-extrabold text-foreground leading-tight">
                {settings.userName ? `Welcome, ${settings.userName}` : 'HerDay'}
              </h1>
              <p className="text-[10px] font-semibold text-muted-foreground -mt-0.5">{PAGE_TITLES[currentPage]}</p>
            </div>
          </div>
          {/* Decorative dots */}
          <div className="flex gap-1.5">
            <span className="size-2 rounded-full bg-primary/40" />
            <span className="size-2 rounded-full bg-[#88D4AB]/40" />
            <span className="size-2 rounded-full bg-[#B8A0E8]/40" />
          </div>
        </div>
        {/* Subtle bottom border with gradient */}
        <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      </header>

      {/* Main Content */}
      <main className="max-w-lg mx-auto px-5 pt-4 pb-28">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
            transition={{ duration: 0.2 }}
          >
            {currentPage === 'home' && (
              <Dashboard
                currentPhase={cycle.currentPhase}
                cycleDay={cycle.cycleDay}
                daysUntilNextPeriod={cycle.daysUntilNextPeriod}
                nextPeriodDate={cycle.nextPeriodDate}
                entries={entries}
                settings={settings}
              />
            )}
            {currentPage === 'calendar' && (
              <Calendar
                getDayData={cycle.getDayData}
                onDayClick={handleDayClick}
                today={cycle.today}
              />
            )}
            {currentPage === 'history' && (
              <History
                entries={entries}
                onEditEntry={handleEditEntry}
              />
            )}
            {currentPage === 'settings' && (
              <Settings
                settings={settings}
                onUpdateSettings={setSettings}
                entries={entries}
                onImportEntries={handleImportEntries}
                onClearData={handleClearData}
                notificationPermission={notifications.permission}
                onRequestNotificationPermission={notifications.requestPermission}
                onShowInstallGuide={() => setShowInstallPrompt(true)}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <BottomNav
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        onLogPeriod={() => {
          setEditingEntry(null);
          setShowLogPeriod(true);
        }}
      />

      {/* Log Period Sheet */}
      <LogPeriod
        isOpen={showLogPeriod}
        onClose={() => {
          setShowLogPeriod(false);
          setEditingEntry(null);
        }}
        onSave={handleSaveEntry}
        editEntry={editingEntry}
        onDelete={handleDeleteEntry}
      />

      {/* Install PWA Prompt */}
      <InstallPrompt
        isOpen={showInstallPrompt}
        onClose={() => setShowInstallPrompt(false)}
      />
    </div>
  );
}

export default App;
