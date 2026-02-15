import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { CalendarDays, Heart, Sparkles, Plus } from 'lucide-react';
import type { CyclePhase, CycleEntry, UserSettings } from '@/types';
import { Mascot, SpeechBubble } from '@/components/Mascot';

interface DashboardProps {
  currentPhase: CyclePhase;
  cycleDay: number | null;
  daysUntilNextPeriod: number | null;
  nextPeriodDate: Date | null;
  entries: CycleEntry[];
  settings: UserSettings;
}

const phaseConfig: Record<CyclePhase, {
  label: string;
  emoji: string;
  color: string;
  ringColor: string;
  mascotMood: 'happy' | 'sleepy' | 'love' | 'excited';
  tips: string[];
  encouragement: string;
}> = {
  menstrual: {
    label: 'Menstrual',
    emoji: '🩸',
    color: 'text-[#F5B0C5]',
    ringColor: '#F5B0C5',
    mascotMood: 'sleepy',
    tips: ['Stay hydrated', 'Rest well', 'Warm compress', 'Iron-rich foods'],
    encouragement: "Take it easy today! You're doing great. Rest up and be kind to yourself~",
  },
  follicular: {
    label: 'Follicular',
    emoji: '🌱',
    color: 'text-[#A8E6C3]',
    ringColor: '#A8E6C3',
    mascotMood: 'happy',
    tips: ['Energy rising!', 'Try exercise', 'Start projects', 'Creativity peak'],
    encouragement: "Your energy is blooming! It's a wonderful time to try something new~",
  },
  ovulation: {
    label: 'Ovulation',
    emoji: '✨',
    color: 'text-[#F5DFA0]',
    ringColor: '#F5DFA0',
    mascotMood: 'excited',
    tips: ['Peak energy', 'Social time!', 'Glow up!', 'Stay active'],
    encouragement: "You're absolutely radiant today! Enjoy this wonderful energy~",
  },
  luteal: {
    label: 'Luteal',
    emoji: '🌙',
    color: 'text-[#C8B8F0]',
    ringColor: '#C8B8F0',
    mascotMood: 'love',
    tips: ['Self-care time', 'Comfort foods', 'Gentle exercise', 'Extra sleep'],
    encouragement: "Be gentle with yourself. A warm cup of tea and cozy vibes are perfect~",
  },
};

// Pastel phase colors for the ring segments
const PHASE_COLORS = {
  menstrual: '#F5B0C5',
  follicular: '#A8E6C3',
  ovulation: '#F5DFA0',
  luteal: '#C8B8F0',
};

interface PhaseSegment {
  phase: CyclePhase;
  startDay: number;
  endDay: number;
  color: string;
}

function getPhaseSegments(settings: UserSettings): PhaseSegment[] {
  const { averageCycleLength, averagePeriodLength, lutealPhaseLength } = settings;
  const ovulationDay = averageCycleLength - lutealPhaseLength;

  return [
    {
      phase: 'menstrual',
      startDay: 0,
      endDay: averagePeriodLength,
      color: PHASE_COLORS.menstrual,
    },
    {
      phase: 'follicular',
      startDay: averagePeriodLength,
      endDay: ovulationDay - 1,
      color: PHASE_COLORS.follicular,
    },
    {
      phase: 'ovulation',
      startDay: ovulationDay - 1,
      endDay: ovulationDay + 1,
      color: PHASE_COLORS.ovulation,
    },
    {
      phase: 'luteal',
      startDay: ovulationDay + 1,
      endDay: averageCycleLength,
      color: PHASE_COLORS.luteal,
    },
  ];
}

