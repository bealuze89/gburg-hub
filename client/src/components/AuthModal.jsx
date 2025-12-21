import { useState } from "react";
import { apiForgotPassword, apiLogin, apiRegister, apiResetPassword, apiVerify, setToken } from "../api/api.js";

export default function AuthModal({ isOpen, onClose, onSuccess, notice }) {
  const [mode, setMode] = useState("login"); // login | register | verify | forgot | reset
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  if (!isOpen) return null;

  async function handleRegister(e) {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await apiRegister({ email, password });
      setMessage(res?.message || "Verification code sent.");
      setMode("verify");
    } catch (err) {
      setError(err.message || "Register failed.");
    } finally {
      setBusy(false);
    }
  }

  async function handleVerify(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await apiVerify({ email, code });
      setCode("");
      setMessage("Verified! Now log in.");
      setMode("login");
    } catch (err) {
      setError(err.message || "Verify failed.");
    } finally {
      setBusy(false);
    }
  }

  async function handleLogin(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await apiLogin({ email, password });
      if (res?.token) {
        setToken(res.token);
        onSuccess?.(res.token);
        onClose?.();
        return;
      }
      setError("No token returned.");
    } catch (err) {
      setError(err.message || "Login failed.");
    } finally {
      setBusy(false);
    }
  }

  async function handleForgot(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await apiForgotPassword({ email });
      setMessage(res?.message || "Reset code sent.");
      setMode("reset");
    } catch (err) {
      setError(err.message || "Request failed.");
    } finally {
      setBusy(false);
    }
  }

  async function handleReset(e) {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      setError("Passwords do not match.");
      return;
    }
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await apiResetPassword({ email, code, newPassword });
      setMessage(res?.message || "Password updated. Please log in.");
      setCode("");
      setNewPassword("");
      setConfirmNewPassword("");
      setMode("login");
    } catch (err) {
      setError(err.message || "Reset failed.");
    } finally {
      setBusy(false);
    }
  }

  function switchMode(nextMode) {
    setMode(nextMode);
    setError(null);
    setMessage(null);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(31, 79, 163, 0.12)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        zIndex: 50,
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          background: "var(--gb-surface)",
          border: "1px solid rgba(17,17,17,0.12)",
          borderRadius: 12,
          padding: 16,
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <h2 style={{ margin: 0, fontSize: 18 }}>Account</h2>
          <button type="button" onClick={onClose}>
            Close
          </button>
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
          <button type="button" onClick={() => switchMode("login")} disabled={busy}>
            Login
          </button>
          <button type="button" onClick={() => switchMode("register")} disabled={busy}>
            Register
          </button>
        </div>

        {typeof notice === "string" && notice.trim() ? <p style={{ marginTop: 12 }}>{notice}</p> : null}

        {error ? <p className="gbWarningText" style={{ marginTop: 12 }}>{error}</p> : null}
        {message ? <p style={{ marginTop: 12 }}>{message}</p> : null}

        {mode === "register" ? (
          <form onSubmit={handleRegister} style={{ marginTop: 12, display: "grid", gap: 10 }}>
            <label>
              Email
              <input value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: "100%" }} />
            </label>
            <label>
              Password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ width: "100%" }}
              />
            </label>
            <label>
              Confirm Password
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={{ width: "100%" }}
              />
            </label>
            <button type="submit" disabled={busy}>
              {busy ? "Working..." : "Register"}
            </button>
          </form>
        ) : null}

        {mode === "verify" ? (
          <form onSubmit={handleVerify} style={{ marginTop: 12, display: "grid", gap: 10 }}>
            <label>
              Email
              <input value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: "100%" }} />
            </label>
            <label>
              Code
              <input value={code} onChange={(e) => setCode(e.target.value)} style={{ width: "100%" }} />
            </label>
            <button type="submit" disabled={busy}>
              {busy ? "Working..." : "Verify"}
            </button>
            <button type="button" onClick={() => switchMode("login")} disabled={busy}>
              Back to Login
            </button>
          </form>
        ) : null}

        {mode === "login" ? (
          <form onSubmit={handleLogin} style={{ marginTop: 12, display: "grid", gap: 10 }}>
            <label>
              Email
              <input value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: "100%" }} />
            </label>
            <label>
              Password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ width: "100%" }}
              />
            </label>
            <button type="submit" disabled={busy}>
              {busy ? "Working..." : "Login"}
            </button>

            <button type="button" onClick={() => switchMode("forgot")} disabled={busy}>
              Forgot password?
            </button>
          </form>
        ) : null}

        {mode === "forgot" ? (
          <form onSubmit={handleForgot} style={{ marginTop: 12, display: "grid", gap: 10 }}>
            <label>
              Email
              <input value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: "100%" }} />
            </label>
            <button type="submit" disabled={busy}>
              {busy ? "Working..." : "Send reset code"}
            </button>
            <button type="button" onClick={() => switchMode("login")} disabled={busy}>
              Back to Login
            </button>
          </form>
        ) : null}

        {mode === "reset" ? (
          <form onSubmit={handleReset} style={{ marginTop: 12, display: "grid", gap: 10 }}>
            <label>
              Email
              <input value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: "100%" }} />
            </label>
            <label>
              Reset Code
              <input value={code} onChange={(e) => setCode(e.target.value)} style={{ width: "100%" }} />
            </label>
            <label>
              New Password
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                style={{ width: "100%" }}
              />
            </label>
            <label>
              Confirm New Password
              <input
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                style={{ width: "100%" }}
              />
            </label>
            <button type="submit" disabled={busy}>
              {busy ? "Working..." : "Reset password"}
            </button>
            <button type="button" onClick={() => switchMode("login")} disabled={busy}>
              Back to Login
            </button>
          </form>
        ) : null}
      </div>
    </div>
  );
}
