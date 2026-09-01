import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  name: {
    type: String,
    trim: true,
    default: "",
  },
  passwordHash: {
    type: String,
    required: true,
  },
  // Self-reported at signup.
  region: {
    type: String,
    trim: true,
    default: "",
  },
  // Populated on every successful login, resolved from the request IP — see routes/auth.js.
  lastLoginIp: {
    type: String,
    default: null,
  },
  lastLoginCountry: {
    type: String,
    default: null,
  },
  lastLoginAt: {
    type: Date,
    default: null,
  },
  // Forgot-password flow. The token itself is never stored — only its hash, same principle as
  // the password — so a database read alone can't be used to reset someone's account.
  resetTokenHash: {
    type: String,
    default: null,
  },
  resetTokenExpires: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const User = mongoose.model("User", userSchema);
