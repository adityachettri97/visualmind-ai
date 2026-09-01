// At least one lowercase, one uppercase, one digit, one special character, no whitespace, 8+ chars.
const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s])(?!.*\s).{8,}$/;

export const PASSWORD_REQUIREMENTS_MESSAGE =
  "Password must be at least 8 characters, with no spaces, and include an uppercase letter, a lowercase letter, a number, and a special character.";

export function isValidPassword(password) {
  return typeof password === "string" && PASSWORD_PATTERN.test(password);
}
