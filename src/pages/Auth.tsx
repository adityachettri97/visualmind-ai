import { useRef, useState } from "react";
import { Brain, Check, Eye, EyeOff, Loader2, X } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { COUNTRIES } from "../constants/countries";
import { isValidPassword, PASSWORD_REQUIREMENTS_MESSAGE } from "../utils/passwordRules";
import { useArrowKeyNav } from "../hooks/useArrowKeyNav";

type Mode = "login" | "signup" | "forgot" | "reset";

function PasswordHint({ password }: { password: string }) {
  const valid = password.length === 0 || isValidPassword(password);

  return (
    <p className={`mt-1.5 flex items-start gap-1 text-xs ${valid ? "text-slate-500" : "text-amber-400"}`}>
      {password.length > 0 && (valid ? <Check size={13} className="mt-0.5 shrink-0" /> : <X size={13} className="mt-0.5 shrink-0" />)}
      {PASSWORD_REQUIREMENTS_MESSAGE}
    </p>
  );
}

interface PasswordInputProps {
  id: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  autoComplete: string;
}

function PasswordInput({ id, value, onChange, autoComplete }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative mt-2">
      <input
        id={id}
        type={visible ? "text" : "password"}
        required
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        className="w-full rounded-lg border border-slate-700 bg-slate-900/40 px-3 py-2 pr-10 text-sm outline-none focus:border-violet-500"
      />

      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        tabIndex={-1}
        aria-label={visible ? "Hide password" : "Show password"}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-300"
      >
        {visible ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}

function Auth() {
  const { login, signup, forgotPassword, resetPassword, error, clearError } = useAuthStore();
  const [mode, setMode] = useState<Mode>("login");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [region, setRegion] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotMessage, setForgotMessage] = useState<string | null>(null);
  const [devResetToken, setDevResetToken] = useState<string | null>(null);

  const [resetToken, setResetToken] = useState("");
  const [resetPasswordValue, setResetPasswordValue] = useState("");
  const [resetConfirmPassword, setResetConfirmPassword] = useState("");

  function switchMode(nextMode: Mode) {
    setMode(nextMode);
    clearError();
  }

  async function handleLoginOrSignup(event: React.FormEvent) {
    event.preventDefault();

    if (isSubmitting) return;
    if (mode === "signup" && (password !== confirmPassword || !isValidPassword(password))) return;

    setIsSubmitting(true);

    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await signup(email, password, region, name);
      }
    } catch {
      // Error is already captured in the auth store.
    } finally {
      setIsSubmitting(false);
    }
  }

  const passwordsMismatch = mode === "signup" && confirmPassword.length > 0 && password !== confirmPassword;

  async function handleForgotSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (isSubmitting) return;

    setIsSubmitting(true);
    setForgotMessage(null);
    setDevResetToken(null);

    try {
      const result = await forgotPassword(forgotEmail);

      setForgotMessage("If that email has an account, a reset link has been generated.");

      if (result.resetToken) {
        setDevResetToken(result.resetToken);
      }
    } catch {
      // Error is already captured in the auth store.
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResetSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (isSubmitting || resetPasswordValue !== resetConfirmPassword) return;

    setIsSubmitting(true);

    try {
      await resetPassword(resetToken.trim(), resetPasswordValue);
    } catch {
      // Error is already captured in the auth store.
    } finally {
      setIsSubmitting(false);
    }
  }

  const resetPasswordsMismatch = resetConfirmPassword.length > 0 && resetPasswordValue !== resetConfirmPassword;

  const modeToggleRef = useRef<HTMLDivElement>(null);

  useArrowKeyNav(modeToggleRef, { orientation: "horizontal" });

  return (
    <div className="flex h-screen items-center justify-center overflow-y-auto bg-[#050816] px-4 py-10 text-white">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <Brain className="text-violet-500" size={36} />
          <h1 className="text-xl font-bold">VisualMind AI</h1>
          <p className="text-sm text-slate-400">Intelligent Analytics</p>
        </div>

        <div className="glass rounded-2xl p-6">
          {(mode === "login" || mode === "signup") && (
            <>
              <div ref={modeToggleRef} className="mb-6 flex w-full gap-1 rounded-xl border border-slate-700 bg-slate-900/40 p-1">
                <button
                  type="button"
                  onClick={() => switchMode("login")}
                  className={`flex-1 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                    mode === "login" ? "bg-violet-600 text-white" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Log In
                </button>

                <button
                  type="button"
                  onClick={() => switchMode("signup")}
                  className={`flex-1 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                    mode === "signup" ? "bg-violet-600 text-white" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Sign Up
                </button>
              </div>

              <form onSubmit={handleLoginOrSignup} className="flex flex-col gap-4">
                {mode === "signup" && (
                  <div>
                    <label htmlFor="auth-name" className="text-sm font-medium text-slate-300">
                      Name (optional)
                    </label>

                    <input
                      id="auth-name"
                      type="text"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      autoComplete="name"
                      className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900/40 px-3 py-2 text-sm outline-none focus:border-violet-500"
                    />
                  </div>
                )}

                <div>
                  <label htmlFor="auth-email" className="text-sm font-medium text-slate-300">
                    Email
                  </label>

                  <input
                    id="auth-email"
                    type="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    autoComplete="email"
                    className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900/40 px-3 py-2 text-sm outline-none focus:border-violet-500"
                  />
                </div>

                {mode === "signup" && (
                  <div>
                    <label htmlFor="auth-region" className="text-sm font-medium text-slate-300">
                      Country / Region
                    </label>

                    <select
                      id="auth-region"
                      required
                      value={region}
                      onChange={(event) => setRegion(event.target.value)}
                      className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900/40 px-3 py-2 text-sm outline-none focus:border-violet-500"
                    >
                      <option value="" disabled>
                        Select your country
                      </option>

                      {COUNTRIES.map((country) => (
                        <option key={country} value={country}>
                          {country}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between">
                    <label htmlFor="auth-password" className="text-sm font-medium text-slate-300">
                      Password
                    </label>

                    {mode === "login" && (
                      <button
                        type="button"
                        onClick={() => switchMode("forgot")}
                        className="text-xs text-violet-300 hover:text-violet-200"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>

                  <PasswordInput
                    id="auth-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                  />

                  {mode === "signup" && <PasswordHint password={password} />}
                </div>

                {mode === "signup" && (
                  <div>
                    <label htmlFor="auth-confirm-password" className="text-sm font-medium text-slate-300">
                      Confirm Password
                    </label>

                    <PasswordInput
                      id="auth-confirm-password"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      autoComplete="new-password"
                    />

                    {passwordsMismatch && <p className="mt-1.5 text-xs text-red-400">Passwords don't match.</p>}
                  </div>
                )}

                {error && <p className="text-sm text-red-400">{error}</p>}

                <button
                  type="submit"
                  disabled={isSubmitting || (mode === "signup" && (passwordsMismatch || !isValidPassword(password)))}
                  className="mt-2 flex items-center justify-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-medium transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting && <Loader2 size={15} className="animate-spin" />}
                  {mode === "login" ? "Log In" : "Create Account"}
                </button>
              </form>
            </>
          )}

          {mode === "forgot" && (
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="text-lg font-semibold">Reset your password</h2>
                <p className="mt-1 text-sm text-slate-400">Enter your email and we'll generate a reset link.</p>
              </div>

              <form onSubmit={handleForgotSubmit} className="flex flex-col gap-4">
                <div>
                  <label htmlFor="forgot-email" className="text-sm font-medium text-slate-300">
                    Email
                  </label>

                  <input
                    id="forgot-email"
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(event) => setForgotEmail(event.target.value)}
                    autoComplete="email"
                    className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900/40 px-3 py-2 text-sm outline-none focus:border-violet-500"
                  />
                </div>

                {error && <p className="text-sm text-red-400">{error}</p>}
                {forgotMessage && <p className="text-sm text-emerald-400">{forgotMessage}</p>}

                {devResetToken && (
                  <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-300">
                    <p className="font-medium">Dev mode — no email service is configured yet.</p>
                    <p className="mt-1 break-all font-mono text-amber-200">{devResetToken}</p>

                    <button
                      type="button"
                      onClick={() => {
                        setResetToken(devResetToken);
                        switchMode("reset");
                      }}
                      className="mt-2 rounded-lg bg-violet-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-violet-700"
                    >
                      Continue to Reset Password
                    </button>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center justify-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-medium transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting && <Loader2 size={15} className="animate-spin" />}
                  Send Reset Link
                </button>

                <button type="button" onClick={() => switchMode("login")} className="text-sm text-slate-400 hover:text-white">
                  Back to Log In
                </button>
              </form>
            </div>
          )}

          {mode === "reset" && (
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="text-lg font-semibold">Set a new password</h2>
                <p className="mt-1 text-sm text-slate-400">Paste your reset token if it isn't already filled in.</p>
              </div>

              <form onSubmit={handleResetSubmit} className="flex flex-col gap-4">
                <div>
                  <label htmlFor="reset-token" className="text-sm font-medium text-slate-300">
                    Reset token
                  </label>

                  <input
                    id="reset-token"
                    type="text"
                    required
                    value={resetToken}
                    onChange={(event) => setResetToken(event.target.value)}
                    className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900/40 px-3 py-2 font-mono text-xs outline-none focus:border-violet-500"
                  />
                </div>

                <div>
                  <label htmlFor="reset-password" className="text-sm font-medium text-slate-300">
                    New password
                  </label>

                  <PasswordInput
                    id="reset-password"
                    value={resetPasswordValue}
                    onChange={(event) => setResetPasswordValue(event.target.value)}
                    autoComplete="new-password"
                  />

                  <PasswordHint password={resetPasswordValue} />
                </div>

                <div>
                  <label htmlFor="reset-confirm-password" className="text-sm font-medium text-slate-300">
                    Confirm new password
                  </label>

                  <PasswordInput
                    id="reset-confirm-password"
                    value={resetConfirmPassword}
                    onChange={(event) => setResetConfirmPassword(event.target.value)}
                    autoComplete="new-password"
                  />

                  {resetPasswordsMismatch && <p className="mt-1.5 text-xs text-red-400">Passwords don't match.</p>}
                </div>

                {error && <p className="text-sm text-red-400">{error}</p>}

                <button
                  type="submit"
                  disabled={isSubmitting || resetPasswordsMismatch || !isValidPassword(resetPasswordValue)}
                  className="flex items-center justify-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-medium transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting && <Loader2 size={15} className="animate-spin" />}
                  Reset Password
                </button>

                <button type="button" onClick={() => switchMode("login")} className="text-sm text-slate-400 hover:text-white">
                  Back to Log In
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Auth;
