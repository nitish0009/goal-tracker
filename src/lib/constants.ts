export const THRUST_AREAS = [
  "Revenue Growth",
  "Operational Excellence",
  "Customer Experience",
  "Innovation & Digital",
  "People & Culture",
  "Risk & Compliance",
] as const;

export const UOM_LABELS: Record<string, string> = {
  NUMERIC_MIN: "Numeric (Higher is better)",
  NUMERIC_MAX: "Numeric (Lower is better)",
  PERCENT_MIN: "Percentage (Higher is better)",
  PERCENT_MAX: "Percentage (Lower is better)",
  TIMELINE: "Timeline (Date-based)",
  ZERO_BASED: "Zero-based (Zero = Success)",
};

export const DEMO_USERS = {
  employee: { email: "employee@atomquest.demo", password: "demo123" },
  manager: { email: "manager@atomquest.demo", password: "demo123" },
  admin: { email: "admin@atomquest.demo", password: "demo123" },
};
