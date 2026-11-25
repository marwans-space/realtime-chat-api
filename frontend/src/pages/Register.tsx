import { useState } from "react";
import type { FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router";
import Icon from "../components/Icon";
import ThemeToggle from "../components/ThemeToggle";
import { registerSchema } from "../schemas/auth";
import { apiRequest } from "../services/api";

type FieldErrors = Partial<Record<"username" | "email" | "password", string>>;

export default function Register() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
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
    const result = registerSchema.safeParse({
      username: username.trim(),
      email: email.trim(),
      password,
    });
    if (!result.success) {
      setErrors({
        username: result.error.issues.find((issue) => issue.path[0] === "username")
          ?.message,
        email: result.error.issues.find((issue) => issue.path[0] === "email")
          ?.message,
        password: result.error.issues.find((issue) => issue.path[0] === "password")
          ?.message,
      });
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    try {
      const response = await apiRequest<{ access_token: string }>("/auth/register", {
        method: "POST",
        body: JSON.stringify(result.data),
      });
      sessionStorage.setItem("access_token", response.access_token);
      navigate("/chat", { replace: true });
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "We couldn't create your account. Please try again.",
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
        <section className="auth-intro register-intro">
          <div className="intro-orbit orbit-one" />
          <div className="intro-orbit orbit-two" />
          <div className="intro-copy">
            <span className="eyebrow"><span className="eyebrow-dot" /> MAKE ROOM FOR MORE</span>
            <h1>Your next favorite conversation starts here.</h1>
            <p>Bring your favorite people together, wherever the day takes you.</p>
            <div className="intro-note">
              <span className="note-sparkle" aria-hidden="true">✦</span>
              <span><strong>Made for your kind of people</strong><small>Simple, thoughtful chat that feels like you.</small></span>
            </div>
          </div>
          <span className="intro-decoration" aria-hidden="true">✳</span>
        </section>

        <section className="auth-form-wrap">
          <div className="auth-form-card">
            <div className="form-heading">
              <span className="form-kicker">A FRESH START</span>
              <h2>Create your account</h2>
              <p>It only takes a moment. Your people are waiting.</p>
            </div>
            <form className="auth-form" onSubmit={handleSubmit} noValidate>
              <label className="field-label" htmlFor="username">Your name</label>
              <div className={`input-wrap${errors.username ? " has-error" : ""}`}>
                <Icon name="user" />
                <input
                  autoComplete="username"
                  id="username"
                  name="username"
                  placeholder="What should we call you?"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  aria-invalid={Boolean(errors.username)}
                  aria-describedby={errors.username ? "username-error" : undefined}
                />
              </div>
              {errors.username && <span className="field-error" id="username-error">{errors.username}</span>}

              <label className="field-label" htmlFor="email">Email address</label>
              <div className={`input-wrap${errors.email ? " has-error" : ""}`}>
                <Icon name="mail" />
                <input
                  autoComplete="email"
                  id="email"
                  name="email"
                  placeholder="you@example.com"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? "email-error" : undefined}
                />
              </div>
              {errors.email && <span className="field-error" id="email-error">{errors.email}</span>}

              <label className="field-label" htmlFor="password">Password</label>
              <div className={`input-wrap${errors.password ? " has-error" : ""}`}>
                <Icon name="lock" />
                <input
                  autoComplete="new-password"
                  id="password"
                  name="password"
                  placeholder="At least 8 characters"
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
                {isSubmitting ? "Creating your account..." : "Create account"}
                {!isSubmitting && <span aria-hidden="true">→</span>}
              </button>
            </form>
            <p className="auth-switch">Already part of Loop? <Link to="/login">Sign in <span aria-hidden="true">↗</span></Link></p>
          </div>
          <p className="auth-footnote">A little more connection, one conversation at a time.</p>
        </section>
      </div>
    </main>
  );
}
