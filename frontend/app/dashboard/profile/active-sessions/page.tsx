"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// ============================================================
// TYPES
// ============================================================

interface Session {
  id: string;
  device: string;
  browser: string;
  operating_system: string;
  ip_address: string;
  location?: string | null;
  last_active: string;
  created_at: string;
  is_current: boolean;
}

interface SessionsResponse {
  success: boolean;
  message?: string;
  sessions?: Session[];
}

// ============================================================
// API CONFIGURATION
// ============================================================

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8000";

// ============================================================
// PAGE
// ============================================================

export default function ActiveSessionsPage() {
  const router = useRouter();

  // ==========================================================
  // STATE
  // ==========================================================

  const [sessions, setSessions] =
    useState<Session[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [revokingId, setRevokingId] =
    useState<string | null>(null);

  const [revokingAll, setRevokingAll] =
    useState(false);

  const [success, setSuccess] =
    useState("");

  // ==========================================================
  // GET TOKEN
  // ==========================================================

  const getToken = () => {
    if (typeof window === "undefined") {
      return null;
    }

    return (
      window.localStorage.getItem("token") ||
      window.localStorage.getItem("access_token")
    );
  };

  // ==========================================================
  // LOAD SESSIONS
  // ==========================================================

  useEffect(() => {
    let cancelled = false;

    const loadSessions = async () => {
      const token = getToken();

      if (!token) {
        router.push("/login");
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_URL}/api/auth/sessions`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          }
        );

        // ----------------------------------------------------
        // UNAUTHORIZED
        // ----------------------------------------------------

        if (response.status === 401) {
          window.localStorage.removeItem(
            "token"
          );

          window.localStorage.removeItem(
            "access_token"
          );

          window.localStorage.removeItem(
            "token_type"
          );

          router.push("/login");

          return;
        }

        // ----------------------------------------------------
        // OTHER API ERRORS
        // ----------------------------------------------------

        if (!response.ok) {
          let backendMessage =
            "Unable to load active sessions.";

          try {
            const errorData =
              await response.json();

            if (
              errorData?.message
            ) {
              backendMessage =
                errorData.message;
            }

            if (
              errorData?.detail
            ) {
              backendMessage =
                typeof errorData.detail ===
                "string"
                  ? errorData.detail
                  : backendMessage;
            }
          } catch {
            // Ignore invalid error JSON.
          }

          console.error(
            "Active sessions API error:",
            {
              status: response.status,
              statusText:
                response.statusText,
              url: response.url,
              message:
                backendMessage,
            }
          );

          throw new Error(
            backendMessage
          );
        }

        // ----------------------------------------------------
        // RESPONSE
        // ----------------------------------------------------

        const data =
          (await response.json()) as SessionsResponse;

        console.log(
          "Active sessions API response:",
          data
        );

        if (cancelled) {
          return;
        }

        setSessions(
          Array.isArray(data.sessions)
            ? data.sessions
            : []
        );

        setError("");
        setLoading(false);

      } catch (loadError) {
        console.error(
          "Failed to load active sessions:",
          loadError
        );

        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load active sessions. Please try again."
          );

          setLoading(false);
        }
      }
    };

    void loadSessions();

    return () => {
      cancelled = true;
    };
  }, [router]);

  // ==========================================================
  // REVOKE ONE SESSION
  // ==========================================================

  const revokeSession = async (
    sessionId: string
  ) => {
    const token = getToken();

    if (!token) {
      router.push("/login");
      return;
    }

    try {
      setRevokingId(sessionId);
      setError("");
      setSuccess("");

      const response = await fetch(
        `${API_URL}/api/auth/sessions/${encodeURIComponent(
          sessionId
        )}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      if (response.status === 401) {
        window.localStorage.removeItem(
          "token"
        );

        window.localStorage.removeItem(
          "access_token"
        );

        window.localStorage.removeItem(
          "token_type"
        );

        router.push("/login");

        return;
      }

      const data = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Unable to revoke session."
        );
      }

      if (data?.success === false) {
        throw new Error(
          data.message ||
            "Unable to revoke session."
        );
      }

      setSessions(
        (currentSessions) =>
          currentSessions.filter(
            (session) =>
              session.id !== sessionId
          )
      );

      setSuccess(
        data?.message ||
          "Session revoked successfully."
      );

      window.setTimeout(() => {
        setSuccess("");
      }, 2500);

    } catch (revokeError) {
      console.error(
        "Failed to revoke session:",
        revokeError
      );

      setError(
        revokeError instanceof Error
          ? revokeError.message
          : "Unable to revoke session. Please try again."
      );
    } finally {
      setRevokingId(null);
    }
  };

  // ==========================================================
  // REVOKE ALL OTHER SESSIONS
  // ==========================================================

  const revokeAllOtherSessions =
    async () => {
      const token = getToken();

      if (!token) {
        router.push("/login");
        return;
      }

      try {
        setRevokingAll(true);
        setError("");
        setSuccess("");

        const response = await fetch(
          `${API_URL}/api/auth/sessions/revoke-all`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          }
        );

        if (response.status === 401) {
          window.localStorage.removeItem(
            "token"
          );

          window.localStorage.removeItem(
            "access_token"
          );

          window.localStorage.removeItem(
            "token_type"
          );

          router.push("/login");

          return;
        }

        const data = await response
          .json()
          .catch(() => null);

        if (!response.ok) {
          throw new Error(
            data?.message ||
              "Unable to revoke sessions."
          );
        }

        if (data?.success === false) {
          throw new Error(
            data.message ||
              "Unable to revoke sessions."
          );
        }

        setSessions(
          (currentSessions) =>
            currentSessions.filter(
              (session) =>
                session.is_current
            )
        );

        setSuccess(
          data?.message ||
            "All other sessions have been revoked."
        );

        window.setTimeout(() => {
          setSuccess("");
        }, 2500);

      } catch (revokeError) {
        console.error(
          "Failed to revoke all sessions:",
          revokeError
        );

        setError(
          revokeError instanceof Error
            ? revokeError.message
            : "Unable to revoke other sessions. Please try again."
        );
      } finally {
        setRevokingAll(false);
      }
    };

  // ==========================================================
  // FORMAT DATE
  // ==========================================================

  const formatDate = (
    value: string
  ) => {
    if (!value) {
      return "Unknown";
    }

    try {
      return new Date(
        value
      ).toLocaleString(
        "en-IN",
        {
          dateStyle: "medium",
          timeStyle: "short",
        }
      );
    } catch {
      return value;
    }
  };

  // ==========================================================
  // CURRENT SESSION
  // ==========================================================

  const currentSession =
    sessions.find(
      (session) =>
        session.is_current
    );

  // ==========================================================
  // OTHER SESSIONS
  // ==========================================================

  const otherSessions =
    sessions.filter(
      (session) =>
        !session.is_current
    );

  // ==========================================================
  // PAGE
  // ==========================================================

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950">

      {/* ======================================================
          BACKGROUND
      ====================================================== */}

      <div className="pointer-events-none absolute inset-0 overflow-hidden">

        <div
          className="
            absolute
            -left-32
            -top-32
            h-96
            w-96
            rounded-full
            bg-purple-600/[0.08]
            blur-3xl
          "
        />

        <div
          className="
            absolute
            -right-32
            top-1/4
            h-96
            w-96
            rounded-full
            bg-blue-600/[0.07]
            blur-3xl
          "
        />

        <div
          className="
            absolute
            bottom-0
            left-1/3
            h-80
            w-80
            rounded-full
            bg-cyan-600/[0.05]
            blur-3xl
          "
        />

      </div>

      {/* ======================================================
          MAIN
      ====================================================== */}

      <main
        className="
          relative
          min-h-screen
          w-full
          px-5
          py-6
          sm:px-8
          lg:px-10
          xl:px-14
        "
      >

        <div className="mx-auto w-full max-w-[1200px]">

          {/* ==================================================
              HEADER
          ================================================== */}

          <div
            className="
              flex
              flex-col
              gap-5
              border-b
              border-white/10
              pb-6
              sm:flex-row
              sm:items-end
              sm:justify-between
            "
          >

            <div>

              <p
                className="
                  text-xs
                  font-semibold
                  uppercase
                  tracking-[0.25em]
                  text-purple-400
                "
              >
                StoryPilot AI
              </p>

              <h1
                className="
                  mt-2
                  text-3xl
                  font-bold
                  tracking-tight
                  text-white
                  md:text-4xl
                "
              >
                Active Sessions
              </h1>

              <p
                className="
                  mt-2
                  max-w-2xl
                  text-sm
                  leading-6
                  text-slate-400
                "
              >
                Review the devices currently
                signed in to your StoryPilot AI
                account.
              </p>

            </div>

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/dashboard/profile"
                )
              }
              className="
                w-fit
                rounded-xl
                border
                border-white/10
                bg-white/[0.04]
                px-4
                py-2.5
                text-sm
                font-medium
                text-slate-300
                transition
                hover:border-white/20
                hover:bg-white/[0.07]
                hover:text-white
              "
            >
              ← Back to Profile
            </button>

          </div>

          {/* ==================================================
              ERROR
          ================================================== */}

          {error && (
            <div
              className="
                mt-6
                rounded-2xl
                border
                border-red-500/20
                bg-red-500/[0.05]
                px-5
                py-4
                text-sm
                text-red-400
              "
            >
              {error}
            </div>
          )}

          {/* ==================================================
              SUCCESS
          ================================================== */}

          {success && (
            <div
              className="
                mt-6
                rounded-2xl
                border
                border-emerald-500/20
                bg-emerald-500/[0.05]
                px-5
                py-4
                text-sm
                text-emerald-400
              "
            >
              {success}
            </div>
          )}

          {/* ==================================================
              SUMMARY
          ================================================== */}

          <section
            className="
              mt-8
              grid
              gap-4
              sm:grid-cols-2
            "
          >

            <div
              className="
                rounded-2xl
                border
                border-white/10
                bg-slate-900/70
                p-5
              "
            >

              <p
                className="
                  text-xs
                  font-semibold
                  uppercase
                  tracking-wider
                  text-slate-500
                "
              >
                Active Sessions
              </p>

              <p
                className="
                  mt-2
                  text-3xl
                  font-bold
                  text-white
                "
              >
                {loading
                  ? "..."
                  : sessions.length}
              </p>

              <p
                className="
                  mt-1
                  text-xs
                  text-slate-500
                "
              >
                Devices currently signed in
              </p>

            </div>

            <div
              className="
                rounded-2xl
                border
                border-emerald-500/10
                bg-emerald-500/[0.03]
                p-5
              "
            >

              <p
                className="
                  text-xs
                  font-semibold
                  uppercase
                  tracking-wider
                  text-slate-500
                "
              >
                Current Session
              </p>

              <p
                className="
                  mt-2
                  text-3xl
                  font-bold
                  text-emerald-400
                "
              >
                {loading
                  ? "..."
                  : currentSession
                    ? "Active"
                    : "—"}
              </p>

              <p
                className="
                  mt-1
                  text-xs
                  text-slate-500
                "
              >
                This device
              </p>

            </div>

          </section>

          {/* ==================================================
              CURRENT SESSION
          ================================================== */}

          <section className="mt-6">

            <div className="mb-4">

              <h2
                className="
                  text-xl
                  font-bold
                  text-white
                "
              >
                Current Session
              </h2>

              <p
                className="
                  mt-1
                  text-sm
                  text-slate-500
                "
              >
                The device you are currently
                using.
              </p>

            </div>

            {loading ? (

              <SessionSkeleton />

            ) : currentSession ? (

              <SessionCard
                session={currentSession}
                formatDate={formatDate}
                onRevoke={() => {}}
                revoking={false}
                current
              />

            ) : (

              <div
                className="
                  rounded-2xl
                  border
                  border-white/10
                  bg-slate-900/60
                  p-6
                  text-sm
                  text-slate-500
                "
              >
                Current session information
                is unavailable.
              </div>

            )}

          </section>

          {/* ==================================================
              OTHER SESSIONS
          ================================================== */}

          <section className="mt-8">

            <div
              className="
                mb-4
                flex
                flex-col
                gap-3
                sm:flex-row
                sm:items-end
                sm:justify-between
              "
            >

              <div>

                <h2
                  className="
                    text-xl
                    font-bold
                    text-white
                  "
                >
                  Other Sessions
                </h2>

                <p
                  className="
                    mt-1
                    text-sm
                    text-slate-500
                  "
                >
                  Devices where your account
                  is currently signed in.
                </p>

              </div>

              {!loading &&
                otherSessions.length > 0 && (
                  <button
                    type="button"
                    onClick={
                      revokeAllOtherSessions
                    }
                    disabled={revokingAll}
                    className="
                      w-fit
                      rounded-xl
                      border
                      border-red-500/20
                      bg-red-500/[0.06]
                      px-4
                      py-2.5
                      text-sm
                      font-semibold
                      text-red-400
                      transition
                      hover:border-red-500/30
                      hover:bg-red-500/10
                      hover:text-red-300
                      disabled:cursor-not-allowed
                      disabled:opacity-50
                    "
                  >
                    {revokingAll
                      ? "Revoking..."
                      : "Revoke All Other Sessions"}
                  </button>
                )}

            </div>

            {loading ? (

              <div className="space-y-4">
                <SessionSkeleton />
                <SessionSkeleton />
              </div>

            ) : otherSessions.length === 0 ? (

              <div
                className="
                  rounded-2xl
                  border
                  border-white/10
                  bg-slate-900/60
                  p-8
                  text-center
                "
              >

                <div
                  className="
                    mx-auto
                    flex
                    h-14
                    w-14
                    items-center
                    justify-center
                    rounded-2xl
                    bg-emerald-500/10
                    text-2xl
                  "
                >
                  ✓
                </div>

                <h3
                  className="
                    mt-4
                    text-lg
                    font-semibold
                    text-white
                  "
                >
                  No Other Active Sessions
                </h3>

                <p
                  className="
                    mx-auto
                    mt-2
                    max-w-md
                    text-sm
                    leading-6
                    text-slate-500
                  "
                >
                  Your account is currently
                  signed in only on this device.
                </p>

              </div>

            ) : (

              <div className="space-y-4">

                {otherSessions.map(
                  (session) => (
                    <SessionCard
                      key={session.id}
                      session={session}
                      formatDate={formatDate}
                      onRevoke={() =>
                        revokeSession(
                          session.id
                        )
                      }
                      revoking={
                        revokingId ===
                        session.id
                      }
                    />
                  )
                )}

              </div>

            )}

          </section>

          {/* ==================================================
              SECURITY INFORMATION
          ================================================== */}

          <section
            className="
              mt-8
              rounded-2xl
              border
              border-blue-500/10
              bg-blue-500/[0.03]
              p-6
            "
          >

            <div className="flex gap-4">

              <div
                className="
                  flex
                  h-10
                  w-10
                  shrink-0
                  items-center
                  justify-center
                  rounded-xl
                  bg-blue-500/10
                  text-blue-400
                "
              >
                🔒
              </div>

              <div>

                <h3
                  className="
                    text-sm
                    font-semibold
                    text-white
                  "
                >
                  Security Tip
                </h3>

                <p
                  className="
                    mt-1
                    text-sm
                    leading-6
                    text-slate-500
                  "
                >
                  If you see a device or
                  location you do not recognize,
                  revoke that session immediately
                  and change your password.
                </p>

              </div>

            </div>

          </section>

        </div>

      </main>

    </div>
  );
}


