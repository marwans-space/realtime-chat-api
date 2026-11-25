import { useState } from "react";
import type { FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router";
import Icon from "../components/Icon";
import ThemeToggle from "../components/ThemeToggle";
import { apiRequest } from "../services/api";
import { loginSchema } from "../schemas/auth";

type FieldErrors = Partial<Record<"identifier" | "password", string>>;

export default function Login() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (sessionStorage.getItem("access_token")) {
    return <Navigate to="/chat" replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    const result = loginSchema.safeParse({ identifier: identifier.trim(), password });
    if (!result.success) {
      setErrors({
        identifier: result.error.issues.find((issue) => issue.path[0] === "identifier")
          ?.message,
        password: result.error.issues.find((issue) => issue.path[0] === "password")
          ?.message,
      });
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    try {
      const response = await apiRequest<{ access_token: string }>("/auth/login", {
        method: "POST",
        body: JSON.stringify(result.data),
      });
      sessionStorage.setItem("access_token", response.access_token);
      navigate("/chat", { replace: true });
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "We couldn't sign you in. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-page min-h-screen">
      <div className="auth-topbar">
        <Link className="brand-lockup" to="/" aria-label="Loop home">
          <span className="brand-mark"><Icon name="message" /></span>
          <span>loop<span className="brand-period">.</span></span>
        </Link>
        <ThemeToggle />
      </div>
      <div className="auth-layout">
        <section className="auth-intro">
          <div className="intro-orbit orbit-one" />
          <div className="intro-orbit orbit-two" />
          <div className="intro-copy">
            <span className="eyebrow"><span className="eyebrow-dot" /> YOUR PEOPLE, CLOSER</span>
            <h1>Good conversations make every day better.</h1>
            <p>A little space for the people who make life feel a little more like you.</p>
            <div className="intro-note">
              <span className="note-avatars" aria-hidden="true">
                <i>J</i><i>M</i><i>A</i>
              </span>
              <span><strong>Good to see you again</strong><small>Your conversations are right where you left them.</small></span>
            </div>
          </div>
          <span className="intro-decoration" aria-hidden="true">✳</span>
        </section>

        <section className="auth-form-wrap">
          <div className="auth-form-card">
            <div className="form-heading">
              <span className="form-kicker">WELCOME BACK</span>
              <h2>Sign in to Loop</h2>
              <p>Pick up right where your conversations left off.</p>
            </div>
            <form className="auth-form" onSubmit={handleSubmit} noValidate>
              <label className="field-label" htmlFor="identifier">Email or username</label>
              <div className={`input-wrap${errors.identifier ? " has-error" : ""}`}>
                <Icon name="user" />
                <input
                  autoComplete="username"
                  id="identifier"
                  name="identifier"
                  placeholder="Your email or username"
                  value={identifier}
                  onChange={(event) => setIdentifier(event.target.value)}
                  aria-invalid={Boolean(errors.identifier)}
                  aria-describedby={errors.identifier ? "identifier-error" : undefined}
                />
              </div>
              {errors.identifier && <span className="field-error" id="identifier-error">{errors.identifier}</span>}

              <div className="label-row">
                <label className="field-label" htmlFor="password">Password</label>
              </div>
              <div className={`input-wrap${errors.password ? " has-error" : ""}`}>
                <Icon name="lock" />
                <input
                  autoComplete="current-password"
                  id="password"
                  name="password"
                  placeholder="Enter your password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={errors.password ? "password-error" : undefined}
                />
                <button
                  className="input-action"
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <Icon name={showPassword ? "eye-off" : "eye"} />
                </button>
              </div>
              {errors.password && <span className="field-error" id="password-error">{errors.password}</span>}

              {formError && <p className="form-error" role="alert">{formError}</p>}
              <button className="primary-button auth-submit" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Signing you in..." : "Sign in"}
                {!isSubmitting && <span aria-hidden="true">→</span>}
              </button>
            </form>
            <p className="auth-switch">New to Loop? <Link to="/register">Create an account <span aria-hidden="true">↗</span></Link></p>
          </div>
          <p className="auth-footnote">A little more connection, one conversation at a time.</p>
        </section>
      </div>
    </main>
  );
}
