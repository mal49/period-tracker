import { useState, useRef, useEffect } from 'react';
import { format, subDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, subMonths, isSameDay, isSameMonth, isAfter } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Droplets, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { CycleEntry } from '@/types';
import { v4 as uuidv4 } from 'uuid';

interface LogPeriodProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entry: CycleEntry) => void;
  editEntry?: CycleEntry | null;
  onDelete?: (id: string) => void;
}

const SYMPTOMS = [
  { name: 'Cramps', emoji: '😣' },
  { name: 'Headache', emoji: '🤕' },
  { name: 'Bloating', emoji: '🫧' },
  { name: 'Fatigue', emoji: '😴' },
  { name: 'Back pain', emoji: '🔙' },
  { name: 'Breast tenderness', emoji: '💗' },
  { name: 'Acne', emoji: '🫠' },
  { name: 'Nausea', emoji: '🤢' },
  { name: 'Dizziness', emoji: '💫' },
  { name: 'Insomnia', emoji: '🌙' },
  { name: 'Cravings', emoji: '🍫' },
  { name: 'Hot flashes', emoji: '🔥' },
];

const MOODS = [
  { name: 'Happy', emoji: '😊' },
  { name: 'Sad', emoji: '😢' },
  { name: 'Anxious', emoji: '😰' },
  { name: 'Irritable', emoji: '😤' },
  { name: 'Calm', emoji: '😌' },
  { name: 'Energetic', emoji: '⚡' },
  { name: 'Tired', emoji: '😪' },
  { name: 'Emotional', emoji: '🥺' },
  { name: 'Focused', emoji: '🎯' },
  { name: 'Stressed', emoji: '😩' },
];

const FLOW_OPTIONS: { value: CycleEntry['flowIntensity']; label: string; dots: number; color: string }[] = [
  { value: 'spotting', label: 'Spotting', dots: 1, color: 'bg-pink-200 dark:bg-pink-900/40' },
  { value: 'light', label: 'Light', dots: 2, color: 'bg-pink-300 dark:bg-pink-800/50' },
  { value: 'medium', label: 'Medium', dots: 3, color: 'bg-primary/70' },
  { value: 'heavy', label: 'Heavy', dots: 4, color: 'bg-primary' },
];

/* ─── Mini Calendar Picker ────────────────────────────────────── */