// ============================================================
// SESSION CARD
// ============================================================

function SessionCard({
  session,
  formatDate,
  onRevoke,
  revoking,
  current = false,
}: {
  session: Session;
  formatDate: (value: string) => string;
  onRevoke: () => void;
  revoking: boolean;
  current?: boolean;
}) {
  return (
    <div
      className={`
        rounded-2xl
        border
        bg-slate-900/70
        p-5
        transition
        ${
          current
            ? "border-emerald-500/20 shadow-lg shadow-emerald-950/10"
            : "border-white/10 hover:border-white/15"
        }
      `}
    >

      <div
        className="
          flex
          flex-col
          gap-5
          lg:flex-row
          lg:items-center
          lg:justify-between
        "
      >

        {/* DEVICE */}

        <div className="flex min-w-0 gap-4">

          <div
            className={`
              flex
              h-14
              w-14
              shrink-0
              items-center
              justify-center
              rounded-2xl
              text-2xl
              ${
                current
                  ? "bg-emerald-500/10"
                  : "bg-white/[0.05]"
              }
            `}
          >
            {getDeviceIcon(
              session.device
            )}
          </div>

          <div className="min-w-0">

            <div
              className="
                flex
                flex-wrap
                items-center
                gap-2
              "
            >

              <h3
                className="
                  text-base
                  font-semibold
                  text-white
                "
              >
                {session.device ||
                  "Unknown Device"}
              </h3>

              {current && (
                <span
                  className="
                    rounded-full
                    border
                    border-emerald-500/20
                    bg-emerald-500/10
                    px-2.5
                    py-1
                    text-[11px]
                    font-semibold
                    text-emerald-400
                  "
                >
                  This device
                </span>
              )}

            </div>

            <p
              className="
                mt-1
                text-sm
                text-slate-400
              "
            >
              {session.browser ||
                "Unknown browser"}
              {" • "}
              {session.operating_system ||
                "Unknown OS"}
            </p>

            <div
              className="
                mt-3
                flex
                flex-wrap
                gap-x-5
                gap-y-2
                text-xs
                text-slate-500
              "
            >

              <span>
                IP:{" "}
                <span className="text-slate-400">
                  {session.ip_address ||
                    "Unknown"}
                </span>
              </span>

              {session.location && (
                <span>
                  Location:{" "}
                  <span className="text-slate-400">
                    {session.location}
                  </span>
                </span>
              )}

            </div>

          </div>

        </div>

        {/* SESSION INFO */}

        <div
          className="
            flex
            flex-col
            gap-3
            lg:min-w-[300px]
            lg:items-end
          "
        >

          <div
            className="
              text-left
              lg:text-right
            "
          >

            <p
              className="
                text-[11px]
                font-semibold
                uppercase
                tracking-wider
                text-slate-600
              "
            >
              Last Active
            </p>

            <p
              className="
                mt-1
                text-sm
                text-slate-400
              "
            >
              {formatDate(
                session.last_active
              )}
            </p>

          </div>

          <div
            className="
              flex
              flex-wrap
              items-center
              gap-3
            "
          >

            <span
              className="
                rounded-lg
                border
                border-emerald-500/20
                bg-emerald-500/10
                px-3
                py-1.5
                text-xs
                font-medium
                text-emerald-400
              "
            >
              Active
            </span>

            {!current && (
              <button
                type="button"
                onClick={onRevoke}
                disabled={revoking}
                className="
                  rounded-lg
                  border
                  border-red-500/20
                  bg-red-500/[0.05]
                  px-3.5
                  py-2
                  text-xs
                  font-semibold
                  text-red-400
                  transition
                  hover:border-red-500/30
                  hover:bg-red-500/10
                  hover:text-red-300
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >
                {revoking
                  ? "Revoking..."
                  : "Revoke"}
              </button>
            )}

          </div>

        </div>

      </div>

    </div>
  );
}


