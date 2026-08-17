"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");

    // ==========================================================
    // VALIDATION
    // ==========================================================

    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }

    if (!password.trim()) {
      setError("Please enter your password.");
      return;
    }

    try {
      setLoading(true);

      // ========================================================
      // LOGIN API
      // ========================================================

      const response = await fetch(
        "http://127.0.0.1:8000/api/auth/login",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            email: email.trim(),
            password: password,
          }),
        }
      );

      const data = await response.json();

      console.log("Login response:", data);

      // ========================================================
      // BACKEND ERROR
      // ========================================================

      if (!response.ok) {
        setError(
          data?.detail ||
            data?.message ||
            "Unable to login."
        );

        return;
      }

      // ========================================================
      // APPLICATION LOGIN FAILURE
      // ========================================================

      if (!data.success) {
        setError(
          data?.message ||
            "Invalid email or password."
        );

        return;
      }

      // ========================================================
      // MFA REQUIRED
      // ========================================================

      if (data.mfa_required === true) {
        console.log(
          "MFA required. Redirecting to verification page."
        );

        // Store only the email temporarily.
        // DO NOT store JWT because MFA is not verified yet.
        sessionStorage.setItem(
          "mfa_email",
          data.email || email.trim()
        );

        router.push("/mfa");

        return;
      }

      // ========================================================
      // MFA NOT REQUIRED
      // ========================================================

      if (!data.access_token) {
        console.error(
          "Login succeeded but access_token is missing:",
          data
        );

        setError(
          "Login succeeded but authentication token was not returned."
        );

        return;
      }

      // ========================================================
      // STORE JWT
      // ========================================================

      localStorage.setItem(
        "token",
        data.access_token
      );

      // ========================================================
      // STORE TOKEN TYPE
      // ========================================================

      localStorage.setItem(
        "token_type",
        data.token_type || "bearer"
      );

      // ========================================================
      // STORE USER
      // ========================================================

      if (data.user) {
        localStorage.setItem(
          "user",
          JSON.stringify(data.user)
        );
      }

      console.log(
        "JWT stored successfully."
      );

      // ========================================================
      // GO TO DASHBOARD
      // ========================================================

      router.push("/dashboard");

    } catch (loginError) {
      console.error(
        "Login error:",
        loginError
      );

      setError(
        "Unable to connect to StoryPilot AI backend."
      );

    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-10 text-white">

      {/* =====================================================
          BACKGROUND
      ===================================================== */}

      <div className="pointer-events-none fixed inset-0 overflow-hidden">

        <div
          className="
            absolute
            -left-32
            -top-32
            h-96
            w-96
            rounded-full
            bg-purple-600/20
            blur-3xl
          "
        />

        <div
          className="
            absolute
            -bottom-32
            -right-32
            h-96
            w-96
            rounded-full
            bg-blue-600/20
            blur-3xl
          "
        />

      </div>

      {/* =====================================================
          LOGIN CONTAINER
      ===================================================== */}

      <div className="relative w-full max-w-xl">

        <div
          className="
            rounded-3xl
            border
            border-slate-700
            bg-slate-900
            p-8
            shadow-2xl
            md:p-12
          "
        >

          {/* =================================================
              LOGO
          ================================================= */}

          <div className="mb-8 flex justify-center">

            <Link
              href="/"
              className="flex items-center gap-3"
            >

              <div
                className="
                  flex
                  h-12
                  w-12
                  items-center
                  justify-center
                  rounded-xl
                  bg-gradient-to-br
                  from-purple-500
                  to-blue-500
                  text-2xl
                  shadow-lg
                  shadow-purple-500/30
                "
              >
                ✦
              </div>

              <div>

                <div className="text-xl font-bold">
                  StoryPilot
                </div>

                <div className="text-xs tracking-[0.2em] text-slate-400">
                  AI STORY GENERATOR
                </div>

              </div>

            </Link>

          </div>

          {/* =================================================
              HEADING
          ================================================= */}

          <div className="mb-8 text-center">

            <h1 className="mb-3 text-4xl font-bold">
              Welcome Back
            </h1>

            <p className="text-slate-400">
              Sign in to continue building amazing
              user stories.
            </p>

          </div>

          {/* =================================================
              ERROR
          ================================================= */}

          {error && (
            <div
              className="
                mb-6
                rounded-xl
                border
                border-red-500/30
                bg-red-500/10
                px-4
                py-3
                text-sm
                text-red-400
              "
            >
              {error}
            </div>
          )}

          {/* =================================================
              LOGIN FORM
          ================================================= */}

          <form
            onSubmit={handleLogin}
            className="space-y-6"
          >

            {/* EMAIL */}

            <div>

              <label
                htmlFor="email"
                className="
                  mb-2
                  block
                  text-sm
                  font-semibold
                  text-slate-200
                "
              >
                Email
              </label>

              <input
                id="email"
                name="email"
                type="email"
                value={email}
                placeholder="Enter your email"
                autoComplete="email"
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                className="
                  w-full
                  rounded-xl
                  border
                  border-slate-700
                  bg-slate-800
                  px-4
                  py-4
                  text-white
                  outline-none
                  placeholder:text-slate-500
                  transition
                  focus:border-blue-500
                  focus:ring-2
                  focus:ring-blue-500/20
                "
              />

            </div>

            {/* PASSWORD */}

            <div>

              <label
                htmlFor="password"
                className="
                  mb-2
                  block
                  text-sm
                  font-semibold
                  text-slate-200
                "
              >
                Password
              </label>

              <input
                id="password"
                name="password"
                type="password"
                value={password}
                placeholder="Enter your password"
                autoComplete="current-password"
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                className="
                  w-full
                  rounded-xl
                  border
                  border-slate-700
                  bg-slate-800
                  px-4
                  py-4
                  text-white
                  outline-none
                  placeholder:text-slate-500
                  transition
                  focus:border-blue-500
                  focus:ring-2
                  focus:ring-blue-500/20
                "
              />

            </div>

            {/* FORGOT PASSWORD */}

            <div className="flex justify-end">

              <button
                type="button"
                onClick={() =>
                  alert(
                    "Password reset functionality will be added later."
                  )
                }
                className="
                  text-sm
                  text-blue-400
                  transition
                  hover:text-blue-300
                "
              >
                Forgot password?
              </button>

            </div>

            {/* LOGIN BUTTON */}

            <button
              type="submit"
              disabled={loading}
              className="
                w-full
                rounded-xl
                bg-gradient-to-r
                from-blue-600
                to-purple-600
                py-4
                font-semibold
                text-white
                shadow-lg
                shadow-blue-500/20
                transition
                hover:from-blue-500
                hover:to-purple-500
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              {loading
                ? "Signing in..."
                : "Sign In →"}
            </button>

          </form>

          {/* =================================================
              REGISTER
          ================================================= */}

          <div className="mt-8 text-center">

            <p className="text-sm text-slate-400">

              Don&apos;t have an account?{" "}

              <Link
                href="/register"
                className="
                  font-semibold
                  text-blue-400
                  transition
                  hover:text-blue-300
                "
              >
                Register
              </Link>

            </p>

          </div>

          {/* =================================================
              BACK HOME
          ================================================= */}

          <div className="mt-6 text-center">

            <Link
              href="/"
              className="
                text-sm
                text-slate-500
                transition
                hover:text-slate-300
              "
            >
              ← Back to StoryPilot AI
            </Link>

          </div>

        </div>

      </div>

    </main>
  );
}