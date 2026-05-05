import { useState } from "react";
import { useAuth } from "./auth/useAuth.js";

function getAuthErrorMessage(error) {
  if (!error?.code) {
    return error instanceof Error ? error.message : "Authentication failed.";
  }

  if (error.code === "auth/email-already-in-use") {
    return "That email already has an account.";
  }

  if (error.code === "auth/invalid-credential") {
    return "Email or password was incorrect.";
  }

  if (error.code === "auth/weak-password") {
    return "Use a stronger password.";
  }

  return error.message;
}

export default function AuthPanel() {
  const { authLoading, isFirebaseConfigured, login, logout, signUp, user } = useAuth();
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");

    try {
      if (mode === "signup") {
        await signUp({ email, password, displayName });
      } else {
        await login({ email, password });
      }

      setPassword("");
    } catch (authError) {
      setError(getAuthErrorMessage(authError));
    } finally {
      setBusy(false);
    }
  }

  if (authLoading) {
    return <div className="authPanel">Checking account...</div>;
  }

  if (user) {
    return (
      <div className="authPanel signedInPanel">
        <div>
          <span>Signed in</span>
          <strong>{user.displayName || user.email}</strong>
        </div>
        <button type="button" onClick={logout}>
          Log Out
        </button>
      </div>
    );
  }

  return (
    <form className="authPanel authForm" onSubmit={handleSubmit}>
      <div className="authMode">
        <button
          type="button"
          className={mode === "login" ? "active" : ""}
          onClick={() => setMode("login")}
        >
          Login
        </button>
        <button
          type="button"
          className={mode === "signup" ? "active" : ""}
          onClick={() => setMode("signup")}
        >
          Sign Up
        </button>
      </div>

      {mode === "signup" && (
        <input
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          placeholder="Display name"
        />
      )}

      <input
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        placeholder="Password"
        required
      />

      <button type="submit" disabled={busy || !isFirebaseConfigured}>
        {busy ? "Working..." : mode === "signup" ? "Create Account" : "Login"}
      </button>

      {!isFirebaseConfigured && <p>Firebase env vars needed.</p>}
      {error && <p className="authError">{error}</p>}
    </form>
  );
}
