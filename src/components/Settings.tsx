import { motion } from 'framer-motion';
import { Bell, Moon, Sun, Trash2, Download, Upload, Info, Heart } from 'lucide-react';
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
}

export function Settings({
  settings,
  onUpdateSettings,
  entries,
  onImportEntries,
  onClearData,
  notificationPermission,
  onRequestNotificationPermission,
}: SettingsProps) {
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));
  const [showConfirmClear, setShowConfirmClear] = useState(false);
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

      {/* Data Management */}
      <motion.div variants={itemVariants} className="bg-card rounded-2xl p-4 space-y-3 card-soft">
        <h3 className="text-sm font-bold text-foreground">Your Data</h3>

        <div className="flex items-center gap-2 p-3 rounded-xl bg-[var(--mint)] dark:bg-accent text-xs font-medium text-foreground/70">
          <Info className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>All data is stored locally on your device. Nothing is sent to any server.</span>
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
          <p className="text-xs font-bold text-muted-foreground">Wawa Period Tracker v1.0</p>
          <p className="text-xs text-muted-foreground flex items-center gap-1 justify-center">
            Made with <Heart className="size-3 text-primary fill-primary" /> Your privacy matters.
          </p>
        </div>
      </motion.div>
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
