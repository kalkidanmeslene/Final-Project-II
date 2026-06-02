import bcrypt from "bcryptjs";

const MIN_LEN = 10;
const MAX_LEN = 72; // bcrypt truncation boundary

export function validateStrongPassword(password: string): { ok: true } | { ok: false; message: string } {
  if (password.length < MIN_LEN) return { ok: false, message: `Password must be at least ${MIN_LEN} characters.` };
  if (password.length > MAX_LEN) return { ok: false, message: `Password must be at most ${MAX_LEN} characters.` };

  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);

  if (!(hasLower && hasUpper && hasNumber && hasSymbol)) {
    return {
      ok: false,
      message: "Password must include upper, lower, number, and symbol characters.",
    };
  }

  return { ok: true };
}

export async function hashPassword(password: string): Promise<string> {
  // bcryptjs is pure JS; cost 12 is a reasonable baseline
  const cost = 12;
  return bcrypt.hash(password, cost);
}

export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}