// ============================================================
// SESSION SKELETON
// ============================================================

function SessionSkeleton() {
  return (
    <div
      className="
        animate-pulse
        rounded-2xl
        border
        border-white/10
        bg-slate-900/70
        p-5
      "
    >

      <div className="flex gap-4">

        <div
          className="
            h-14
            w-14
            rounded-2xl
            bg-white/[0.06]
          "
        />

        <div className="flex-1 space-y-3">

          <div
            className="
              h-4
              w-40
              rounded
              bg-white/[0.06]
            "
          />

          <div
            className="
              h-3
              w-56
              rounded
              bg-white/[0.05]
            "
          />

          <div
            className="
              h-3
              w-72
              rounded
              bg-white/[0.04]
            "
          />

        </div>

      </div>

    </div>
  );
}


// ============================================================
// DEVICE ICON
// ============================================================

function getDeviceIcon(
  device: string
) {
  const value =
    device.toLowerCase();

  if (
    value.includes("mobile") ||
    value.includes("phone") ||
    value.includes("android") ||
    value.includes("iphone")
  ) {
    return "📱";
  }

  if (
    value.includes("tablet") ||
    value.includes("ipad")
  ) {
    return "📲";
  }

  if (
    value.includes("mac") ||
    value.includes("laptop")
  ) {
    return "💻";
  }

  return "🖥️";
}