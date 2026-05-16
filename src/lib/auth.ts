import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";
import { Role } from "@/generated/prisma/client";
import { getFallbackUser } from "./ensure-seed";

const COOKIE = "goal_portal_session";
const secret = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "dev-secret-change-me"
);

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  department: string | null;
  managerId: string | null;
};

export async function login(email: string, password: string) {
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (user && await bcrypt.compare(password, user.passwordHash)) {
      return createSession(user);
    }
  } catch (error) {
    console.error("Database login failed, trying fallback:", error instanceof Error ? error.message : "");
  }

  // Fallback to in-memory demo users if database is unavailable
  const fallbackUser = getFallbackUser(email);
  if (fallbackUser && await bcrypt.compare(password, fallbackUser.passwordHash)) {
    return createSession({
      id: fallbackUser.id,
      email,
      name: fallbackUser.name,
      role: fallbackUser.role,
      passwordHash: fallbackUser.passwordHash,
    } as any);
  }

  return null;
}

export async function createSession(user: {
  id: string;
  email: string;
  name: string;
  role: Role;
  department: string | null;
  managerId: string | null;
}) {
  const token = await new SignJWT({
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    department: user.department,
    managerId: user.managerId,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(secret);

  const cookieStore = await cookies();
  cookieStore.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return user;
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secret);
    return {
      id: payload.sub as string,
      email: payload.email as string,
      name: payload.name as string,
      role: payload.role as Role,
      department: (payload.department as string) ?? null,
      managerId: (payload.managerId as string) ?? null,
    };
  } catch {
    return null;
  }
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE);
}

export async function requireSession(roles?: Role[]) {
  const session = await getSession();
  if (!session) return { error: "Unauthorized", status: 401 as const, session: null };
  if (roles && !roles.includes(session.role)) {
    return { error: "Forbidden", status: 403 as const, session: null };
  }
  return { session, error: null, status: 200 as const };
}

export async function logAudit(
  userId: string,
  entityType: string,
  entityId: string,
  field: string,
  oldValue: string | null,
  newValue: string | null
) {
  await prisma.auditLog.create({
    data: { userId, entityType, entityId, field, oldValue, newValue },
  });
}
