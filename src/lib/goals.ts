export const MIN_GOAL_WEIGHT = 10;
export const MAX_GOALS = 8;
export const REQUIRED_TOTAL_WEIGHT = 100;

export type GoalInput = {
  id?: string;
  thrustArea: string;
  title: string;
  description?: string;
  uomType: string;
  target: string;
  weightage: number;
  isShared?: boolean;
  sharedGroupId?: string | null;
  isPrimaryOwner?: boolean;
};

export function validateGoals(
  goals: GoalInput[],
  options?: { weightOnly?: boolean }
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (goals.length === 0) {
    errors.push("Add at least one goal.");
    return { valid: false, errors };
  }
  if (goals.length > MAX_GOALS) {
    errors.push(`Maximum ${MAX_GOALS} goals allowed.`);
  }

  const total = goals.reduce((s, g) => s + g.weightage, 0);
  if (Math.abs(total - REQUIRED_TOTAL_WEIGHT) > 0.01) {
    errors.push(`Total weightage must equal ${REQUIRED_TOTAL_WEIGHT}% (current: ${total}%).`);
  }

  for (const g of goals) {
    if (g.weightage < MIN_GOAL_WEIGHT) {
      errors.push(`"${g.title}" weightage must be at least ${MIN_GOAL_WEIGHT}%.`);
    }
    if (!options?.weightOnly) {
      if (!g.thrustArea?.trim()) errors.push("Each goal needs a Thrust Area.");
      if (!g.title?.trim()) errors.push("Each goal needs a title.");
      if (!g.target?.trim()) errors.push(`"${g.title || "Goal"}" needs a target.`);
    }
  }

  return { valid: errors.length === 0, errors };
}