function MiniCalendar({
  selected,
  onSelect,
  onClose,
  maxDate,
}: {
  selected: Date;
  onSelect: (date: Date) => void;
  onClose: () => void;
  maxDate?: Date;
}) {
  const [viewMonth, setViewMonth] = useState(startOfMonth(selected));
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

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
      ref={ref}
      initial={{ opacity: 0, y: -8, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      className="absolute left-0 right-0 top-full mt-2 z-50 bg-card border rounded-2xl shadow-xl shadow-black/10 p-3"
    >
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
                onClose();
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
    </motion.div>
  );
}

function DatePickerField({
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
    <div className="relative">
      <label className="text-xs font-bold text-muted-foreground mb-1.5 block uppercase tracking-wider">
        {label}
      </label>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between rounded-xl border bg-card px-3 py-2.5 text-sm font-medium transition-all
          ${open ? 'ring-2 ring-primary/50 border-primary' : 'hover:border-primary/30'}
        `}
      >
        <span className="text-foreground">{format(selectedDate, 'MMM d, yyyy')}</span>
        <Calendar className="size-4 text-muted-foreground" />
      </button>

      <AnimatePresence>
        {open && (
          <MiniCalendar
            selected={selectedDate}
            onSelect={(d) => onChange(format(d, 'yyyy-MM-dd'))}
            onClose={() => setOpen(false)}
            maxDate={maxDate}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export function LogPeriod({ isOpen, onClose, onSave, editEntry, onDelete }: LogPeriodProps) {
  const [startDate, setStartDate] = useState(
    editEntry?.startDate || format(new Date(), 'yyyy-MM-dd')
  );
  const [endDate, setEndDate] = useState(
    editEntry?.endDate || format(new Date(), 'yyyy-MM-dd')
  );
  const [flow, setFlow] = useState<CycleEntry['flowIntensity']>(
    editEntry?.flowIntensity || 'medium'
  );
  const [symptoms, setSymptoms] = useState<string[]>(editEntry?.symptoms || []);
  const [moods, setMoods] = useState<string[]>(editEntry?.mood || []);
  const [notes, setNotes] = useState(editEntry?.notes || '');
  const [showMore, setShowMore] = useState(false);

  const toggleSymptom = (symptom: string) => {
    setSymptoms(prev =>
      prev.includes(symptom) ? prev.filter(s => s !== symptom) : [...prev, symptom]
    );
  };

  const toggleMood = (mood: string) => {
    setMoods(prev =>
      prev.includes(mood) ? prev.filter(m => m !== mood) : [...prev, mood]
    );
  };

  const handleSave = () => {
    const entry: CycleEntry = {
      id: editEntry?.id || uuidv4(),
      startDate,
      endDate,
      flowIntensity: flow,
      symptoms,
      mood: moods,
      notes,
    };
    onSave(entry);
    onClose();
  };

  const quickFill = (days: number) => {
    const start = subDays(new Date(), days);
    setStartDate(format(start, 'yyyy-MM-dd'));
    setEndDate(format(new Date(), 'yyyy-MM-dd'));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-50 bg-background rounded-t-[2rem] max-h-[90vh] overflow-y-auto"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1.5 rounded-full bg-border" />
            </div>

            <div className="px-5 pb-8">
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="size-8 rounded-xl bg-[var(--blush)] dark:bg-accent flex items-center justify-center">
                    <Droplets className="size-4 text-primary" />
                  </div>
                  <h2 className="text-lg font-bold">
                    {editEntry ? 'Edit Period' : 'Log Period'}
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="size-8 rounded-xl bg-[var(--cream)] dark:bg-muted flex items-center justify-center hover:bg-accent transition-colors"
                >
                  <X className="size-4" />
                </button>
              </div>

              {/* Quick Fill */}
              {!editEntry && (
                <div className="mb-5">
                  <label className="text-xs font-bold text-muted-foreground mb-2 block uppercase tracking-wider">
                    Quick fill
                  </label>
                  <div className="flex gap-2">
                    {[3, 4, 5, 6, 7].map(days => (
                      <button
                        key={days}
                        onClick={() => quickFill(days - 1)}
                        className="flex-1 text-xs py-2.5 rounded-xl bg-[var(--cream)] dark:bg-muted hover:bg-accent transition-colors font-bold"
                      >
                        {days}d
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                <DatePickerField
                  label="Start date"
                  value={startDate}
                  onChange={setStartDate}
                  maxDate={new Date()}
                />
                <DatePickerField
                  label="End date"
                  value={endDate}
                  onChange={setEndDate}
                  maxDate={new Date()}
                />
              </div>

              {/* Flow Intensity */}
              <div className="mb-5">
                <label className="text-xs font-bold text-muted-foreground mb-2 block uppercase tracking-wider">
                  Flow intensity
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {FLOW_OPTIONS.map(option => (
                    <button
                      key={option.value}
                      onClick={() => setFlow(option.value)}
                      className={`flex flex-col items-center gap-1.5 py-3 rounded-2xl border-2 text-xs font-bold transition-all
                        ${flow === option.value
                          ? 'border-primary bg-[var(--blush)] dark:bg-primary/15 text-primary scale-[1.02]'
                          : 'border-transparent bg-[var(--cream)] dark:bg-muted hover:bg-accent text-muted-foreground'
                        }
                      `}
                    >
                      <div className="flex gap-0.5">
                        {Array.from({ length: option.dots }).map((_, i) => (
                          <div
                            key={i}
                            className={`size-2.5 rounded-full ${
                              flow === option.value ? 'bg-primary' : 'bg-muted-foreground/30'
                            }`}
                          />
                        ))}
                      </div>
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Symptoms */}
              <div className="mb-5">
                <label className="text-xs font-bold text-muted-foreground mb-2 block uppercase tracking-wider">
                  Symptoms
                </label>
                <div className="flex flex-wrap gap-2">
                  {SYMPTOMS.map(({ name, emoji }) => (
                    <button
                      key={name}
                      onClick={() => toggleSymptom(name)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all
                        ${symptoms.includes(name)
                          ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                          : 'bg-[var(--cream)] dark:bg-muted text-muted-foreground hover:bg-accent'
                        }
                      `}
                    >
                      {emoji} {name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Expandable section */}
              <button
                onClick={() => setShowMore(!showMore)}
                className="flex items-center gap-1 text-sm text-primary font-bold mb-4"
              >
                {showMore ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                {showMore ? 'Show less' : 'More options'}
              </button>

              <AnimatePresence>
                {showMore && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    {/* Mood */}
                    <div className="mb-5">
                      <label className="text-xs font-bold text-muted-foreground mb-2 block uppercase tracking-wider">
                        How are you feeling?
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {MOODS.map(({ name, emoji }) => (
                          <button
                            key={name}
                            onClick={() => toggleMood(name)}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all
                              ${moods.includes(name)
                                ? 'bg-[var(--lavender)] dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 shadow-sm'
                                : 'bg-[var(--cream)] dark:bg-muted text-muted-foreground hover:bg-accent'
                              }
                            `}
                          >
                            {emoji} {name}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Notes */}
                    <div className="mb-5">
                      <label className="text-xs font-bold text-muted-foreground mb-1.5 block uppercase tracking-wider">
                        Notes
                      </label>
                      <textarea
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        placeholder="Write something here~"
                        rows={3}
                        className="w-full rounded-2xl border bg-card px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 font-medium"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Actions */}
              <div className="flex gap-3 mt-2">
                {editEntry && onDelete && (
                  <Button
                    variant="destructive"
                    className="rounded-2xl font-bold"
                    onClick={() => {
                      onDelete(editEntry.id);
                      onClose();
                    }}
                  >
                    Delete
                  </Button>
                )}
                <Button
                  className="flex-1 rounded-2xl h-12 text-base font-bold shadow-md shadow-primary/20"
                  onClick={handleSave}
                >
                  {editEntry ? 'Update' : 'Save Entry'}
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
