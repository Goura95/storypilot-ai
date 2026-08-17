"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleRegister = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError("");
    setShowConfirmation(false);

    if (
      !firstName.trim() ||
      !lastName.trim() ||
      !email.trim() ||
      !password ||
      !confirmPassword
    ) {
      setError("Please fill in all fields.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }

    /*
     * Show confirmation inside the Register page.
     * No window.confirm() is used.
     */
    setShowConfirmation(true);
  };

  const handleConfirmRegistration = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "http://127.0.0.1:8000/api/auth/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            email: email.trim(),
            password,
          }),
        }
      );

      let data: {
        success?: boolean;
        message?: string;
        detail?: string;
      } = {};

      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        throw new Error(
          data.detail ||
            data.message ||
            "Registration failed."
        );
      }

      if (!data.success) {
        setError(
          data.message ||
            "Registration failed. Please try again."
        );
        return;
      }

      setShowConfirmation(false);

      router.push("/login");
    } catch (error) {
      console.error("Registration error:", error);

      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError(
          "Something went wrong. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancelConfirmation = () => {
    if (loading) {
      return;
    }

    setShowConfirmation(false);
    setError("");
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#020617] px-6 py-12 text-white">
      <div className="w-full max-w-2xl">

        {/* =====================================================
            LOGO / BRAND
            ===================================================== */}

        <div className="mb-8 text-center">
          <Link
            href="/"
            className="group inline-flex items-center gap-3"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 shadow-lg shadow-purple-500/30">
              <span className="text-xl">
                ✦
              </span>
            </div>

            <div className="text-left">
              <h1 className="text-xl font-bold tracking-tight">
                StoryPilot
              </h1>

              <p className="text-[10px] uppercase tracking-[0.25em] text-gray-400">
                AI Story Generator
              </p>
            </div>
          </Link>
        </div>

        {/* =====================================================
            REGISTER CARD
            ===================================================== */}

        <div className="w-full rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl shadow-blue-950/30 backdrop-blur md:p-10">

          {/* =================================================
              HEADER
              ================================================= */}

          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 shadow-lg shadow-purple-500/30">
              <span className="text-2xl">
                🚀
              </span>
            </div>

            <h2 className="text-3xl font-bold md:text-4xl">
              Create Account
            </h2>

            <p className="mt-2 text-gray-400">
              Join StoryPilot AI and start creating
              powerful user stories.
            </p>
          </div>

          {/* =================================================
              ERROR
              ================================================= */}

          {error && (
            <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          {/* =================================================
              REGISTRATION FORM
              ================================================= */}

          {!showConfirmation && (
            <>
              <form
                onSubmit={handleRegister}
                className="space-y-6"
              >

                {/* NAME ROW */}

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                  <div>
                    <label
                      htmlFor="firstName"
                      className="mb-2 block text-sm font-semibold text-gray-200"
                    >
                      First Name
                    </label>

                    <input
                      id="firstName"
                      type="text"
                      value={firstName}
                      onChange={(e) =>
                        setFirstName(
                          e.target.value
                        )
                      }
                      placeholder="Enter your first name"
                      autoComplete="given-name"
                      className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-3.5 text-white outline-none transition placeholder:text-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="lastName"
                      className="mb-2 block text-sm font-semibold text-gray-200"
                    >
                      Last Name
                    </label>

                    <input
                      id="lastName"
                      type="text"
                      value={lastName}
                      onChange={(e) =>
                        setLastName(
                          e.target.value
                        )
                      }
                      placeholder="Enter your last name"
                      autoComplete="family-name"
                      className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-3.5 text-white outline-none transition placeholder:text-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>

                </div>

                {/* EMAIL */}

                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-semibold text-gray-200"
                  >
                    Email Address
                  </label>

                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) =>
                      setEmail(e.target.value)
                    }
                    placeholder="you@example.com"
                    autoComplete="email"
                    className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-3.5 text-white outline-none transition placeholder:text-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                {/* PASSWORD ROW */}

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                  <div>
                    <label
                      htmlFor="password"
                      className="mb-2 block text-sm font-semibold text-gray-200"
                    >
                      Password
                    </label>

                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) =>
                        setPassword(
                          e.target.value
                        )
                      }
                      placeholder="Create a password"
                      autoComplete="new-password"
                      className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-3.5 text-white outline-none transition placeholder:text-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="confirmPassword"
                      className="mb-2 block text-sm font-semibold text-gray-200"
                    >
                      Confirm Password
                    </label>

                    <input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) =>
                        setConfirmPassword(
                          e.target.value
                        )
                      }
                      placeholder="Confirm your password"
                      autoComplete="new-password"
                      className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-3.5 text-white outline-none transition placeholder:text-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>

                </div>

                {/* PASSWORD INFO */}

                <div className="rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3">
                  <p className="text-xs text-gray-400">
                    🔒 Password must contain at least
                    6 characters.
                  </p>
                </div>

                {/* SUBMIT */}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 font-bold text-white shadow-lg shadow-blue-600/20 transition hover:from-blue-500 hover:to-purple-500 hover:shadow-purple-500/30 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Create Account
                </button>

              </form>

              {/* LOGIN */}

              <div className="mt-8 border-t border-slate-800 pt-6 text-center">
                <p className="text-gray-400">
                  Already have an account?{" "}

                  <Link
                    href="/login"
                    className="font-semibold text-blue-400 transition hover:text-blue-300"
                  >
                    Login
                  </Link>
                </p>
              </div>
            </>
          )}

          {/* =================================================
              CONFIRMATION - INSIDE REGISTER PAGE
              ================================================= */}

          {showConfirmation && (
            <div className="rounded-2xl border border-blue-500/20 bg-slate-950/60 p-6">

              <div className="flex flex-col items-center text-center">

                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/10 text-3xl">
                  ✓
                </div>

                <h3 className="mt-5 text-2xl font-bold text-white">
                  Confirm Your Account
                </h3>

                <p className="mt-2 max-w-md text-sm leading-6 text-gray-400">
                  Please verify the information below
                  before creating your StoryPilot AI
                  account.
                </p>

              </div>

              {/* ACCOUNT DETAILS */}

              <div className="mt-6 space-y-3">

                <div className="rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-3">
                  <p className="text-xs uppercase tracking-wider text-gray-500">
                    Name
                  </p>

                  <p className="mt-1 font-medium text-white">
                    {firstName} {lastName}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-3">
                  <p className="text-xs uppercase tracking-wider text-gray-500">
                    Email
                  </p>

                  <p className="mt-1 break-all font-medium text-white">
                    {email}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-3">
                  <p className="text-xs uppercase tracking-wider text-gray-500">
                    Password
                  </p>

                  <p className="mt-1 font-medium text-white">
                    ••••••••
                  </p>
                </div>

              </div>

              {/* CONFIRMATION MESSAGE */}

              <div className="mt-6 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
                <p className="text-sm leading-6 text-amber-200">
                  Are you sure you want to create
                  this account?
                </p>
              </div>

              {/* ACTIONS */}

              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">

                <button
                  type="button"
                  onClick={
                    handleCancelConfirmation
                  }
                  disabled={loading}
                  className="rounded-xl border border-slate-700 bg-slate-800/80 px-5 py-3.5 text-sm font-semibold text-gray-300 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Go Back
                </button>

                <button
                  type="button"
                  onClick={
                    handleConfirmRegistration
                  }
                  disabled={loading}
                  className="rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:from-blue-500 hover:to-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading
                    ? "Creating Account..."
                    : "Confirm & Create Account"}
                </button>

              </div>

            </div>
          )}

        </div>

        {/* =====================================================
            FOOTER
            ===================================================== */}

        <p className="mt-6 text-center text-xs text-gray-600">
          © 2026 StoryPilot AI. AI-powered product
          management.
        </p>

      </div>
    </main>
  );
}