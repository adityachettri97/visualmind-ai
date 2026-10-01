import jwt from "jsonwebtoken";
import { User } from "../models/User.js";

const COOKIE_NAME = "token";
const TOKEN_TTL = "30d";

export function signToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: TOKEN_TTL });
}

// In local dev, frontend (5173) and backend (5000) share the "localhost" site, so a same-site
// cookie ("lax") works fine over plain http. Deployed, the frontend (Netlify) and backend
// (Render) are on genuinely different domains — that's cross-site, which requires "none" +
// secure: true, or the browser drops the cookie entirely.
const isProduction = process.env.NODE_ENV === "production";
const cookieOptions = {
  httpOnly: true,
  sameSite: isProduction ? "none" : "lax",
  secure: isProduction,
};

export function setAuthCookie(res, token) {
  res.cookie(COOKIE_NAME, token, {
    ...cookieOptions,
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
}

export function clearAuthCookie(res) {
  res.clearCookie(COOKIE_NAME, cookieOptions);
}

export async function requireAuth(req, res, next) {
  const token = req.cookies?.[COOKIE_NAME];

  if (!token) {
    return res.status(401).json({ error: "Not signed in." });
  }

  let payload;

  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ error: "Your session has expired. Please sign in again." });
  }

  try {
    const userExists = await User.exists({ _id: payload.userId });

    if (!userExists) return res.status(401).json({ error: "This account no longer exists." });

    req.userId = payload.userId;
    next();
  } catch (error) {
    next(error);
  }
}
