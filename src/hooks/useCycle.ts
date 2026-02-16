import { useMemo, useCallback } from 'react';
import { addDays, differenceInDays, startOfDay, isSameDay, isWithinInterval, subDays } from 'date-fns';
import type { CycleEntry, UserSettings, CyclePhase, DayData } from '../types';

export function useCycle(entries: CycleEntry[], settings: UserSettings) {
  const today = startOfDay(new Date());

  const getPhaseForDay = useCallback((date: Date, lastEntry: CycleEntry | null): CyclePhase => {
    if (!lastEntry) return 'follicular';
    
    const startDate = new Date(lastEntry.startDate);
    const daysSinceStart = differenceInDays(date, startDate);
    const periodLength = lastEntry.periodLength || settings.averagePeriodLength;
    const cycleLength = lastEntry.cycleLength || settings.averageCycleLength;
    
    if (daysSinceStart < periodLength) return 'menstrual';
    if (daysSinceStart < cycleLength - 14) return 'follicular';
    if (daysSinceStart === cycleLength - 14) return 'ovulation';
    return 'luteal';
  }, [settings]);

  const getDayData = useCallback((date: Date): DayData => {
    const entry = entries.find(e => {
      const start = new Date(e.startDate);
      if (!e.endDate) {
        return isSameDay(date, start) || (date >= start && date <= today);
      }
      const end = new Date(e.endDate);
      return isWithinInterval(date, { start, end }) || isSameDay(date, start) || isSameDay(date, end);
    });

    const lastEntry = entries
      .filter(e => new Date(e.startDate) <= date)
      .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())[0] || null;

    const isPeriod = !!entry;
    const phase = getPhaseForDay(date, lastEntry);
    
    // Predict next period
    let isPredicted = false;
    if (!isPeriod && lastEntry) {
      const cycleLength = lastEntry.cycleLength || settings.averageCycleLength;
      const nextPeriodStart = addDays(new Date(lastEntry.startDate), cycleLength);
      const nextPeriodEnd = addDays(nextPeriodStart, (lastEntry.periodLength || settings.averagePeriodLength) - 1);
      isPredicted = isWithinInterval(date, { start: nextPeriodStart, end: nextPeriodEnd }) || 
                    isSameDay(date, nextPeriodStart) || 
                    isSameDay(date, nextPeriodEnd);
    }

    // Fertile window (5 days before ovulation + ovulation day)
    let isFertile = false;
    let isOvulation = false;
    if (!isPeriod && lastEntry) {
      const cycleLength = lastEntry.cycleLength || settings.averageCycleLength;
      const ovulationDay = addDays(new Date(lastEntry.startDate), cycleLength - 14);
      const fertileStart = subDays(ovulationDay, 5);
      const fertileEnd = addDays(ovulationDay, 1);
      
      isFertile = isWithinInterval(date, { start: fertileStart, end: fertileEnd }) ||
                  isSameDay(date, fertileStart) ||
                  isSameDay(date, fertileEnd);
      isOvulation = isSameDay(date, ovulationDay);
    }

    return {
      date,
      isPeriod,
      isPredicted,
      isFertile,
      isOvulation,
      phase,
      entry,
    };
  }, [entries, settings, getPhaseForDay]);

  const currentPhase = useMemo(() => {
    return getDayData(today).phase;
  }, [today, getDayData]);

  const nextPeriodDate = useMemo(() => {
    const lastEntry = entries.sort((a, b) => 
      new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    )[0];
    
    if (!lastEntry) return null;
    
    const cycleLength = lastEntry.cycleLength || settings.averageCycleLength;
    return addDays(new Date(lastEntry.startDate), cycleLength);
  }, [entries, settings]);

  const daysUntilNextPeriod = useMemo(() => {
    if (!nextPeriodDate) return null;
    return differenceInDays(nextPeriodDate, today);
  }, [nextPeriodDate, today]);

  const cycleDay = useMemo(() => {
    const lastEntry = entries
      .filter(e => new Date(e.startDate) <= today)
      .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())[0];
    
    if (!lastEntry) return null;
    return differenceInDays(today, new Date(lastEntry.startDate)) + 1;
  }, [entries, today]);

  return {
    getDayData,
    currentPhase,
    nextPeriodDate,
    daysUntilNextPeriod,
    cycleDay,
    today,
  };
}