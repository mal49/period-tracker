import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Moon, Sun, Trash2, Download, Upload, Info, Heart, User, Smartphone, Code2, X, Github, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { UserSettings, CycleEntry } from '@/types';
import { useState, useRef } from 'react';
import { Mascot } from '@/components/Mascot';

interface SettingsProps {
  settings: UserSettings;
  onUpdateSettings: (settings: UserSettings) => void;
  entries: CycleEntry[];
  onImportEntries: (entries: CycleEntry[]) => void;
  onClearData: () => void;
  notificationPermission: NotificationPermission;
  onRequestNotificationPermission: () => void;
  onShowInstallGuide: () => void;
}

export function Settings({
  settings,
  onUpdateSettings,
  entries,
  onImportEntries,
  onClearData,
  notificationPermission,
  onRequestNotificationPermission,
  onShowInstallGuide,
}: SettingsProps) {
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [showDevInfo, setShowDevInfo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    document.documentElement.classList.toggle('dark', newIsDark);
    localStorage.setItem('wawa-theme', newIsDark ? 'dark' : 'light');
  };

  const handleExport = () => {
    const data = {
      entries,
      settings,
      exportDate: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wawa-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.entries && Array.isArray(data.entries)) {
          onImportEntries(data.entries);
        }
        if (data.settings) {
          onUpdateSettings(data.settings);
        }
        alert('Data imported successfully!');
      } catch {
        alert('Invalid file format');
      }
    };
    reader.readAsText(file);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-4"
    >
      {/* Profile */}
      <motion.div variants={itemVariants} className="bg-card rounded-2xl p-4 space-y-3 card-soft">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
          <User className="size-4 text-primary" />
          Profile
        </h3>
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-muted-foreground shrink-0">Name</label>
          <input
            type="text"
            value={settings.userName || ''}
            onChange={(e) => onUpdateSettings({ ...settings, userName: e.target.value })}
            placeholder="Your name"
            maxLength={20}
            className="flex-1 rounded-xl border bg-background px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
      </motion.div>

      {/* Cycle Settings */}
      <motion.div variants={itemVariants} className="bg-card rounded-2xl p-4 space-y-4 card-soft">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
          Cycle Settings
        </h3>

        <div className="space-y-3">
          <SettingsStepper
            label="Average cycle length"
            value={settings.averageCycleLength}
            min={20}
            max={45}
            unit="d"
            onChange={(v) => onUpdateSettings({ ...settings, averageCycleLength: v })}
          />
          <SettingsStepper
            label="Average period length"
            value={settings.averagePeriodLength}
            min={2}
            max={10}
            unit="d"
            onChange={(v) => onUpdateSettings({ ...settings, averagePeriodLength: v })}
          />
          <SettingsStepper
            label="Luteal phase length"
            value={settings.lutealPhaseLength}
            min={10}
            max={18}
            unit="d"
            onChange={(v) => onUpdateSettings({ ...settings, lutealPhaseLength: v })}
          />
        </div>
      </motion.div>

      {/* Notifications */}
      <motion.div variants={itemVariants} className="bg-card rounded-2xl p-4 space-y-4 card-soft">
        <h3 className="text-sm font-bold text-foreground">Notifications</h3>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-xl bg-[var(--sunny)] dark:bg-accent flex items-center justify-center">
              <Bell className="size-4 text-amber-600 dark:text-amber-400" />
            </div>
            <span className="text-sm font-medium text-foreground">Period reminders</span>
          </div>
          {notificationPermission === 'granted' ? (
            <ToggleSwitch
              enabled={settings.notificationsEnabled}
              onChange={() => onUpdateSettings({ ...settings, notificationsEnabled: !settings.notificationsEnabled })}
            />
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={onRequestNotificationPermission}
              className="rounded-xl font-bold text-xs"
            >
              Enable
            </Button>
          )}
        </div>

        {settings.notificationsEnabled && notificationPermission === 'granted' && (
          <SettingsStepper
            label="Remind days before"
            value={settings.reminderDaysBefore}
            min={1}
            max={7}
            unit="d"
            onChange={(v) => onUpdateSettings({ ...settings, reminderDaysBefore: v })}
          />
        )}
      </motion.div>

      {/* Appearance */}
      <motion.div variants={itemVariants} className="bg-card rounded-2xl p-4 card-soft">
        <h3 className="text-sm font-bold text-foreground mb-4">Appearance</h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`size-8 rounded-xl flex items-center justify-center ${isDark ? 'bg-[var(--lavender)]' : 'bg-[var(--sunny)]'}`}>
              {isDark ? <Moon className="size-4 text-violet-500" /> : <Sun className="size-4 text-amber-500" />}
            </div>
            <span className="text-sm font-medium text-foreground">Dark mode</span>
          </div>
          <ToggleSwitch enabled={isDark} onChange={toggleTheme} />
        </div>
      </motion.div>

      {/* Install App */}
      <motion.div variants={itemVariants} className="bg-card rounded-2xl p-4 card-soft">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-xl bg-[var(--blush)] dark:bg-primary/15 flex items-center justify-center">
              <Smartphone className="size-4 text-primary" />
            </div>
            <div>
              <span className="text-sm font-medium text-foreground block">Install app</span>
              <span className="text-xs text-muted-foreground">Add HerDay to your home screen</span>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={onShowInstallGuide}
            className="rounded-xl font-bold text-xs"
          >
            Show Guide
          </Button>
        </div>
      </motion.div>

      {/* Data Management */}
      <motion.div variants={itemVariants} className="bg-card rounded-2xl p-4 space-y-3 card-soft">
        <h3 className="text-sm font-bold text-foreground">Your Data</h3>

        <div className="flex items-center gap-2 p-3 rounded-xl bg-[var(--mint)] dark:bg-accent text-xs font-medium text-foreground/70">
          <Info className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>All cycle data is stored locally on your device. If notifications are enabled, only a reminder date is sent to the server — no health data ever leaves your device.</span>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1 rounded-xl font-bold" onClick={handleExport}>
            <Download className="size-4 mr-1.5" />
            Export
          </Button>
          <Button
            variant="outline"
            className="flex-1 rounded-xl font-bold"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="size-4 mr-1.5" />
            Import
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleImport}
          />
        </div>

        {!showConfirmClear ? (
          <Button
            variant="ghost"
            className="w-full rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10 font-bold"
            onClick={() => setShowConfirmClear(true)}
          >
            <Trash2 className="size-4 mr-1.5" />
            Clear all data
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              className="flex-1 rounded-xl font-bold"
              onClick={() => setShowConfirmClear(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1 rounded-xl font-bold"
              onClick={() => {
                onClearData();
                setShowConfirmClear(false);
              }}
            >
              Confirm Delete
            </Button>
          </div>
        )}
      </motion.div>

      {/* About */}
      <motion.div variants={itemVariants} className="flex flex-col items-center py-6 space-y-3">
        <Mascot size="sm" mood="love" />
        <div className="text-center space-y-0.5">
          <p className="text-xs font-bold text-muted-foreground">HerDay Menstrual Tracker v1.0</p>
          <p className="text-xs text-muted-foreground flex items-center gap-1 justify-center">
            Made with <Heart className="size-3 text-primary fill-primary" /> Your privacy matters.
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="rounded-xl font-bold text-xs text-muted-foreground hover:text-foreground gap-1.5"
          onClick={() => setShowDevInfo(true)}
        >
          <Code2 className="size-3.5" />
          About the Developer
        </Button>
      </motion.div>

      {/* Developer Info Modal */}
      <DeveloperModal isOpen={showDevInfo} onClose={() => setShowDevInfo(false)} />
    </motion.div>
  );
}

