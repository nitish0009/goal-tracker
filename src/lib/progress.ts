import { UomType } from "@/generated/prisma/client";

export function computeProgressScore(
  uomType: UomType,
  target: string,
  actual: string | null | undefined,
  deadline?: Date | null,
  completionDate?: Date | null
): number | null {
  if (!actual && uomType !== UomType.ZERO_BASED) return null;

  switch (uomType) {
    case UomType.NUMERIC_MIN:
    case UomType.PERCENT_MIN: {
      const t = parseFloat(target);
      const a = parseFloat(actual ?? "0");
      if (!t || isNaN(a)) return null;
      return Math.min(100, Math.round((a / t) * 1000) / 10);
    }
    case UomType.NUMERIC_MAX:
    case UomType.PERCENT_MAX: {
      const t = parseFloat(target);
      const a = parseFloat(actual ?? "0");
      if (!a || isNaN(t)) return null;
      return Math.min(100, Math.round((t / a) * 1000) / 10);
    }
    case UomType.TIMELINE: {
      if (!deadline || !completionDate) return null;
      const onTime = completionDate.getTime() <= deadline.getTime();
      return onTime ? 100 : Math.max(0, 50);
    }
    case UomType.ZERO_BASED: {
      const val = parseFloat(actual ?? "0");
      return val === 0 ? 100 : 0;
    }
    default:
      return null;
  }
}
