"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { createClient } from "@/lib/supabase/client";

export default function AuthPage({ mode = "login" }) {
  const router = useRouter();

  const isLogin = mode === "login";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();

    setError("");
    setMessage("");
    setLoading(true);

    try {
      const supabase = createClient();

      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          throw error;
        }

        router.push("/");
        router.refresh();
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name,
            },
          },
        });

        if (error) {
          throw error;
        }

        if (data.session) {
          router.push("/");
          router.refresh();
        } else {
          setMessage(
            "Account created successfully. Please check your email to verify your account."
          );
        }
      }
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-shell">
      <div className="auth-layout">
        <div className="auth-intro">
          <Link className="brand-mark" href="/"><span className="brand-dot" /> densepose<span className="brand-light">/lab</span></Link>
          <p className="eyebrow"><span className="eyebrow-line" /> Human body / surface lab</p>
          <h1>
            {isLogin ? "Welcome Back" : "Create Account"}
          </h1>
          <p className="auth-subtitle">
            {isLogin
              ? "Return to your visual research workspace."
              : "Open a new visual research workspace."}
          </p>
        </div>

        <div className="auth-panel">
          <form
            onSubmit={handleSubmit}
            className="auth-form"
          >
          {!isLogin && (
            <div className="auth-field">
              <label>
                Full Name
              </label>

              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="auth-input"
                placeholder="Your name"
              />
            </div>
          )}

          <div className="auth-field">
            <label>
              Email
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="auth-input"
              placeholder="you@example.com"
            />
          </div>

          <div className="auth-field">
            <label>
              Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="auth-input"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="auth-message auth-error">
              {error}
            </div>
          )}

          {message && (
            <div className="auth-message auth-success">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="auth-submit"
          >
            {loading
              ? "Please wait..."
              : isLogin
                ? "Sign In"
                : "Create Account"}
          </button>
          </form>

          <p className="auth-switch">
          {isLogin ? (
            <>
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="auth-link"
              >
                Create one
              </Link>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <Link
                href="/login"
                className="auth-link"
              >
                Sign in
              </Link>
            </>
          )}
          </p>
        </div>
      </div>
    </main>
  );
}