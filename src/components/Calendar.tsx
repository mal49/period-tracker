import { useState, useMemo } from 'react';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { DayData } from '@/types';
import { Mascot, SpeechBubble } from '@/components/Mascot';

interface CalendarProps {
  getDayData: (date: Date) => DayData;
  onDayClick: (date: Date) => void;
  today: Date;
}

const encouragements = [
  "You're doing amazing! Keep tracking~",
  "Every day counts! I'm proud of you~",
  "Stay consistent, you've got this!",
  "Your body is wonderful. Take care of it~",
  "Remember to drink water today!",
];

export function Calendar({ getDayData, onDayClick, today }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [direction, setDirection] = useState(0);

  const days = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [currentMonth]);

  const goToPreviousMonth = () => {
    setDirection(-1);
    setCurrentMonth(prev => subMonths(prev, 1));
  };

  const goToNextMonth = () => {
    setDirection(1);
    setCurrentMonth(prev => addMonths(prev, 1));
  };

  const goToToday = () => {
    setDirection(0);
    setCurrentMonth(new Date());
  };

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const randomEncouragement = encouragements[currentMonth.getMonth() % encouragements.length];

  return (
    <div className="w-full space-y-4">
      {/* Calendar Card */}
      <div className="bg-card rounded-3xl p-5 card-soft">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <button
            onClick={goToPreviousMonth}
            className="size-9 rounded-xl bg-[var(--cream)] dark:bg-muted flex items-center justify-center hover:bg-accent transition-colors active:scale-95"
          >
            <ChevronLeft className="size-4 text-foreground" />
          </button>
          <button
            onClick={goToToday}
            className="text-lg font-bold text-foreground hover:text-primary transition-colors"
          >
            {format(currentMonth, 'MMMM yyyy')}
          </button>
          <button
            onClick={goToNextMonth}
            className="size-9 rounded-xl bg-[var(--cream)] dark:bg-muted flex items-center justify-center hover:bg-accent transition-colors active:scale-95"
          >
            <ChevronRight className="size-4 text-foreground" />
          </button>
        </div>

        {/* Week day headers */}
        <div className="grid grid-cols-7 mb-2">
          {weekDays.map(day => (
            <div
              key={day}
              className="text-center text-[11px] font-bold text-muted-foreground/60 uppercase tracking-wider py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={format(currentMonth, 'yyyy-MM')}
            initial={{ x: direction * 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: direction * -40, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="grid grid-cols-7 gap-1"
          >
            {days.map(day => {
              const dayData = getDayData(day);
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isToday = isSameDay(day, today);

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => onDayClick(day)}
                  className={`
                    relative flex flex-col items-center justify-center
                    aspect-square rounded-2xl text-sm font-medium transition-all duration-150
                    ${!isCurrentMonth ? 'opacity-25' : ''}
                    ${isToday && !dayData.isPeriod ? 'ring-2 ring-primary/50 ring-offset-1 ring-offset-background' : ''}
                    ${dayData.isPeriod ? 'bg-primary text-primary-foreground font-bold shadow-sm shadow-primary/20' : ''}
                    ${dayData.isPredicted && !dayData.isPeriod ? 'bg-[var(--blush)] dark:bg-primary/20 text-primary font-semibold' : ''}
                    ${dayData.isFertile && !dayData.isPeriod && !dayData.isPredicted ? 'bg-[var(--mint)] dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : ''}
                    ${dayData.isOvulation ? 'bg-emerald-200 dark:bg-emerald-800/40 text-emerald-800 dark:text-emerald-300 font-bold' : ''}
                    ${!dayData.isPeriod && !dayData.isPredicted && !dayData.isFertile && !dayData.isOvulation ? 'hover:bg-[var(--cream)] dark:hover:bg-muted' : ''}
                    active:scale-90
                  `}
                >
                  <span>{format(day, 'd')}</span>
                  {/* Dot indicators */}
                  <div className="flex gap-0.5 mt-0.5 h-1">
                    {dayData.isPeriod && (
                      <span className="size-1 rounded-full bg-primary-foreground" />
                    )}
                    {dayData.entry && dayData.entry.symptoms.length > 0 && (
                      <span className="size-1 rounded-full bg-amber-400" />
                    )}
                  </div>
                </button>
              );
            })}
          </motion.div>
        </AnimatePresence>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-5 justify-center">
          {[
            { color: 'bg-primary', label: 'Period' },
            { color: 'bg-[var(--blush)] dark:bg-primary/20', label: 'Predicted', border: true },
            { color: 'bg-[var(--mint)] dark:bg-emerald-800/40', label: 'Fertile' },
            { color: 'bg-emerald-200 dark:bg-emerald-700/40', label: 'Ovulation' },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
              <span className={`size-3 rounded-full ${item.color} ${item.border ? 'border border-primary/20' : ''}`} />
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Mascot Encouragement */}
      <div className="flex items-end gap-3">
        <Mascot size="md" mood="happy" />
        <div className="flex-1 mb-1">
          <SpeechBubble direction="left">
            {randomEncouragement}
          </SpeechBubble>
        </div>
      </div>
    </div>
  );
}
