"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { loginUser, verifyMFA } from "@/services/authService";
import { ApiError, UnauthorizedError } from "@/services/api";


export default function LoginForm() {

  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaEmail, setMfaEmail] = useState("");


  // ==========================================================
  // LOGIN
  // ==========================================================

  const handleSubmit = async () => {

    try {

      setLoading(true);
      setError(null);

      const response = await loginUser({
        email,
        password,
      });


      // ======================================================
      // LOGIN FAILED
      // ======================================================

      if (!response.success) {

        setError(response.message || "Invalid email or password.");
        return;
      }


      // ======================================================
      // MFA REQUIRED
      // ======================================================

      if (response.mfa_required) {

        setMfaRequired(true);
        setMfaEmail(response.email || email);
        setError(null);
        return;
      }


      // ======================================================
      // CHECK JWT
      // ======================================================

      if (!response.access_token) {

        setError("Login successful, but no authentication token was received.");
        return;
      }


      // ======================================================
      // STORE REAL JWT
      // ======================================================

      localStorage.setItem(
        "token",
        response.access_token
      );


      // ======================================================
      // STORE USER
      // ======================================================

      if (response.user) {

        localStorage.setItem(
          "user",
          JSON.stringify(response.user)
        );

      }


      // ======================================================
      // GO TO DASHBOARD
      // ======================================================

      router.push("/dashboard");

    }

    catch (error) {

      console.error("Login error:", error);

      let errorMessage = "Unable to login. Please try again.";

      if (error instanceof ApiError) {
        errorMessage = error.detail || errorMessage;
      } else if (error instanceof Error) {
        errorMessage = error.message || errorMessage;
      }

      setError(errorMessage);

    }

    finally {

      setLoading(false);

    }

  };


  // ==========================================================
  // VERIFY MFA
  // ==========================================================

  const handleVerifyMFA = async () => {

    if (!otpCode.trim()) {
      setError("Please enter the OTP code.");
      return;
    }

    try {

      setLoading(true);
      setError(null);

      const response = await verifyMFA({
        email: mfaEmail,
        otp_code: otpCode,
      });

      if (!response.success) {
        setError(response.message || "Invalid OTP code.");
        return;
      }

      if (!response.access_token) {
        setError("MFA verification successful, but no authentication token was received.");
        return;
      }

      // Store token and user
      localStorage.setItem("token", response.access_token);

      if (response.user) {
        localStorage.setItem("user", JSON.stringify(response.user));
      }

      // Redirect to dashboard
      router.push("/dashboard");

    } catch (error) {

      console.error("MFA verification error:", error);

      let errorMessage = "Unable to verify OTP. Please try again.";

      if (error instanceof ApiError) {
        errorMessage = error.detail || errorMessage;
      } else if (error instanceof Error) {
        errorMessage = error.message || errorMessage;
      }

      setError(errorMessage);

    } finally {

      setLoading(false);

    }

  };


  // ==========================================================
  // UI
  // ==========================================================

  return (

    <div>

      <h1 className="text-2xl font-bold mb-6">
        {mfaRequired ? "Verify MFA" : "Login"}
      </h1>

      {/* =====================================================
          ERROR ALERT
          ===================================================== */}

      {error && (
        <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {!mfaRequired ? (
        <>
          {/* =====================================================
              EMAIL
              ===================================================== */}

          <div className="mb-4">

            <label className="block mb-2">
              Email
            </label>

            <input
              type="email"
              placeholder="Enter Email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              className="
                w-full
                p-3
                rounded
                bg-slate-800
                border
                border-slate-700
              "
            />

          </div>


          {/* =====================================================
              PASSWORD
              ===================================================== */}

          <div className="mb-6">

            <label className="block mb-2">
              Password
            </label>

            <input
              type="password"
              placeholder="Enter Password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              className="
                w-full
                p-3
                rounded
                bg-slate-800
                border
                border-slate-700
              "
            />

          </div>


          {/* =====================================================
              LOGIN BUTTON
              ===================================================== */}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="
              w-full
              bg-blue-600
              hover:bg-blue-700
              disabled:opacity-50
              py-3
              rounded-lg
              font-semibold
            "
          >

            {loading
              ? "Logging in..."
              : "Login"
            }

          </button>
        </>
      ) : (
        <>
          {/* =====================================================
              MFA CODE
              ===================================================== */}

          <div className="mb-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <p className="text-blue-400 text-sm">
              We&apos;ve sent a 6-digit code to {mfaEmail}. Please enter it below.
            </p>
          </div>

          <div className="mb-6">

            <label className="block mb-2">
              MFA Code
            </label>

            <input
              type="text"
              placeholder="Enter 6-digit code"
              value={otpCode}
              onChange={(e) =>
                setOtpCode(e.target.value)
              }
              maxLength={6}
              className="
                w-full
                p-3
                rounded
                bg-slate-800
                border
                border-slate-700
                text-center
                tracking-widest
              "
            />

          </div>


          {/* =====================================================
              VERIFY BUTTON
              ===================================================== */}

          <button
            type="button"
            onClick={handleVerifyMFA}
            disabled={loading}
            className="
              w-full
              bg-blue-600
              hover:bg-blue-700
              disabled:opacity-50
              py-3
              rounded-lg
              font-semibold
            "
          >

            {loading
              ? "Verifying..."
              : "Verify MFA"
            }

          </button>

          <button
            type="button"
            onClick={() => {
              setMfaRequired(false);
              setOtpCode("");
              setError(null);
            }}
            disabled={loading}
            className="
              w-full
              mt-3
              bg-slate-700
              hover:bg-slate-600
              disabled:opacity-50
              py-3
              rounded-lg
              font-semibold
            "
          >
            Back to Login
          </button>
        </>
      )}

    </div>

  );

}