/* ─── Helper Components ──────────────────────────────────────── */

function SettingsStepper({
  label,
  value,
  min,
  max,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  unit: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <label className="text-sm font-medium text-muted-foreground">{label}</label>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange(Math.max(min, value - 1))}
          className="size-8 rounded-xl bg-[var(--cream)] dark:bg-muted flex items-center justify-center text-sm font-bold hover:bg-accent transition-colors active:scale-90"
        >
          -
        </button>
        <span className="w-10 text-center font-extrabold text-sm">{value}{unit}</span>
        <button
          onClick={() => onChange(Math.min(max, value + 1))}
          className="size-8 rounded-xl bg-[var(--cream)] dark:bg-muted flex items-center justify-center text-sm font-bold hover:bg-accent transition-colors active:scale-90"
        >
          +
        </button>
      </div>
    </div>
  );
}

function DeveloperModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const socials: { label: string; renderIcon: () => React.ReactNode; href: string; username: string; color: string }[] = [
    {
      label: 'GitHub',
      renderIcon: () => <Github className="size-4 text-gray-700 dark:text-gray-300" />,
      href: 'https://github.com/mal49',
      username: '@mal49',
      color: 'bg-gray-100 dark:bg-gray-800',
    },
    {
      label: 'Instagram',
      renderIcon: () => (
        <svg viewBox="0 0 24 24" className="size-4 text-pink-500" fill="currentColor">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
        </svg>
      ),
      href: 'https://instagram.com/imalanep_',
      username: '@imalanep_',
      color: 'bg-pink-50 dark:bg-pink-950/30',
    },
    {
      label: 'Threads',
      renderIcon: () => (
        <svg viewBox="0 0 16 16" className="size-4 text-foreground" fill="currentColor">
          <path d="M6.321 6.016c-.27-.18-1.166-.802-1.166-.802.756-1.081 1.753-1.502 3.132-1.502.975 0 1.803.327 2.394.948s.928 1.509 1.005 2.644q.492.207.905.484c1.109.745 1.719 1.86 1.719 3.137 0 2.716-2.226 5.075-6.256 5.075C4.594 16 1 13.987 1 7.994 1 2.034 4.482 0 8.044 0 9.69 0 13.55.243 15 5.036l-1.36.353C12.516 1.974 10.163 1.43 8.006 1.43c-3.565 0-5.582 2.171-5.582 6.79 0 4.143 2.254 6.343 5.63 6.343 2.777 0 4.847-1.443 4.847-3.556 0-1.438-1.208-2.127-1.27-2.127-.236 1.234-.868 3.31-3.644 3.31-1.618 0-3.013-1.118-3.013-2.582 0-2.09 1.984-2.847 3.55-2.847.586 0 1.294.04 1.663.114 0-.637-.54-1.728-1.9-1.728-1.25 0-1.566.405-1.967.868ZM8.716 8.19c-2.04 0-2.304.87-2.304 1.416 0 .878 1.043 1.168 1.6 1.168 1.02 0 2.067-.282 2.232-2.423a6.2 6.2 0 0 0-1.528-.161"/>
        </svg>
      ),
      href: 'https://threads.net/@imalanep_',
      username: '@imalanep_',
      color: 'bg-gray-100 dark:bg-gray-800',
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="relative w-full max-w-sm bg-background rounded-3xl shadow-xl overflow-hidden"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 size-8 rounded-full bg-muted/80 hover:bg-muted flex items-center justify-center transition-colors"
            >
              <X className="size-4 text-muted-foreground" />
            </button>

            <div className="p-6 pt-5">
              {/* Header */}
              <div className="text-center mb-5">
                <Mascot size="md" mood="love" className="mx-auto mb-3" />
                <h2 className="text-lg font-extrabold text-foreground mb-1">
                  Meet the Developer
                </h2>
                <p className="text-sm text-muted-foreground font-medium">
                  Built with care by <span className="font-bold text-foreground">Ikhmal Hanif</span>
                </p>
              </div>

              {/* Social Links */}
              <div className="space-y-2.5 mb-5">
                {socials.map((social) => (
                  <motion.a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center gap-3 rounded-2xl bg-card card-soft p-3.5 transition-colors hover:bg-accent/50"
                  >
                    <div className={`size-9 rounded-xl ${social.color} flex items-center justify-center shrink-0`}>
                      {social.renderIcon()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-bold text-foreground block">{social.label}</span>
                      <span className="text-xs text-muted-foreground font-medium">{social.username}</span>
                    </div>
                    <svg className="size-4 text-muted-foreground shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </motion.a>
                ))}
              </div>

              {/* Special Thanks */}
              <div className="rounded-2xl bg-linear-to-br from-[var(--blush)] to-[var(--lavender)] dark:from-primary/10 dark:to-violet-500/10 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="size-4 text-primary" />
                  <h3 className="text-sm font-extrabold text-foreground">Special Thanks</h3>
                </div>
                <p className="text-xs text-foreground/70 font-medium leading-relaxed">
                  To <span className="font-bold text-foreground">Nora Najwa Multazam</span> — for being the inspiration behind this app.
                  Your support and encouragement made this project possible ♡.
                </p>
              </div>

              {/* Close button */}
              <Button
                variant="outline"
                size="lg"
                className="w-full mt-5 rounded-2xl h-12 font-bold"
                onClick={onClose}
              >
                Close
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ToggleSwitch({ enabled, onChange }: { enabled: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={`w-12 h-7 rounded-full transition-colors relative ${
        enabled ? 'bg-primary' : 'bg-border'
      }`}
    >
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className={`absolute top-0.5 size-6 rounded-full bg-white shadow-sm ${
          enabled ? 'left-[22px]' : 'left-[2px]'
        }`}
      />
    </button>
  );
}
