import express from "express";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import { signToken, setAuthCookie, clearAuthCookie, requireAuth } from "../middleware/auth.js";
import { isValidPassword, PASSWORD_REQUIREMENTS_MESSAGE } from "../utils/password.js";
import { resolveCountry, clientIp } from "../utils/geo.js";

const router = express.Router();

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RESET_TOKEN_TTL_MS = 30 * 60 * 1000; // 30 minutes

function toPublicUser(user) {
  return { id: user._id.toString(), email: user.email, name: user.name, region: user.region };
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/** Fire-and-forget — records where a login/signup came from without slowing down the response. */
function recordLoginLocation(user, req) {
  const ip = clientIp(req);

  resolveCountry(ip)
    .then((country) => {
      user.lastLoginIp = ip;
      user.lastLoginCountry = country;
      user.lastLoginAt = new Date();
      return user.save();
    })
    .catch((error) => {
      console.error("===== LOGIN LOCATION TRACKING ERROR =====");
      console.error(error);
    });
}

router.post("/signup", async (req, res) => {
  try {
    const { email, password, name, region } = req.body;

    if (!email || typeof email !== "string" || !EMAIL_PATTERN.test(email.trim())) {
      return res.status(400).json({ error: "A valid email is required." });
    }

    if (!isValidPassword(password)) {
      return res.status(400).json({ error: PASSWORD_REQUIREMENTS_MESSAGE });
    }

    if (!region || typeof region !== "string" || !region.trim()) {
      return res.status(400).json({ error: "Please select your country/region." });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await User.findOne({ email: normalizedEmail });

    if (existing) {
      return res.status(409).json({ error: "An account with that email already exists." });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      email: normalizedEmail,
      passwordHash,
      name: typeof name === "string" ? name.trim().slice(0, 80) : "",
      region: region.trim(),
    });

    recordLoginLocation(user, req);
    setAuthCookie(res, signToken(user._id.toString()));
    res.status(201).json({ user: toPublicUser(user) });
  } catch (error) {
    console.error("===== SIGNUP ERROR =====");
    console.error(error);

    res.status(500).json({ error: "Failed to create your account. Please try again." });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const user = await User.findOne({ email: String(email).trim().toLowerCase() });
    const passwordMatches = user ? await bcrypt.compare(password, user.passwordHash) : false;

    if (!user || !passwordMatches) {
      return res.status(401).json({ error: "Incorrect email or password." });
    }

    recordLoginLocation(user, req);
    setAuthCookie(res, signToken(user._id.toString()));
    res.json({ user: toPublicUser(user) });
  } catch (error) {
    console.error("===== LOGIN ERROR =====");
    console.error(error);

    res.status(500).json({ error: "Failed to sign in. Please try again." });
  }
});

router.post("/logout", (req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
});

router.get("/me", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(401).json({ error: "Not signed in." });
    }

    res.json({
      user: {
        ...toPublicUser(user),
        lastLoginCountry: user.lastLoginCountry,
        lastLoginAt: user.lastLoginAt,
      },
    });
  } catch (error) {
    console.error("===== ME ERROR =====");
    console.error(error);

    res.status(500).json({ error: "Failed to load your account." });
  }
});

router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || typeof email !== "string") {
      return res.status(400).json({ error: "Email is required." });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });

    // Same response shape whether or not the account exists, to avoid confirming which emails
    // are registered — except the dev-mode token itself, which only exists to make this flow
    // testable without a real email provider wired up yet. In production, remove `resetToken`
    // from this response entirely and send it by email instead.
    if (!user) {
      return res.json({ ok: true, message: "If that email has an account, a reset link has been generated." });
    }

    const token = crypto.randomBytes(32).toString("hex");

    user.resetTokenHash = hashToken(token);
    user.resetTokenExpires = new Date(Date.now() + RESET_TOKEN_TTL_MS);
    await user.save();

    console.log(`===== PASSWORD RESET TOKEN (dev-mode, would be emailed in production) =====\n${email}: ${token}`);

    res.json({
      ok: true,
      message: "If that email has an account, a reset link has been generated.",
      resetToken: token,
    });
  } catch (error) {
    console.error("===== FORGOT PASSWORD ERROR =====");
    console.error(error);

    res.status(500).json({ error: "Failed to process that request. Please try again." });
  }
});

router.post("/reset-password", async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || typeof token !== "string") {
      return res.status(400).json({ error: "Reset token is required." });
    }

    if (!isValidPassword(password)) {
      return res.status(400).json({ error: PASSWORD_REQUIREMENTS_MESSAGE });
    }

    const user = await User.findOne({ resetTokenHash: hashToken(token), resetTokenExpires: { $gt: new Date() } });

    if (!user) {
      return res.status(400).json({ error: "That reset link is invalid or has expired. Please request a new one." });
    }

    user.passwordHash = await bcrypt.hash(password, 10);
    user.resetTokenHash = null;
    user.resetTokenExpires = null;
    await user.save();

    setAuthCookie(res, signToken(user._id.toString()));
    res.json({ user: toPublicUser(user) });
  } catch (error) {
    console.error("===== RESET PASSWORD ERROR =====");
    console.error(error);

    res.status(500).json({ error: "Failed to reset your password. Please try again." });
  }
});

export default router;
