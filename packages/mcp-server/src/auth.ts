import { timingSafeEqual } from "node:crypto";

export function isAuthorized(
  header: string | null,
  expectedToken?: string,
): boolean {
  if (!expectedToken) return true;
  if (!header?.startsWith("Bearer ")) return false;
  const supplied = Buffer.from(header.slice(7));
  const expected = Buffer.from(expectedToken);
  return (
    supplied.length === expected.length && timingSafeEqual(supplied, expected)
  );
}

export function isAllowedOrigin(
  origin: string | null,
  allowedOrigins: readonly string[],
): boolean {
  if (!origin) return true;
  return allowedOrigins.includes(origin);
}
