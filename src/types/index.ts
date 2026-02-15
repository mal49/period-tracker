export interface CycleEntry {
    id: string;
    startDate: string;
    endDate: string;
    flowIntensity: 'light' | 'medium' | 'heavy' | 'spotting';
    symptoms: string[];
    mood: string[];
    notes: string;
    cycleLength?: number;
    periodLength?: number;
  }
  
  export interface UserSettings {
    userName?: string;
    averageCycleLength: number;
    averagePeriodLength: number;
    notificationsEnabled: boolean;
    reminderDaysBefore: number;
    lutealPhaseLength: number;
  }
  
  export type CyclePhase = 'menstrual' | 'follicular' | 'ovulation' | 'luteal';
  
  export interface DayData {
    date: Date;
    isPeriod: boolean;
    isPredicted: boolean;
    isFertile: boolean;
    isOvulation: boolean;
    phase: CyclePhase;
    entry?: CycleEntry;
  }