function CycleProgressWheel({
  cycleDay,
  daysUntilNextPeriod,
  nextPeriodDate,
  currentPhase,
  settings,
}: {
  cycleDay: number | null;
  daysUntilNextPeriod: number | null;
  nextPeriodDate: Date | null;
  currentPhase: CyclePhase;
  settings: UserSettings;
}) {
  const size = 220;
  const center = size / 2;
  const radius = 88;
  const strokeWidth = 14;
  const totalDays = settings.averageCycleLength;
  const segments = getPhaseSegments(settings);

  // Calculate arc for each segment
  function describeArc(startAngle: number, endAngle: number, r: number) {
    const startRad = ((startAngle - 90) * Math.PI) / 180;
    const endRad = ((endAngle - 90) * Math.PI) / 180;
    const x1 = center + r * Math.cos(startRad);
    const y1 = center + r * Math.sin(startRad);
    const x2 = center + r * Math.cos(endRad);
    const y2 = center + r * Math.sin(endRad);
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
  }

  // Current position on the ring
  const currentDay = cycleDay ? Math.min(cycleDay, totalDays) : 0;
  const currentAngle = (currentDay / totalDays) * 360;
  const markerRad = ((currentAngle - 90) * Math.PI) / 180;
  const markerX = center + radius * Math.cos(markerRad);
  const markerY = center + radius * Math.sin(markerRad);

  // Phase labels around the ring
  const phaseLabels = segments.map(seg => {
    const midDay = (seg.startDay + seg.endDay) / 2;
    const midAngle = ((midDay / totalDays) * 360 - 90) * (Math.PI / 180);
    const labelRadius = radius + 22;
    return {
      x: center + labelRadius * Math.cos(midAngle),
      y: center + labelRadius * Math.sin(midAngle),
      emoji: phaseConfig[seg.phase].emoji,
      phase: seg.phase,
    };
  });

  return (
    <div className="relative flex items-center justify-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background ring — very subtle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="var(--border)"
          strokeWidth={strokeWidth}
          opacity={0.4}
        />

        {/* Phase segments */}
        {segments.map((seg, i) => {
          const startAngle = (seg.startDay / totalDays) * 360;
          const endAngle = (seg.endDay / totalDays) * 360;
          // Add tiny gap between segments
          const gapAngle = 1.5;
          const adjustedStart = startAngle + (i === 0 ? 0 : gapAngle / 2);
          const adjustedEnd = endAngle - (i === segments.length - 1 ? 0 : gapAngle / 2);

          return (
            <motion.path
              key={seg.phase}
              d={describeArc(adjustedStart, adjustedEnd, radius)}
              fill="none"
              stroke={seg.color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.8, delay: i * 0.15, ease: 'easeOut' }}
            />
          );
        })}

        {/* Dimmed overlay for future segments (days not yet reached) */}
        {cycleDay && (
          <motion.path
            d={describeArc(currentAngle, 360, radius)}
            fill="none"
            stroke="var(--background)"
            strokeWidth={strokeWidth + 1}
            opacity={0.5}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            transition={{ duration: 0.5, delay: 0.8 }}
          />
        )}

        {/* Current position marker */}
        {cycleDay && (
          <motion.g
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 1, type: 'spring', stiffness: 300 }}
          >
            {/* Outer glow */}
            <circle
              cx={markerX}
              cy={markerY}
              r={12}
              fill={PHASE_COLORS[currentPhase]}
              opacity={0.2}
            />
            {/* Marker dot */}
            <circle
              cx={markerX}
              cy={markerY}
              r={7}
              fill="white"
              stroke={PHASE_COLORS[currentPhase]}
              strokeWidth={3}
            />
          </motion.g>
        )}

        {/* Phase emoji markers around the ring */}
        {phaseLabels.map((label) => (
          <text
            key={label.phase}
            x={label.x}
            y={label.y}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="14"
          >
            {label.emoji}
          </text>
        ))}
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {daysUntilNextPeriod !== null && nextPeriodDate ? (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4, type: 'spring' }}
            className="text-center"
          >
            {daysUntilNextPeriod <= 0 ? (
              <>
                <span className="text-3xl font-extrabold text-primary leading-none">Due!</span>
                <p className="text-[10px] font-bold text-muted-foreground mt-1 uppercase tracking-wider">Period time</p>
              </>
            ) : (
              <>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Next period in</span>
                <div className="flex items-baseline justify-center gap-1 mt-0.5">
                  <span className="text-4xl font-extrabold text-foreground leading-none">{daysUntilNextPeriod}</span>
                  <span className="text-base font-bold text-muted-foreground">days</span>
                </div>
                <p className="text-xs font-semibold text-primary mt-1">{format(nextPeriodDate, 'MMM d')}</p>
              </>
            )}
            {cycleDay && (
              <p className="text-[10px] font-semibold text-muted-foreground/60 mt-1.5">
                Day {cycleDay} of {settings.averageCycleLength}
              </p>
            )}
          </motion.div>
        ) : (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center px-4"
          >
            <Plus className="size-8 text-primary/30 mx-auto mb-1" />
            <p className="text-xs font-bold text-muted-foreground">Log your first</p>
            <p className="text-xs font-bold text-muted-foreground">period to start</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}

