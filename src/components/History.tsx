import { format, differenceInDays } from 'date-fns';
import { motion } from 'framer-motion';
import { Droplets, Pencil } from 'lucide-react';
import type { CycleEntry } from '@/types';
import { Mascot, SpeechBubble } from '@/components/Mascot';

interface HistoryProps {
  entries: CycleEntry[];
  onEditEntry: (entry: CycleEntry) => void;
}

export function History({ entries, onEditEntry }: HistoryProps) {
  const sortedEntries = [...entries].sort(
    (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  );

  const getCycleLength = (entry: CycleEntry, index: number): number | null => {
    if (index >= sortedEntries.length - 1) return null;
    const nextEntry = sortedEntries[index + 1];
    return differenceInDays(new Date(entry.startDate), new Date(nextEntry.startDate));
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

  if (sortedEntries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Mascot size="xl" mood="wink" className="mb-4" />
        <h3 className="text-lg font-bold text-foreground mb-1">No entries yet</h3>
        <p className="text-sm text-muted-foreground max-w-[220px] leading-relaxed">
          Start logging your periods to see your history and patterns here~
        </p>
      </div>
    );
  }

  // Calculate averages
  const cycleLengths = sortedEntries
    .map((_, i) => getCycleLength(_, i))
    .filter((l): l is number => l !== null && l > 0 && l < 60);
  const avgCycleLength = cycleLengths.length > 0
    ? Math.round(cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length)
    : null;
  const periodLengths = sortedEntries
    .filter(e => e.endDate)
    .map(e => differenceInDays(new Date(e.endDate!), new Date(e.startDate)) + 1);
  const avgPeriodLength = periodLengths.length > 0
    ? Math.round(periodLengths.reduce((a, b) => a + b, 0) / periodLengths.length)
    : null;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-4"
    >
      {/* Stats Summary */}
      {sortedEntries.length >= 2 && (
        <motion.div variants={itemVariants} className="grid grid-cols-3 gap-3">
          <div className="bg-card rounded-2xl p-3 text-center card-soft">
            <p className="text-2xl font-extrabold text-foreground">{sortedEntries.length}</p>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-0.5">Periods</p>
          </div>
          {avgCycleLength && (
            <div className="bg-card rounded-2xl p-3 text-center card-soft">
              <p className="text-2xl font-extrabold text-foreground">{avgCycleLength}d</p>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-0.5">Avg Cycle</p>
            </div>
          )}
          {avgPeriodLength && (
            <div className="bg-card rounded-2xl p-3 text-center card-soft">
              <p className="text-2xl font-extrabold text-foreground">{avgPeriodLength}d</p>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-0.5">Avg Period</p>
            </div>
          )}
        </motion.div>
      )}

      {/* Entries List */}
      <div className="space-y-2.5">
        {sortedEntries.map((entry, index) => {
          const isOngoing = !entry.endDate;
          const periodLength = entry.endDate
            ? differenceInDays(new Date(entry.endDate), new Date(entry.startDate)) + 1
            : differenceInDays(new Date(), new Date(entry.startDate)) + 1;
          const cycleLength = getCycleLength(entry, index);

          return (
            <motion.div
              key={entry.id}
              variants={itemVariants}
              className="bg-card rounded-2xl p-4 card-soft"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="size-10 rounded-xl bg-[var(--blush)] dark:bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
                    <Droplets className="size-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-foreground">
                        {isOngoing
                          ? `${format(new Date(entry.startDate), 'MMM d, yyyy')} - now`
                          : `${format(new Date(entry.startDate), 'MMM d')} - ${format(new Date(entry.endDate!), 'MMM d, yyyy')}`
                        }
                      </p>
                      {isOngoing && (
                        <span className="px-1.5 py-0.5 rounded-full bg-primary/15 text-primary text-[10px] font-bold uppercase">
                          Ongoing
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground font-medium">
                      <span className="px-2 py-0.5 rounded-lg bg-[var(--cream)] dark:bg-muted">
                        {isOngoing ? `${periodLength}d so far` : `${periodLength} day${periodLength !== 1 ? 's' : ''}`}
                      </span>
                      <span className="px-2 py-0.5 rounded-lg bg-[var(--cream)] dark:bg-muted capitalize">{entry.flowIntensity}</span>
                      {cycleLength && <span className="px-2 py-0.5 rounded-lg bg-[var(--cream)] dark:bg-muted">{cycleLength}d cycle</span>}
                    </div>
                    {entry.symptoms.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {entry.symptoms.slice(0, 4).map(symptom => (
                          <span
                            key={symptom}
                            className="px-2 py-0.5 rounded-full bg-[var(--peach)] dark:bg-accent text-xs font-medium text-muted-foreground"
                          >
                            {symptom}
                          </span>
                        ))}
                        {entry.symptoms.length > 4 && (
                          <span className="px-2 py-0.5 rounded-full bg-[var(--peach)] dark:bg-accent text-xs font-medium text-muted-foreground">
                            +{entry.symptoms.length - 4}
                          </span>
                        )}
                      </div>
                    )}
                    {entry.notes && (
                      <p className="text-xs text-muted-foreground mt-1.5 line-clamp-1 italic">
                        "{entry.notes}"
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => onEditEntry(entry)}
                  className="p-2 rounded-xl hover:bg-[var(--cream)] dark:hover:bg-muted transition-colors"
                >
                  <Pencil className="size-3.5 text-muted-foreground" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Mascot section at bottom */}
      <div className="flex items-end gap-3 pt-2">
        <Mascot size="md" mood="love" />
        <div className="flex-1 mb-1">
          <SpeechBubble direction="left">
            Keep tracking! The more data you log, the better your predictions will be~
          </SpeechBubble>
        </div>
      </div>
    </motion.div>
  );
}
