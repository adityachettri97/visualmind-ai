// Mirrors server/utils/password.js — at least one lowercase, one uppercase, one digit, one
// special character, no whitespace, 8+ chars.
const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s])(?!.*\s).{8,}$/;

export const PASSWORD_REQUIREMENTS_MESSAGE =
  "At least 8 characters, no spaces, with an uppercase letter, a lowercase letter, a number, and a special character.";

export function isValidPassword(password: string): boolean {
  return PASSWORD_PATTERN.test(password);
}
