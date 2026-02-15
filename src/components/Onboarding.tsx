import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, subDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, subMonths, isSameDay, isSameMonth, isAfter } from 'date-fns';
import {
  ArrowRight,
  ArrowLeft,
  CalendarDays,
  Heart,
  Shield,
  Sparkles,
  Check,
  User,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Sun,
  Moon,
  Smartphone,
  Share,
  MoreVertical,
  Download,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { UserSettings, CycleEntry } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { Mascot } from '@/components/Mascot';

interface OnboardingProps {
  onComplete: (settings: UserSettings, firstEntry?: CycleEntry) => void;
}

type StepId = 'welcome' | 'install' | 'name' | 'theme' | 'cycle' | 'period' | 'lastPeriod' | 'allSet';

export function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);

  // Detect if already running as installed PWA (standalone mode)
  const isStandalone =
    typeof window !== 'undefined' &&
    (window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true);

  // Build step sequence — skip install step if already in PWA
  const stepSequence: StepId[] = isStandalone
    ? ['welcome', 'name', 'theme', 'cycle', 'period', 'lastPeriod', 'allSet']
    : ['welcome', 'install', 'name', 'theme', 'cycle', 'period', 'lastPeriod', 'allSet'];

  const TOTAL_STEPS = stepSequence.length;
  const currentStep = stepSequence[step];

  // Settings
  const [userName, setUserName] = useState('');
  const [cycleLength, setCycleLength] = useState(28);
  const [periodLength, setPeriodLength] = useState(5);

  // Optional first period log
  const [logLastPeriod, setLogLastPeriod] = useState(false);
  const [lastPeriodStart, setLastPeriodStart] = useState(
    format(subDays(new Date(), 14), 'yyyy-MM-dd')
  );

  const goNext = () => {
    setDirection(1);
    setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  };

  const goBack = () => {
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 0));
  };

  const handleFinish = () => {
    const settings: UserSettings = {
      userName: userName.trim() || undefined,
      averageCycleLength: cycleLength,
      averagePeriodLength: periodLength,
      notificationsEnabled: false,
      reminderDaysBefore: 2,
      lutealPhaseLength: 14,
    };

    let firstEntry: CycleEntry | undefined;
    if (logLastPeriod && lastPeriodStart) {
      const endDate = format(
        subDays(
          new Date(
            new Date(lastPeriodStart).getTime() +
              periodLength * 24 * 60 * 60 * 1000
          ),
          1
        ),
        'yyyy-MM-dd'
      );
      firstEntry = {
        id: uuidv4(),
        startDate: lastPeriodStart,
        endDate,
        flowIntensity: 'medium',
        symptoms: [],
        mood: [],
        notes: '',
      };
    }

    onComplete(settings, firstEntry);
  };

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 80 : -80,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir < 0 ? 80 : -80,
      opacity: 0,
    }),
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Progress bar */}
      <div className="safe-area-top px-6 pt-6">
        <div className="flex gap-2">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className="h-1.5 rounded-full flex-1 bg-border overflow-hidden"
            >
              <motion.div
                className="h-full rounded-full bg-primary"
                initial={{ width: '0%' }}
                animate={{ width: i <= step ? '100%' : '0%' }}
                transition={{ duration: 0.4, ease: 'easeInOut' }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-center px-6 overflow-y-auto overflow-x-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="flex flex-col items-center"
          >
            {currentStep === 'welcome' && <StepWelcome />}
            {currentStep === 'install' && <StepInstall />}
            {currentStep === 'name' && (
              <StepName value={userName} onChange={setUserName} />
            )}
            {currentStep === 'theme' && <StepTheme />}
            {currentStep === 'cycle' && (
              <StepCycleLength value={cycleLength} onChange={setCycleLength} />
            )}
            {currentStep === 'period' && (
              <StepPeriodLength
                value={periodLength}
                onChange={setPeriodLength}
              />
            )}
            {currentStep === 'lastPeriod' && (
              <StepLastPeriod
                enabled={logLastPeriod}
                onToggle={setLogLastPeriod}
                date={lastPeriodStart}
                onDateChange={setLastPeriodStart}
              />
            )}
            {currentStep === 'allSet' && <StepAllSet userName={userName} />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="px-6 pt-4 safe-area-bottom">
        <div className="flex items-center gap-3 max-w-sm mx-auto mb-8">
          {step > 0 && (
            <Button
              variant="outline"
              size="lg"
              className="rounded-2xl h-13 px-5 font-bold"
              onClick={goBack}
            >
              <ArrowLeft className="size-4" />
            </Button>
          )}
          <Button
            size="lg"
            className="flex-1 rounded-2xl h-13 text-base font-bold gap-2 shadow-md shadow-primary/20"
            onClick={currentStep === 'allSet' ? handleFinish : goNext}
          >
            {currentStep === 'welcome' && 'Get Started'}
            {currentStep === 'install' && 'Skip for Now'}
            {currentStep !== 'welcome' && currentStep !== 'install' && currentStep !== 'allSet' && 'Continue'}
            {currentStep === 'allSet' && "Let's Go!"}
            {currentStep !== 'allSet' ? (
              <ArrowRight className="size-4" />
            ) : (
              <Sparkles className="size-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ─── Step Components ────────────────────────────────────────── */

function StepWelcome() {
  return (
    <div className="text-center max-w-xs mx-auto">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
      >
        <Mascot size="xl" mood="excited" className="mx-auto mb-4" />
      </motion.div>
      <h1 className="text-2xl font-extrabold text-foreground mb-2">
        Welcome to HerDay!
      </h1>
      <p className="text-muted-foreground leading-relaxed font-medium">
        Your cute and private menstrual tracker. Let's set things up — it only takes
        a minute~
      </p>

      <div className="mt-8 grid gap-3 text-left">
        {[
          {
            icon: CalendarDays,
            text: 'Track your cycle & predictions',
            bg: 'bg-[var(--blush)] dark:bg-primary/15',
            iconColor: 'text-primary',
          },
          {
            icon: Heart,
            text: 'Log symptoms, mood & flow',
            bg: 'bg-[var(--mint)] dark:bg-emerald-900/30',
            iconColor: 'text-emerald-500',
          },
          {
            icon: Shield,
            text: '100% private — data stays on device',
            bg: 'bg-[var(--lavender)] dark:bg-violet-900/30',
            iconColor: 'text-violet-500',
          },
        ].map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.1 }}
            className="flex items-center gap-3 rounded-2xl bg-card card-soft p-3.5"
          >
            <div className={`size-10 rounded-xl ${item.bg} flex items-center justify-center shrink-0`}>
              <item.icon className={`size-5 ${item.iconColor}`} />
            </div>
            <span className="text-sm text-foreground font-semibold">
              {item.text}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function StepInstall() {
  const [platform, setPlatform] = useState<'android' | 'ios'>('android');

  const androidSteps = [
    {
      icon: MoreVertical,
      text: 'Tap the three-dot menu (⋮) at the top right in Chrome',
    },
    {
      icon: Download,
      text: 'Tap "Add to Home screen" or "Install app"',
    },
    {
      icon: Check,
      text: 'Tap "Add" to confirm — then open HerDay from your home screen!',
    },
  ];

  const iosSteps = [
    {
      icon: Share,
      text: 'Tap the Share button at the bottom in Safari',
    },
    {
      icon: Plus,
      text: 'Scroll down and tap "Add to Home Screen"',
    },
    {
      icon: Check,
      text: 'Tap "Add" in the top right — then open HerDay from your home screen!',
    },
  ];

  const steps = platform === 'android' ? androidSteps : iosSteps;

  return (
    <div className="text-center max-w-xs mx-auto">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
      >
        <Mascot size="lg" mood="happy" className="mx-auto mb-4" />
      </motion.div>
      <h2 className="text-xl font-extrabold text-foreground mb-1">
        Install HerDay First!
      </h2>
      <p className="text-sm text-muted-foreground mb-6 font-medium">
        Add HerDay to your home screen for the best experience.
        After installing, open it from there to continue setup~
      </p>

      {/* Platform toggle */}
      <div className="flex gap-2 mb-4 bg-card card-soft rounded-2xl p-1.5">
        <button
          onClick={() => setPlatform('android')}
          className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition-all ${
            platform === 'android'
              ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Smartphone className="size-4" />
          Android
        </button>
        <button
          onClick={() => setPlatform('ios')}
          className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition-all ${
            platform === 'ios'
              ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Smartphone className="size-4" />
          iOS
        </button>
      </div>

      {/* Steps */}
      <AnimatePresence mode="wait">
        <motion.div
          key={platform}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="grid gap-2.5"
        >
          {steps.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 + i * 0.1 }}
              className="flex items-center gap-3 text-left rounded-2xl bg-card card-soft p-3.5"
            >
              <div className="size-9 rounded-xl bg-[var(--blush)] dark:bg-primary/15 flex items-center justify-center shrink-0 relative">
                <span className="absolute -top-1 -left-1 size-5 rounded-full bg-primary text-primary-foreground text-[10px] font-extrabold flex items-center justify-center">
                  {i + 1}
                </span>
                <item.icon className="size-4 text-primary" />
              </div>
              <span className="text-sm text-foreground font-semibold leading-snug">
                {item.text}
              </span>
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>

      <p className="text-xs text-muted-foreground mt-5 font-medium">
        Already installed or want to use in browser? Tap "Skip for Now"~
      </p>
    </div>
  );
}

function StepName({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="text-center max-w-xs mx-auto">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
      >
        <Mascot size="lg" mood="excited" className="mx-auto mb-4" />
      </motion.div>
      <h2 className="text-xl font-extrabold text-foreground mb-1">
        What's your name?
      </h2>
      <p className="text-sm text-muted-foreground mb-8 font-medium">
        So Awa can greet you properly~
      </p>

      <div className="relative max-w-[260px] mx-auto">
        <div className="absolute left-4 top-1/2 -translate-y-1/2">
          <User className="size-5 text-muted-foreground/50" />
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter your name"
          maxLength={20}
          className="w-full rounded-2xl border-2 border-border bg-card px-4 py-3.5 pl-12 text-center text-lg font-bold text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
          autoFocus
        />
      </div>

      <p className="text-xs text-muted-foreground mt-4 font-medium">
        You can skip this if you prefer — just tap Continue!
      </p>
    </div>
  );
}

function StepTheme() {
  const [isDark, setIsDark] = useState(
    document.documentElement.classList.contains('dark')
  );

  const applyTheme = (dark: boolean) => {
    setIsDark(dark);
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('wawa-theme', dark ? 'dark' : 'light');
  };

  return (
    <div className="text-center max-w-xs mx-auto">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
      >
        <Mascot size="lg" mood="happy" className="mx-auto mb-4" />
      </motion.div>
      <h2 className="text-xl font-extrabold text-foreground mb-1">
        Pick Your Vibe
      </h2>
      <p className="text-sm text-muted-foreground mb-8 font-medium">
        Choose how you'd like HerDay to look~
      </p>

      <div className="grid grid-cols-2 gap-3">
        {/* Light mode card */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          onClick={() => applyTheme(false)}
          className={`relative flex flex-col items-center gap-3 rounded-2xl border-2 p-5 transition-all ${
            !isDark
              ? 'border-primary bg-primary/5 shadow-md shadow-primary/10'
              : 'border-border bg-card hover:border-primary/30'
          }`}
        >
          {!isDark && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-2 -right-2 size-6 rounded-full bg-primary flex items-center justify-center"
            >
              <Check className="size-3.5 text-primary-foreground" />
            </motion.div>
          )}
          <div
            className={`size-14 rounded-2xl flex items-center justify-center ${
              !isDark
                ? 'bg-amber-100 dark:bg-amber-900/30'
                : 'bg-amber-50 dark:bg-muted'
            }`}
          >
            <Sun
              className={`size-7 ${
                !isDark ? 'text-amber-500' : 'text-amber-400'
              }`}
            />
          </div>
          <div>
            <span className="text-sm font-bold text-foreground block">
              Light
            </span>
            <span className="text-[11px] text-muted-foreground font-medium">
              Bright & cheerful
            </span>
          </div>
        </motion.button>

        {/* Dark mode card */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          onClick={() => applyTheme(true)}
          className={`relative flex flex-col items-center gap-3 rounded-2xl border-2 p-5 transition-all ${
            isDark
              ? 'border-primary bg-primary/5 shadow-md shadow-primary/10'
              : 'border-border bg-card hover:border-primary/30'
          }`}
        >
          {isDark && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-2 -right-2 size-6 rounded-full bg-primary flex items-center justify-center"
            >
              <Check className="size-3.5 text-primary-foreground" />
            </motion.div>
          )}
          <div
            className={`size-14 rounded-2xl flex items-center justify-center ${
              isDark
                ? 'bg-violet-100 dark:bg-violet-900/30'
                : 'bg-violet-50 dark:bg-muted'
            }`}
          >
            <Moon
              className={`size-7 ${
                isDark ? 'text-violet-500' : 'text-violet-400'
              }`}
            />
          </div>
          <div>
            <span className="text-sm font-bold text-foreground block">
              Dark
            </span>
            <span className="text-[11px] text-muted-foreground font-medium">
              Easy on the eyes
            </span>
          </div>
        </motion.button>
      </div>

      <p className="text-xs text-muted-foreground mt-6 font-medium">
        You can always change this later in Settings~
      </p>
    </div>
  );
}

function StepCycleLength({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="text-center max-w-xs mx-auto">
      <Mascot size="lg" mood="happy" className="mx-auto mb-4" />
      <h2 className="text-xl font-extrabold text-foreground mb-1">
        Cycle Length
      </h2>
      <p className="text-sm text-muted-foreground mb-8 font-medium">
        How many days is your average cycle? Don't worry, you can change this
        later~
      </p>

      <NumberStepper
        value={value}
        onChange={onChange}
        min={20}
        max={45}
        unit="days"
      />

      <p className="text-xs text-muted-foreground mt-4 font-medium">
        Most cycles are between 24–35 days. The average is 28 days.
      </p>
    </div>
  );
}

function StepPeriodLength({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="text-center max-w-xs mx-auto">
      <Mascot size="lg" mood="sleepy" className="mx-auto mb-4" />
      <h2 className="text-xl font-extrabold text-foreground mb-1">
        Period Length
      </h2>
      <p className="text-sm text-muted-foreground mb-8 font-medium">
        How many days does your period usually last?
      </p>

      <NumberStepper
        value={value}
        onChange={onChange}
        min={2}
        max={10}
        unit="days"
      />

      <p className="text-xs text-muted-foreground mt-4 font-medium">
        Most periods last between 3–7 days. The average is 5 days.
      </p>
    </div>
  );
}

function StepLastPeriod({
  enabled,
  onToggle,
  date,
  onDateChange,
}: {
  enabled: boolean;
  onToggle: (v: boolean) => void;
  date: string;
  onDateChange: (v: string) => void;
}) {
  return (
    <div className="text-center max-w-xs mx-auto">
      <Mascot size="lg" mood="wink" className="mx-auto mb-4" />
      <h2 className="text-xl font-extrabold text-foreground mb-1">
        Last Period
      </h2>
      <p className="text-sm text-muted-foreground mb-6 font-medium">
        When did your last period start? This helps me predict your next one~
      </p>

      {/* Toggle */}
      <button
        onClick={() => onToggle(!enabled)}
        className={`w-full flex items-center justify-between rounded-2xl border-2 p-4 transition-all ${
          enabled
            ? 'border-primary bg-[var(--blush)] dark:bg-primary/10'
            : 'border-border bg-card'
        }`}
      >
        <span className="text-sm font-semibold text-foreground">
          I remember when it started
        </span>
        <div
          className={`w-12 h-7 rounded-full transition-colors relative ${
            enabled ? 'bg-primary' : 'bg-border'
          }`}
        >
          <span
            className={`absolute top-0.5 left-0 size-6 rounded-full bg-white shadow-sm transition-transform ${
              enabled ? 'translate-x-[22px]' : 'translate-x-[2px]'
            }`}
          />
        </div>
      </button>

      <AnimatePresence>
        {enabled && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-4 rounded-2xl bg-card card-soft p-4">
              <OnboardingDatePicker
                label="Start date of last period"
                value={date}
                onChange={onDateChange}
                maxDate={new Date()}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!enabled && (
        <p className="text-xs text-muted-foreground mt-4 font-medium">
          No worries! You can log it later from the home screen~
        </p>
      )}
    </div>
  );
}

function StepAllSet({ userName }: { userName: string }) {
  const displayName = userName.trim();
  return (
    <div className="text-center max-w-xs mx-auto">
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 200, damping: 15 }}
      >
        <Mascot size="xl" mood="love" className="mx-auto mb-4" />
      </motion.div>
      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-2xl font-extrabold text-foreground mb-2"
      >
        {displayName ? `You're All Set, ${displayName}!` : "You're All Set!"}
      </motion.h2>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-muted-foreground leading-relaxed font-medium"
      >
        Awa is ready to help you track your cycle. All your data stays
        private on your device~
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-8 grid gap-2.5"
      >
        {[
          { text: 'Predictions improve as you log more', icon: Sparkles },
          { text: 'Tap + anytime to log a period', icon: CalendarDays },
          { text: 'Check the calendar for overview', icon: Check },
        ].map((tip, i) => (
          <div
            key={i}
            className="flex items-center gap-3 text-left text-sm font-medium text-muted-foreground bg-card card-soft rounded-2xl p-3.5"
          >
            <div className="size-8 rounded-lg bg-[var(--blush)] dark:bg-primary/15 flex items-center justify-center shrink-0">
              <tip.icon className="size-4 text-primary" />
            </div>
            {tip.text}
          </div>
        ))}
      </motion.div>
    </div>
  );
}

/* ─── Shared Components ──────────────────────────────────────── */

function OnboardingMiniCalendar({
  selected,
  onSelect,
  maxDate,
}: {
  selected: Date;
  onSelect: (date: Date) => void;
  maxDate?: Date;
}) {
  const [viewMonth, setViewMonth] = useState(startOfMonth(selected));

  const monthStart = startOfMonth(viewMonth);
  const monthEnd = endOfMonth(viewMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days: Date[] = [];
  let day = calStart;
  while (day <= calEnd) {
    days.push(day);
    day = addDays(day, 1);
  }

  const weekDays = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className="overflow-hidden"
    >
      <div className="pt-3">
        {/* Month navigation */}
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => setViewMonth(subMonths(viewMonth, 1))}
            className="size-7 rounded-lg hover:bg-accent flex items-center justify-center transition-colors"
          >
            <ChevronLeft className="size-4 text-muted-foreground" />
          </button>
          <span className="text-sm font-bold text-foreground">
            {format(viewMonth, 'MMMM yyyy')}
          </span>
          <button
            onClick={() => setViewMonth(addMonths(viewMonth, 1))}
            className="size-7 rounded-lg hover:bg-accent flex items-center justify-center transition-colors"
          >
            <ChevronRight className="size-4 text-muted-foreground" />
          </button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 mb-1">
          {weekDays.map((wd) => (
            <div key={wd} className="text-center text-[10px] font-bold text-muted-foreground/60 py-1">
              {wd}
            </div>
          ))}
        </div>

        {/* Day grid */}
        <div className="grid grid-cols-7">
          {days.map((d, i) => {
            const isCurrentMonth = isSameMonth(d, viewMonth);
            const isSelected = isSameDay(d, selected);
            const isToday = isSameDay(d, new Date());
            const isFuture = maxDate ? isAfter(d, maxDate) : false;

            return (
              <button
                key={i}
                disabled={isFuture}
                onClick={() => {
                  onSelect(d);
                }}
                className={`size-8 rounded-lg text-xs font-semibold transition-all flex items-center justify-center
                  ${!isCurrentMonth ? 'text-muted-foreground/25' : ''}
                  ${isCurrentMonth && !isSelected && !isFuture ? 'text-foreground hover:bg-accent' : ''}
                  ${isSelected ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20' : ''}
                  ${isToday && !isSelected ? 'ring-1 ring-primary/40' : ''}
                  ${isFuture ? 'text-muted-foreground/20 cursor-not-allowed' : ''}
                `}
              >
                {format(d, 'd')}
              </button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

function OnboardingDatePicker({
  label,
  value,
  onChange,
  maxDate,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  maxDate?: Date;
}) {
  const [open, setOpen] = useState(false);
  const selectedDate = new Date(value + 'T00:00:00');

  return (
    <div>
      <label className="text-xs font-bold text-muted-foreground mb-1.5 block text-left uppercase tracking-wider">
        {label}
      </label>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between rounded-xl border bg-background px-4 py-3 text-sm font-medium transition-all
          ${open ? 'ring-2 ring-primary/50 border-primary' : 'hover:border-primary/30'}
        `}
      >
        <span className="text-foreground">{format(selectedDate, 'MMM d, yyyy')}</span>
        <Calendar className="size-4 text-muted-foreground" />
      </button>

      <AnimatePresence>
        {open && (
          <OnboardingMiniCalendar
            selected={selectedDate}
            onSelect={(d) => onChange(format(d, 'yyyy-MM-dd'))}
            maxDate={maxDate}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function NumberStepper({
  value,
  onChange,
  min,
  max,
  unit,
}: {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  unit: string;
}) {
  return (
    <div className="flex items-center justify-center gap-5">
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        className="size-14 rounded-2xl bg-card card-soft hover:bg-accent flex items-center justify-center text-lg font-bold transition-colors active:scale-90"
      >
        -
      </button>
      <div className="w-24 text-center">
        <motion.span
          key={value}
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-4xl font-extrabold text-foreground block"
        >
          {value}
        </motion.span>
        <span className="text-sm text-muted-foreground font-semibold">{unit}</span>
      </div>
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        className="size-14 rounded-2xl bg-card card-soft hover:bg-accent flex items-center justify-center text-lg font-bold transition-colors active:scale-90"
      >
        +
      </button>
    </div>
  );
}