/** Small phase legend bar showing phase proportions */
function PhaseLegendBar({ settings, currentPhase }: { settings: UserSettings; currentPhase: CyclePhase }) {
  const segments = getPhaseSegments(settings);
  const total = settings.averageCycleLength;

  return (
    <div className="mt-4 px-2">
      {/* Proportional bar */}
      <div className="flex gap-0.5 h-2 rounded-full overflow-hidden mb-2.5">
        {segments.map((seg) => {
          const width = ((seg.endDay - seg.startDay) / total) * 100;
          return (
            <motion.div
              key={seg.phase}
              className="rounded-full"
              style={{ backgroundColor: seg.color, width: `${width}%` }}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.5 }}
            />
          );
        })}
      </div>
      {/* Labels */}
      <div className="flex justify-between px-1">
        {segments.map((seg) => (
          <div key={seg.phase} className="flex items-center gap-1">
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: seg.color }}
            />
            <span className={`text-[10px] font-bold ${seg.phase === currentPhase ? 'text-foreground' : 'text-muted-foreground/60'}`}>
              {phaseConfig[seg.phase].label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Dashboard({
  currentPhase,
  cycleDay,
  daysUntilNextPeriod,
  nextPeriodDate,
  entries,
  settings,
}: DashboardProps) {
  const phase = phaseConfig[currentPhase];
  const lastEntry = [...entries].sort((a, b) =>
    new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  )[0];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-5"
    >
      {/* Main Cycle Card */}
      <motion.div
        variants={itemVariants}
        className="bg-card rounded-3xl p-5 card-soft"
      >
        {/* Phase emoji badge */}
        <div className="flex justify-center mb-1">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, delay: 0.2 }}
            className="px-3 py-1 rounded-full bg-[var(--blush)] dark:bg-accent"
          >
            <span className="text-sm font-semibold">
              {phase.emoji} {phase.label} Phase
            </span>
          </motion.div>
        </div>

        {/* Progression Wheel */}
        <div className="flex justify-center">
          <CycleProgressWheel
            cycleDay={cycleDay}
            daysUntilNextPeriod={daysUntilNextPeriod}
            nextPeriodDate={nextPeriodDate}
            currentPhase={currentPhase}
            settings={settings}
          />
        </div>

        {/* Phase legend bar */}
        <PhaseLegendBar settings={settings} currentPhase={currentPhase} />
      </motion.div>

      {/* Stats Cards Row */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3">
        {/* Next Period */}
        <div className="bg-card rounded-2xl p-4 card-soft">
          <div className="flex items-center gap-2 mb-2">
            <div className="size-7 rounded-lg bg-[var(--blush)] dark:bg-accent flex items-center justify-center">
              <CalendarDays className="size-3.5 text-primary" />
            </div>
            <span className="text-xs font-semibold text-muted-foreground">Next Period</span>
          </div>
          {daysUntilNextPeriod !== null && nextPeriodDate ? (
            <>
              <p className="text-2xl font-extrabold text-foreground">
                {daysUntilNextPeriod <= 0 ? 'Due!' : `${daysUntilNextPeriod}d`}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 font-medium">
                {format(nextPeriodDate, 'MMM d')}
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Log a period first</p>
          )}
        </div>

        {/* Fertility */}
        <div className="bg-card rounded-2xl p-4 card-soft">
          <div className="flex items-center gap-2 mb-2">
            <div className="size-7 rounded-lg bg-[var(--mint)] dark:bg-accent flex items-center justify-center">
              <Heart className="size-3.5 text-emerald-500" />
            </div>
            <span className="text-xs font-semibold text-muted-foreground">Fertility</span>
          </div>
          <p className="text-2xl font-extrabold text-foreground">
            {currentPhase === 'ovulation' ? 'High' : currentPhase === 'follicular' ? 'Rising' : 'Low'}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 font-medium">
            {currentPhase === 'ovulation' ? 'Fertile window' : currentPhase === 'follicular' ? 'Approaching' : 'Not fertile'}
          </p>
        </div>
      </motion.div>

      {/* Tips Card */}
      <motion.div variants={itemVariants} className="bg-card rounded-2xl p-4 card-soft">
        <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-1.5">
          <Sparkles className="size-4 text-primary" />
          Tips for today
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {phase.tips.map((tip, i) => (
            <div
              key={i}
              className="flex items-center gap-2 text-xs text-muted-foreground bg-[var(--cream)] dark:bg-muted rounded-xl p-2.5 font-medium"
            >
              <span className="size-2 rounded-full bg-primary/40 shrink-0" />
              {tip}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Last Period Info */}
      {lastEntry && (
        <motion.div variants={itemVariants} className="bg-card rounded-2xl p-4 card-soft">
          <h3 className="text-sm font-bold text-foreground mb-2">Last Period</h3>
          <div className="space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground font-medium">Started</span>
              <span className="font-semibold">{format(new Date(lastEntry.startDate), 'MMM d, yyyy')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground font-medium">Ended</span>
              <span className="font-semibold">{format(new Date(lastEntry.endDate), 'MMM d, yyyy')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground font-medium">Flow</span>
              <span className="font-semibold capitalize">{lastEntry.flowIntensity}</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Mascot Section */}
      <motion.div variants={itemVariants} className="flex items-end gap-3 pt-2">
        <Mascot size="lg" mood={phase.mascotMood} />
        <div className="flex-1 mb-2">
          <SpeechBubble direction="left">
            {phase.encouragement}
          </SpeechBubble>
        </div>
      </motion.div>

      {/* Empty State */}
      {entries.length === 0 && (
        <motion.div
          variants={itemVariants}
          className="text-center py-8 px-4"
        >
          <Mascot size="xl" mood="excited" className="mx-auto mb-4" />
          <h3 className="text-lg font-bold text-foreground mb-1">Welcome to Wawa!</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Start by logging your period using the + button below. Your data stays private on your device~
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
