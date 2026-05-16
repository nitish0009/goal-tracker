import { getPrisma } from "./db";

/** Lazy singleton — safe for Next.js build without DATABASE_URL until first query. */
export const prisma = new Proxy({} as ReturnType<typeof getPrisma>, {
  get(_target, prop) {
    const client = getPrisma();
    const value = client[prop as keyof typeof client];
    if (typeof value === "function") {
      return (value as (...args: unknown[]) => unknown).bind(client);
    }
    return value;
  },
});
