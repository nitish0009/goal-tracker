import { CyclePhase } from "@/generated/prisma/client";
import { isWithinInterval, parseISO } from "date-fns";

export type CycleWindow = {
  phase: CyclePhase;
  label: string;
  windowStart: Date;
  windowEnd: Date;
  allowsGoalSetting: boolean;
  allowsCheckIn: boolean;
};

/** Annual cycle windows per BRD (demo year 2026). */
export function getCycleWindows(year: number): CycleWindow[] {
  return [
    {
      phase: CyclePhase.GOAL_SETTING,
      label: "Goal Setting",
      windowStart: parseISO(`${year}-05-01`),
      windowEnd: parseISO(`${year}-06-30`),
      allowsGoalSetting: true,
      allowsCheckIn: false,
    },
    {
      phase: CyclePhase.Q1_CHECKIN,
      label: "Q1 Check-in",
      windowStart: parseISO(`${year}-07-01`),
      windowEnd: parseISO(`${year}-07-31`),
      allowsGoalSetting: false,
      allowsCheckIn: true,
    },
    {
      phase: CyclePhase.Q2_CHECKIN,
      label: "Q2 Check-in",
      windowStart: parseISO(`${year}-10-01`),
      windowEnd: parseISO(`${year}-10-31`),
      allowsGoalSetting: false,
      allowsCheckIn: true,
    },
    {
      phase: CyclePhase.Q3_CHECKIN,
      label: "Q3 Check-in",
      windowStart: parseISO(`${year + 1}-01-01`),
      windowEnd: parseISO(`${year + 1}-01-31`),
      allowsGoalSetting: false,
      allowsCheckIn: true,
    },
    {
      phase: CyclePhase.Q4_CHECKIN,
      label: "Q4 / Annual",
      windowStart: parseISO(`${year + 1}-03-01`),
      windowEnd: parseISO(`${year + 1}-04-30`),
      allowsGoalSetting: false,
      allowsCheckIn: true,
    },
  ];
}

export function getActiveWindow(
  year: number,
  now: Date = new Date(),
  demoOverride?: CyclePhase
): CycleWindow | null {
  if (demoOverride) {
    const windows = getCycleWindows(year);
    return windows.find((w) => w.phase === demoOverride) ?? null;
  }
  const windows = getCycleWindows(year);
  return (
    windows.find((w) => isWithinInterval(now, { start: w.windowStart, end: w.windowEnd })) ??
    null
  );
}

export function isGoalSettingOpen(year: number, now = new Date(), demoPhase?: CyclePhase) {
  const w = getActiveWindow(year, now, demoPhase);
  return w?.allowsGoalSetting ?? false;
}

export function isCheckInOpen(year: number, now = new Date(), demoPhase?: CyclePhase) {
  const w = getActiveWindow(year, now, demoPhase);
  return w?.allowsCheckIn ?? false;
}

export function getCurrentCheckInPhase(
  year: number,
  now = new Date(),
  demoPhase?: CyclePhase
): CyclePhase | null {
  const w = getActiveWindow(year, now, demoPhase);
  return w?.allowsCheckIn ? w.phase : null;
}
