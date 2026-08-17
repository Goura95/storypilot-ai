"use client";

import {
  FormEvent,
  useState,
  useSyncExternalStore,
} from "react";

import { useRouter } from "next/navigation";
import Link from "next/link";

// ============================================================
// API TYPES
// ============================================================

type FastAPIValidationError = {
  type?: string;
  loc?: Array<string | number>;
  msg?: string;
  input?: unknown;
  ctx?: Record<string, unknown>;
};

type UserData = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
};

type APIResponse = {
  success?: boolean;
  message?: string;

  detail?:
    | string
    | FastAPIValidationError[];

  access_token?: string;

  token_type?: string;

  email?: string;

  user?: UserData;
};

// ============================================================
// SAFE ERROR MESSAGE
// ============================================================

function getErrorMessage(
  data: APIResponse,
  fallback: string
): string {
  // ----------------------------------------------------------
  // FastAPI validation errors
  // ----------------------------------------------------------

  if (Array.isArray(data.detail)) {
    const messages = data.detail
      .map((item) => {
        if (typeof item === "string") {
          return item;
        }

        if (
          item &&
          typeof item.msg === "string"
        ) {
          return item.msg;
        }

        return "";
      })
      .filter(Boolean);

    if (messages.length > 0) {
      return messages.join(". ");
    }
  }

  // ----------------------------------------------------------
  // Normal FastAPI error
  // ----------------------------------------------------------

  if (typeof data.detail === "string") {
    return data.detail;
  }

  // ----------------------------------------------------------
  // Application error
  // ----------------------------------------------------------

  if (
    typeof data.message === "string"
  ) {
    return data.message;
  }

  return fallback;
}

// ============================================================
// SESSION STORAGE SUBSCRIPTION
// ============================================================

function subscribeToSessionStorage(
  callback: () => void
): () => void {
  window.addEventListener(
    "storage",
    callback
  );

  window.addEventListener(
    "storypilot-mfa-email-updated",
    callback
  );

  return () => {
    window.removeEventListener(
      "storage",
      callback
    );

    window.removeEventListener(
      "storypilot-mfa-email-updated",
      callback
    );
  };
}

// ============================================================
// GET MFA EMAIL
// ============================================================

function getMFAEmailSnapshot(): string {
  return (
    window.sessionStorage.getItem(
      "mfa_email"
    ) || ""
  );
}

// ============================================================
// SERVER SNAPSHOT
// ============================================================

function getServerMFAEmailSnapshot(): string {
  return "";
}

// ============================================================
// MFA PAGE
// ============================================================

