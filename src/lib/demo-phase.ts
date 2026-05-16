import { CyclePhase } from "@/generated/prisma/client";
import { cookies } from "next/headers";

const COOKIE = "demo_cycle_phase";

export async function getDemoCyclePhase(): Promise<CyclePhase | undefined> {
  const store = await cookies();
  const v = store.get(COOKIE)?.value;
  if (!v) return undefined;
  if (Object.values(CyclePhase).includes(v as CyclePhase)) {
    return v as CyclePhase;
  }
  return undefined;
}
