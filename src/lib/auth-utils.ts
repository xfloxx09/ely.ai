import { UserRole } from "@prisma/client";

export function isAdminRole(role: UserRole | string | undefined): boolean {
  return role === "ADMIN";
}

export function hasAffiliateAccess(role: UserRole | string | undefined): boolean {
  return role === "AFFILIATE" || role === "ADMIN";
}

export function effectivePlanForUser(
  plan: string,
  role: UserRole | string | undefined
): "FREE" | "PLUS" | "PRO" {
  if (isAdminRole(role)) return "PRO";
  return plan as "FREE" | "PLUS" | "PRO";
}