export default function MFAPage() {
  const router = useRouter();

  // ==========================================================
  // MFA EMAIL
  // ==========================================================

  const email = useSyncExternalStore(
    subscribeToSessionStorage,
    getMFAEmailSnapshot,
    getServerMFAEmailSnapshot
  );

  // ==========================================================
  // OTP
  // ==========================================================

  const [otp, setOtp] = useState("");

  // ==========================================================
  // UI STATE
  // ==========================================================

  const [loading, setLoading] =
    useState(false);

  const [resending, setResending] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  // ==========================================================
  // VERIFY OTP
  // ==========================================================

  const handleVerify = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    // ========================================================
    // EMAIL CHECK
    // ========================================================

    if (!email) {
      setError(
        "Your MFA verification session has expired. Please sign in again."
      );

      return;
    }

    // ========================================================
    // OTP VALIDATION
    // ========================================================

    if (!otp.trim()) {
      setError(
        "Please enter the verification code."
      );

      return;
    }

    if (!/^\d{6}$/.test(otp)) {
      setError(
        "Please enter the 6-digit verification code."
      );

      return;
    }

    try {
      setLoading(true);

      // ======================================================
      // VERIFY MFA API
      //
      // IMPORTANT:
      // Backend expects email and otp as QUERY PARAMETERS.
      //
      // Example:
      //
      // POST /api/auth/verify-mfa
      // ?email=user@gmail.com
      // &otp=123456
      // ======================================================

      const response = await fetch(
        `http://127.0.0.1:8000/api/auth/verify-mfa?email=${encodeURIComponent(
          email
        )}&otp=${encodeURIComponent(
          otp
        )}`,
        {
          method: "POST",

          headers: {
            Accept: "application/json",
          },
        }
      );

      const data: APIResponse =
        await response.json();

      console.log(
        "MFA verification response:",
        data
      );

      // ======================================================
      // BACKEND ERROR
      // ======================================================

      if (!response.ok) {
        setError(
          getErrorMessage(
            data,
            "MFA verification failed."
          )
        );

        return;
      }

      // ======================================================
      // APPLICATION FAILURE
      // ======================================================

      if (!data.success) {
        setError(
          data.message ||
            "Invalid or expired verification code."
        );

        return;
      }

      // ======================================================
      // JWT CHECK
      // ======================================================

      if (!data.access_token) {
        setError(
          "MFA verification succeeded but authentication token was not returned."
        );

        return;
      }

      // ======================================================
      // STORE JWT
      // ======================================================

      localStorage.setItem(
        "token",
        data.access_token
      );

      // ======================================================
      // STORE TOKEN TYPE
      // ======================================================

      localStorage.setItem(
        "token_type",
        data.token_type || "bearer"
      );

      // ======================================================
      // STORE USER
      // ======================================================

      if (data.user) {
        localStorage.setItem(
          "user",
          JSON.stringify(data.user)
        );
      }

      // ======================================================
      // REMOVE TEMPORARY MFA SESSION
      // ======================================================

      sessionStorage.removeItem(
        "mfa_email"
      );

      // ======================================================
      // SUCCESS MESSAGE
      // ======================================================

      setSuccess(
        "Verification successful. Redirecting..."
      );

      // ======================================================
      // REDIRECT TO DASHBOARD
      // ======================================================

      router.replace(
        "/dashboard"
      );
    } catch (verifyError) {
      console.error(
        "MFA verification error:",
        verifyError
      );

      setError(
        "Unable to connect to StoryPilot AI backend."
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // RESEND OTP
  // ==========================================================

  const handleResend = async () => {
    setError("");
    setSuccess("");

    // ========================================================
    // EMAIL CHECK
    // ========================================================

    if (!email) {
      setError(
        "Your MFA verification session has expired. Please sign in again."
      );

      return;
    }

    try {
      setResending(true);

      // ======================================================
      // RESEND MFA API
      // ======================================================

      const response = await fetch(
        `http://127.0.0.1:8000/api/auth/resend-mfa?email=${encodeURIComponent(
          email
        )}`,
        {
          method: "POST",

          headers: {
            Accept: "application/json",
          },
        }
      );

      const data: APIResponse =
        await response.json();

      console.log(
        "Resend MFA response:",
        data
      );

      // ======================================================
      // ERROR
      // ======================================================

      if (!response.ok) {
        setError(
          getErrorMessage(
            data,
            "Unable to resend verification code."
          )
        );

        return;
      }

      if (!data.success) {
        setError(
          data.message ||
            "Unable to resend verification code."
        );

        return;
      }

      // ======================================================
      // CLEAR OLD OTP
      // ======================================================

      setOtp("");

      // ======================================================
      // SUCCESS
      // ======================================================

      setSuccess(
        "A new verification code has been sent to your email."
      );
    } catch (resendError) {
      console.error(
        "Resend MFA error:",
        resendError
      );

      setError(
        "Unable to connect to StoryPilot AI backend."
      );
    } finally {
      setResending(false);
    }
  };

  // ==========================================================
  // MASK EMAIL
  // ==========================================================

  const maskedEmail =
    maskEmail(email);

  // ==========================================================
  // PAGE
  // ==========================================================

  return (
    <main
      className="
        relative
        flex
        min-h-screen
        items-center
        justify-center
        overflow-hidden
        bg-slate-950
        px-4
        py-10
        text-white
      "
    >
      {/* =====================================================
          BACKGROUND
      ===================================================== */}

      <div
        className="
          pointer-events-none
          fixed
          inset-0
          overflow-hidden
        "
      >
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
          MFA CONTAINER
      ===================================================== */}

      <div
        className="
          relative
          w-full
          max-w-xl
        "
      >
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

          <div
            className="
              mb-8
              flex
              justify-center
            "
          >
            <Link
              href="/"
              className="
                flex
                items-center
                gap-3
              "
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
                <div
                  className="
                    text-xl
                    font-bold
                  "
                >
                  StoryPilot
                </div>

                <div
                  className="
                    text-xs
                    tracking-[0.2em]
                    text-slate-400
                  "
                >
                  AI STORY GENERATOR
                </div>
              </div>
            </Link>
          </div>

          {/* =================================================
              SECURITY ICON
          ================================================= */}

          <div
            className="
              mb-6
              flex
              justify-center
            "
          >
            <div
              className="
                flex
                h-16
                w-16
                items-center
                justify-center
                rounded-2xl
                border
                border-purple-500/20
                bg-purple-500/10
                text-3xl
              "
            >
              🔐
            </div>
          </div>

          {/* =================================================
              HEADING
          ================================================= */}

          <div
            className="
              mb-8
              text-center
            "
          >
            <h1
              className="
                mb-3
                text-3xl
                font-bold
              "
            >
              Verify Your Identity
            </h1>

            <p
              className="
                mx-auto
                max-w-md
                text-sm
                leading-6
                text-slate-400
              "
            >
              Multi-factor authentication is
              enabled for your account. Enter
              the 6-digit verification code sent
              to:
            </p>

            <p
              className="
                mt-3
                font-semibold
                text-white
              "
            >
              {maskedEmail ||
                "your registered email"}
            </p>
          </div>

          {/* =================================================
              ERROR
          ================================================= */}

          {error && (
            <div
              className="
                mb-5
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
              SUCCESS
          ================================================= */}

          {success && (
            <div
              className="
                mb-5
                rounded-xl
                border
                border-emerald-500/30
                bg-emerald-500/10
                px-4
                py-3
                text-sm
                text-emerald-400
              "
            >
              {success}
            </div>
          )}

          {/* =================================================
              OTP FORM
          ================================================= */}

          <form
            onSubmit={handleVerify}
            className="space-y-6"
          >
            {/* =================================================
                OTP INPUT
            ================================================= */}

            <div>
              <label
                htmlFor="otp"
                className="
                  mb-2
                  block
                  text-center
                  text-sm
                  font-semibold
                  text-slate-200
                "
              >
                6-Digit Verification Code
              </label>

              <input
                id="otp"
                name="otp"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={otp}
                placeholder="000000"
                onChange={(event) => {
                  const value =
                    event.target.value
                      .replace(/\D/g, "")
                      .slice(0, 6);

                  setOtp(value);
                }}
                className="
                  w-full
                  rounded-xl
                  border
                  border-slate-700
                  bg-slate-800
                  px-4
                  py-5
                  text-center
                  text-2xl
                  font-bold
                  tracking-[0.5em]
                  text-white
                  outline-none
                  placeholder:text-slate-600
                  placeholder:tracking-[0.5em]
                  transition
                  focus:border-purple-500
                  focus:ring-2
                  focus:ring-purple-500/20
                "
              />
            </div>

            {/* =================================================
                VERIFY BUTTON
            ================================================= */}

            <button
              type="submit"
              disabled={
                loading ||
                otp.length !== 6
              }
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
                ? "Verifying..."
                : "Verify & Continue →"}
            </button>
          </form>

          {/* =================================================
              RESEND
          ================================================= */}

          <div
            className="
              mt-6
              text-center
            "
          >
            <p
              className="
                text-sm
                text-slate-500
              "
            >
              Didn&apos;t receive the code?
            </p>

            <button
              type="button"
              disabled={resending}
              onClick={handleResend}
              className="
                mt-2
                text-sm
                font-semibold
                text-blue-400
                transition
                hover:text-blue-300
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              {resending
                ? "Sending..."
                : "Resend code"}
            </button>
          </div>

          {/* =================================================
              BACK TO LOGIN
          ================================================= */}

          <div
            className="
              mt-6
              text-center
            "
          >
            <button
              type="button"
              onClick={() => {
                sessionStorage.removeItem(
                  "mfa_email"
                );

                router.push("/login");
              }}
              className="
                text-sm
                text-slate-500
                transition
                hover:text-slate-300
              "
            >
              ← Back to Sign In
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

// ============================================================
// MASK EMAIL
// ============================================================

function maskEmail(
  email: string
): string {
  if (!email) {
    return "";
  }

  const parts = email.split("@");

  if (parts.length !== 2) {
    return email;
  }

  const username = parts[0];
  const domain = parts[1];

  if (username.length <= 2) {
    return `${username[0] || "*"}***@${domain}`;
  }

  return `${username[0]}${"*".repeat(
    Math.max(username.length - 2, 2)
  )}${username[username.length - 1]}@${domain}`;
}