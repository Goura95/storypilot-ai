"use client";

import {
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import { useRouter } from "next/navigation";

import {
  getAnalytics,
  type AnalyticsResponse,
} from "@/services/analyticsService";

import { changePassword } from "@/services/authService";

import {
  getProfile,
  updateProfile,
  type ProfileResponse,
  type ProfileUpdateRequest,
} from "@/services/profileService";

// ============================================================
// API
// ============================================================

const API_BASE_URL = "http://127.0.0.1:8000";

// ============================================================
// TYPES
// ============================================================

interface StoredUser {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
}

interface EditableProfile {
  first_name: string;
  last_name: string;
  email: string;
}

interface ChangePasswordForm {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

interface MFAStatusResponse {
  success?: boolean;
  enabled?: boolean;
  mfa_enabled?: boolean;
  message?: string;
}

interface APIErrorDetail {
  loc?: unknown;
  msg?: unknown;
  type?: unknown;
  input?: unknown;
}

interface APIErrorResponse {
  detail?: string | APIErrorDetail[] | APIErrorDetail | unknown;
  message?: string;
  success?: boolean;
}

// ============================================================
// TYPE GUARDS
// ============================================================

function isStoredUser(value: unknown): value is StoredUser {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const user = value as Record<string, unknown>;

  return (
    typeof user.id === "number" &&
    typeof user.first_name === "string" &&
    typeof user.last_name === "string" &&
    typeof user.email === "string"
  );
}

// ============================================================
// API ERROR MESSAGE
// ============================================================

function getAPIErrorMessage(
  value: unknown,
  fallback: string
): string {
  if (typeof value !== "object" || value === null) {
    return fallback;
  }

  const data = value as APIErrorResponse;

  if (
    typeof data.message === "string" &&
    data.message.trim()
  ) {
    return data.message;
  }

  if (
    typeof data.detail === "string" &&
    data.detail.trim()
  ) {
    return data.detail;
  }

  if (Array.isArray(data.detail)) {
    const messages = data.detail
      .map((item) => {
        if (
          typeof item === "object" &&
          item !== null
        ) {
          const detail = item as APIErrorDetail;

          if (typeof detail.msg === "string") {
            return detail.msg;
          }
        }

        return "";
      })
      .filter(Boolean);

    if (messages.length > 0) {
      return messages.join(". ");
    }
  }

  if (
    typeof data.detail === "object" &&
    data.detail !== null &&
    !Array.isArray(data.detail)
  ) {
    const detail = data.detail as APIErrorDetail;

    if (typeof detail.msg === "string") {
      return detail.msg;
    }
  }

  return fallback;
}

// ============================================================
// LOCAL STORAGE SUBSCRIPTION
// ============================================================

function subscribeToUser(
  callback: () => void
): () => void {
  window.addEventListener(
    "storage",
    callback
  );

  window.addEventListener(
    "storypilot-user-updated",
    callback
  );

  return () => {
    window.removeEventListener(
      "storage",
      callback
    );

    window.removeEventListener(
      "storypilot-user-updated",
      callback
    );
  };
}

function getUserSnapshot(): string | null {
  return window.localStorage.getItem("user");
}

function getServerUserSnapshot(): string | null {
  return null;
}

// ============================================================
// PARSE STORED USER
// ============================================================

function parseStoredUser(
  storedValue: string | null
): StoredUser | null {
  if (!storedValue) {
    return null;
  }

  try {
    const parsedUser: unknown =
      JSON.parse(storedValue);

    return isStoredUser(parsedUser)
      ? parsedUser
      : null;
  } catch (error) {
    console.error(
      "Failed to parse stored user:",
      error
    );

    return null;
  }
}

// ============================================================
// DEFAULT PROFILE
// ============================================================

function getProfileFromUser(
  storedUser: StoredUser | null
): EditableProfile {
  if (!storedUser) {
    return {
      first_name: "",
      last_name: "",
      email: "",
    };
  }

  return {
    first_name: storedUser.first_name,
    last_name: storedUser.last_name,
    email: storedUser.email,
  };
}

// ============================================================
// PAGE
// ============================================================

export default function ProfilePage() {
  const router = useRouter();

  // ==========================================================
  // STORED USER
  // ==========================================================

  const storedUserValue =
    useSyncExternalStore(
      subscribeToUser,
      getUserSnapshot,
      getServerUserSnapshot
    );

  const user = useMemo(
    () =>
      parseStoredUser(
        storedUserValue
      ),
    [storedUserValue]
  );

  // ==========================================================
  // PROFILE DRAFT
  // ==========================================================

  const [
    profileDraft,
    setProfileDraft,
  ] = useState<EditableProfile | null>(
    null
  );

  const profile =
    profileDraft ??
    getProfileFromUser(user);

  // ==========================================================
  // ANALYTICS
  // ==========================================================

  const [
    analytics,
    setAnalytics,
  ] = useState<AnalyticsResponse | null>(
    null
  );

  const [
    analyticsLoading,
    setAnalyticsLoading,
  ] = useState(true);

  // ==========================================================
  // PROFILE UI
  // ==========================================================

  const [saved, setSaved] =
    useState(false);

  const [error, setError] =
    useState("");

  const [profileSaving, setProfileSaving] =
    useState(false);

  // ==========================================================
  // MFA STATE
  // ==========================================================

  const [
    mfaEnabled,
    setMfaEnabled,
  ] = useState(false);

  const [
    mfaLoading,
    setMfaLoading,
  ] = useState(true);

  const [
    mfaActionLoading,
    setMfaActionLoading,
  ] = useState(false);

  const [
    mfaError,
    setMfaError,
  ] = useState("");

  const [
    mfaSuccess,
    setMfaSuccess,
  ] = useState("");

  // ==========================================================
  // CHANGE PASSWORD
  // ==========================================================

  const [
    showPasswordModal,
    setShowPasswordModal,
  ] = useState(false);

  const [
    passwordForm,
    setPasswordForm,
  ] = useState<ChangePasswordForm>({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  const [
    passwordLoading,
    setPasswordLoading,
  ] = useState(false);

  const [
    passwordError,
    setPasswordError,
  ] = useState("");

  const [
    passwordSuccess,
    setPasswordSuccess,
  ] = useState("");

  // ==========================================================
  // AUTHENTICATION CHECK
  // ==========================================================

  useEffect(() => {
    const token =
      window.localStorage.getItem(
        "token"
      );

    if (!token) {
      router.push("/login");
    }
  }, [router]);

  // ==========================================================
  // LOAD PROFILE FROM BACKEND
  // ==========================================================

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      const token =
        window.localStorage.getItem(
          "token"
        );

      if (!token) {
        return;
      }

      try {
        const response =
          await getProfile();

        if (cancelled) {
          return;
        }

        if (!response) {
          return;
        }

        const backendUser: StoredUser = {
          id: response.id,
          first_name: response.first_name,
          last_name: response.last_name,
          email: response.email,
        };

        window.localStorage.setItem(
          "user",
          JSON.stringify(backendUser)
        );

        setProfileDraft({
          first_name:
            response.first_name,
          last_name:
            response.last_name,
          email:
            response.email,
        });

        window.dispatchEvent(
          new Event(
            "storypilot-user-updated"
          )
        );
      } catch (profileError) {
        console.error(
          "Failed to load profile:",
          profileError
        );
      }
    }

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, []);

  // ==========================================================
  // LOAD ANALYTICS
  // ==========================================================

  useEffect(() => {
    let cancelled = false;

    async function loadAnalytics() {
      try {
        setAnalyticsLoading(true);

        const data =
          await getAnalytics();

        if (!cancelled) {
          setAnalytics(data);
        }
      } catch (analyticsError) {
        console.error(
          "Failed to load profile analytics:",
          analyticsError
        );

        if (!cancelled) {
          setAnalytics(null);
        }
      } finally {
        if (!cancelled) {
          setAnalyticsLoading(false);
        }
      }
    }

    void loadAnalytics();

    return () => {
      cancelled = true;
    };
  }, []);

  // ==========================================================
  // LOAD MFA STATUS
  // ==========================================================

  useEffect(() => {
    let cancelled = false;

    async function loadMFAStatus() {
      const token =
        window.localStorage.getItem(
          "token"
        );

      if (!token) {
        if (!cancelled) {
          setMfaLoading(false);
        }

        return;
      }

      try {
        setMfaLoading(true);
        setMfaError("");

        const response =
          await fetch(
            `${API_BASE_URL}/api/auth/mfa/status`,
            {
              method: "GET",
              headers: {
                Accept:
                  "application/json",
                Authorization:
                  `Bearer ${token}`,
              },
            }
          );

        const data: unknown =
          await response.json();

        if (!response.ok) {
          throw new Error(
            getAPIErrorMessage(
              data,
              "Unable to load MFA status."
            )
          );
        }

        if (
          typeof data !== "object" ||
          data === null
        ) {
          throw new Error(
            "Invalid MFA status response."
          );
        }

        const status =
          data as MFAStatusResponse;

        const enabled =
          status.mfa_enabled ??
          status.enabled ??
          false;

        if (!cancelled) {
          setMfaEnabled(
            Boolean(enabled)
          );
        }
      } catch (mfaStatusError) {
        console.error(
          "Failed to load MFA status:",
          mfaStatusError
        );

        if (!cancelled) {
          setMfaError(
            mfaStatusError instanceof Error
              ? mfaStatusError.message
              : "Unable to load MFA status."
          );
        }
      } finally {
        if (!cancelled) {
          setMfaLoading(false);
        }
      }
    }

    void loadMFAStatus();

    return () => {
      cancelled = true;
    };
  }, []);

  // ==========================================================
  // UPDATE PROFILE DRAFT
  // ==========================================================

  const updateProfileDraft = (
    changes: Partial<EditableProfile>
  ) => {
    setProfileDraft(
      (current) => ({
        ...(current ?? profile),
        ...changes,
      })
    );

    setSaved(false);
    setError("");
  };

  // ==========================================================
  // SAVE PROFILE
  // ==========================================================

  const handleSave = async () => {
    setError("");
    setSaved(false);

    if (!user) {
      setError(
        "Unable to save profile. User information was not found."
      );

      return;
    }

    const firstName =
      profile.first_name.trim();

    const lastName =
      profile.last_name.trim();

    const email =
      profile.email.trim().toLowerCase();

    if (!firstName) {
      setError(
        "First name is required."
      );

      return;
    }

    if (!lastName) {
      setError(
        "Last name is required."
      );

      return;
    }

    if (!email) {
      setError(
        "Email address is required."
      );

      return;
    }

    const token =
      window.localStorage.getItem(
        "token"
      );

    if (!token) {
      router.push("/login");
      return;
    }

    try {
      setProfileSaving(true);

      const requestData: ProfileUpdateRequest = {
        first_name: firstName,
        last_name: lastName,
        email: email,
      };

      const updatedProfile: ProfileResponse =
        await updateProfile(
          requestData
        );

      // --------------------------------------------------------
      // UPDATE LOCAL STORAGE
      // --------------------------------------------------------

      const updatedUser: StoredUser = {
        id: updatedProfile.id,
        first_name:
          updatedProfile.first_name,
        last_name:
          updatedProfile.last_name,
        email:
          updatedProfile.email,
      };

      window.localStorage.setItem(
        "user",
        JSON.stringify(updatedUser)
      );

      // --------------------------------------------------------
      // UPDATE LOCAL DRAFT
      // --------------------------------------------------------

      setProfileDraft({
        first_name:
          updatedProfile.first_name,
        last_name:
          updatedProfile.last_name,
        email:
          updatedProfile.email,
      });

      // --------------------------------------------------------
      // NOTIFY OTHER COMPONENTS
      // --------------------------------------------------------

      window.dispatchEvent(
        new Event(
          "storypilot-user-updated"
        )
      );

      setSaved(true);

      window.setTimeout(() => {
        setSaved(false);
      }, 2500);
    } catch (saveError) {
      console.error(
        "Failed to save profile:",
        saveError
      );

      if (
        saveError &&
        typeof saveError === "object" &&
        "response" in saveError
      ) {
        const axiosError =
          saveError as {
            response?: {
              data?: unknown;
            };
          };

        setError(
          getAPIErrorMessage(
            axiosError.response?.data,
            "Unable to update profile."
          )
        );
      } else {
        setError(
          saveError instanceof Error
            ? saveError.message
            : "Unable to update profile. Please check that the backend is running."
        );
      }
    } finally {
      setProfileSaving(false);
    }
  };

  // ==========================================================
  // ENABLE MFA
  // ==========================================================

  const handleEnableMFA = async () => {
    const token =
      window.localStorage.getItem(
        "token"
      );

    if (!token) {
      router.push("/login");
      return;
    }

    setMfaError("");
    setMfaSuccess("");

    try {
      setMfaActionLoading(true);

      const response =
        await fetch(
          `${API_BASE_URL}/api/auth/mfa/enable`,
          {
            method: "POST",
            headers: {
              Accept:
                "application/json",
              "Content-Type":
                "application/json",
              Authorization:
                `Bearer ${token}`,
            },
          }
        );

      const data: unknown =
        await response.json();

      if (!response.ok) {
        setMfaError(
          getAPIErrorMessage(
            data,
            "Unable to enable two-factor authentication."
          )
        );

        return;
      }

      if (
        typeof data !== "object" ||
        data === null
      ) {
        setMfaError(
          "Invalid response from MFA service."
        );

        return;
      }

      const result =
        data as MFAStatusResponse;

      if (
        result.success === false
      ) {
        setMfaError(
          result.message ||
            "Unable to enable two-factor authentication."
        );

        return;
      }

      setMfaEnabled(true);

      setMfaSuccess(
        result.message ||
          "MFA enabled successfully."
      );
    } catch (enableError) {
      console.error(
        "Enable MFA error:",
        enableError
      );

      setMfaError(
        enableError instanceof Error
          ? enableError.message
          : "Unable to enable two-factor authentication."
      );
    } finally {
      setMfaActionLoading(false);
    }
  };

  // ==========================================================
  // DISABLE MFA
  // ==========================================================

  const handleDisableMFA = async () => {
    const token =
      window.localStorage.getItem(
        "token"
      );

    if (!token) {
      router.push("/login");
      return;
    }

    setMfaError("");
    setMfaSuccess("");

    try {
      setMfaActionLoading(true);

      const response =
        await fetch(
          `${API_BASE_URL}/api/auth/mfa/disable`,
          {
            method: "POST",
            headers: {
              Accept:
                "application/json",
              "Content-Type":
                "application/json",
              Authorization:
                `Bearer ${token}`,
            },
          }
        );

      const data: unknown =
        await response.json();

      if (!response.ok) {
        setMfaError(
          getAPIErrorMessage(
            data,
            "Unable to disable two-factor authentication."
          )
        );

        return;
      }

      if (
        typeof data !== "object" ||
        data === null
      ) {
        setMfaError(
          "Invalid response from MFA service."
        );

        return;
      }

      const result =
        data as MFAStatusResponse;

      if (
        result.success === false
      ) {
        setMfaError(
          result.message ||
            "Unable to disable two-factor authentication."
        );

        return;
      }

      setMfaEnabled(false);

      setMfaSuccess(
        result.message ||
          "MFA disabled successfully."
      );
    } catch (disableError) {
      console.error(
        "Disable MFA error:",
        disableError
      );

      setMfaError(
        disableError instanceof Error
          ? disableError.message
          : "Unable to disable two-factor authentication."
      );
    } finally {
      setMfaActionLoading(false);
    }
  };

  // ==========================================================
  // OPEN PASSWORD MODAL
  // ==========================================================

  const openPasswordModal = () => {
    setPasswordForm({
      current_password: "",
      new_password: "",
      confirm_password: "",
    });

    setPasswordError("");
    setPasswordSuccess("");
    setShowPasswordModal(true);
  };

  // ==========================================================
  // CLOSE PASSWORD MODAL
  // ==========================================================

  const closePasswordModal = () => {
    if (passwordLoading) {
      return;
    }

    setShowPasswordModal(false);

    setPasswordForm({
      current_password: "",
      new_password: "",
      confirm_password: "",
    });

    setPasswordError("");
    setPasswordSuccess("");
  };

  // ==========================================================
  // CHANGE PASSWORD
  // ==========================================================

  const handleChangePassword =
    async () => {
      setPasswordError("");
      setPasswordSuccess("");

      const currentPassword =
        passwordForm.current_password.trim();

      const newPassword =
        passwordForm.new_password;

      const confirmPassword =
        passwordForm.confirm_password;

      if (!currentPassword) {
        setPasswordError(
          "Please enter your current password."
        );

        return;
      }

      if (!newPassword) {
        setPasswordError(
          "Please enter your new password."
        );

        return;
      }

      if (!confirmPassword) {
        setPasswordError(
          "Please confirm your new password."
        );

        return;
      }

      if (newPassword.length < 8) {
        setPasswordError(
          "New password must contain at least 8 characters."
        );

        return;
      }

      if (
        newPassword !==
        confirmPassword
      ) {
        setPasswordError(
          "New password and confirm password do not match."
        );

        return;
      }

      if (
        currentPassword ===
        newPassword
      ) {
        setPasswordError(
          "New password must be different from the current password."
        );

        return;
      }

      const token =
        window.localStorage.getItem(
          "token"
        );

      if (!token) {
        setPasswordError(
          "Your session has expired. Please sign in again."
        );

        router.push("/login");

        return;
      }

      try {
        setPasswordLoading(true);

        const response =
          await changePassword({
            current_password:
              currentPassword,
            new_password:
              newPassword,
            confirm_password:
              confirmPassword,
          });

        if (!response.success) {
          setPasswordError(
            response.message ||
              "Unable to change password."
          );

          return;
        }

        setPasswordSuccess(
          response.message ||
            "Password changed successfully."
        );

        setPasswordForm({
          current_password: "",
          new_password: "",
          confirm_password: "",
        });

        window.setTimeout(() => {
          setShowPasswordModal(false);
          setPasswordSuccess("");
        }, 1800);
      } catch (changePasswordError) {
        console.error(
          "Change password error:",
          changePasswordError
        );

        setPasswordError(
          "Unable to change password. Please try again."
        );
      } finally {
        setPasswordLoading(false);
      }
    };

  // ==========================================================
  // SIGN OUT
  // ==========================================================

  const handleSignOut = () => {
    window.localStorage.removeItem(
      "token"
    );

    window.localStorage.removeItem(
      "token_type"
    );

    window.localStorage.removeItem(
      "user"
    );

    window.dispatchEvent(
      new Event(
        "storypilot-user-updated"
      )
    );

    router.push("/login");
  };

  // ==========================================================
  // USER DISPLAY DATA
  // ==========================================================

  const firstName =
    profile.first_name.trim();

  const lastName =
    profile.last_name.trim();

  const fullName =
    `${firstName} ${lastName}`.trim() ||
    "StoryPilot User";

  const initials =
    getInitials(fullName);

  const email =
    profile.email ||
    user?.email ||
    "No email available";

  // ==========================================================
  // ANALYTICS
  // ==========================================================

  const totalStories =
    analytics?.total_stories ?? 0;

  const totalStoryPoints =
    analytics?.total_story_points ?? 0;

  // ==========================================================
  // PAGE
  // ==========================================================

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950">
      <Background />

      <main className="relative min-h-screen w-full px-5 py-6 sm:px-8 lg:px-10 xl:px-14">
        <div className="mx-auto w-full max-w-[1500px]">

          {/* HEADER */}

          <div className="flex flex-col justify-between gap-5 border-b border-white/10 pb-6 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-purple-400">
                StoryPilot AI
              </p>

              <h1 className="mt-2 text-3xl font-bold tracking-tight text-white md:text-4xl">
                Profile
              </h1>

              <p className="mt-2 text-sm text-slate-400">
                Manage your account information
                and security.
              </p>
            </div>
          </div>

          {/* ERROR */}

          {error && (
            <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/[0.05] px-5 py-4 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* PROFILE IDENTITY */}

          <section className="mt-8 overflow-hidden rounded-3xl border border-white/10 bg-slate-900/70 shadow-xl shadow-black/10">
            <div className="relative p-6 sm:p-8">

              <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-purple-600/[0.08] blur-3xl" />

              <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">

                <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-purple-500 to-blue-600 text-3xl font-bold text-white shadow-lg shadow-purple-500/20">
                  {initials}
                </div>

                <div className="min-w-0 flex-1">

                  <div className="flex flex-wrap items-center gap-3">

                    <h2 className="text-2xl font-bold text-white">
                      {fullName}
                    </h2>

                    <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
                      Active
                    </span>

                  </div>

                  <p className="mt-1 text-sm text-slate-400">
                    {email}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">

                    <span className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-slate-400">
                      User
                    </span>

                    <span className="rounded-lg border border-purple-500/20 bg-purple-500/10 px-3 py-1.5 text-xs font-medium text-purple-300">
                      StoryPilot AI
                    </span>

                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* MAIN GRID */}

          <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(360px,0.9fr)]">

            {/* PERSONAL INFORMATION */}

            <ProfileCard
              title="Personal Information"
              description="Update the information associated with your StoryPilot AI account."
            >
              <div className="grid gap-5 sm:grid-cols-2">

                <InputField
                  label="First Name"
                  value={
                    profile.first_name
                  }
                  onChange={(value) =>
                    updateProfileDraft({
                      first_name: value,
                    })
                  }
                />

                <InputField
                  label="Last Name"
                  value={
                    profile.last_name
                  }
                  onChange={(value) =>
                    updateProfileDraft({
                      last_name: value,
                    })
                  }
                />

                <InputField
                  label="Email Address"
                  value={
                    profile.email
                  }
                  onChange={(value) =>
                    updateProfileDraft({
                      email: value,
                    })
                  }
                  type="email"
                />

              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                <p
                  className={`text-sm transition ${
                    saved
                      ? "text-emerald-400"
                      : "text-transparent"
                  }`}
                >
                  Changes saved successfully.
                </p>

                <button
                  type="button"
                  disabled={profileSaving}
                  onClick={handleSave}
                  className="rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-500/20 transition hover:scale-[1.01] hover:shadow-purple-500/30 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {profileSaving
                    ? "Saving..."
                    : "Save Changes"}
                </button>

              </div>
            </ProfileCard>

            {/* ACCOUNT OVERVIEW */}

            <ProfileCard
              title="Account Overview"
              description="A summary of your StoryPilot AI account."
            >
              <div className="space-y-3">

                <InfoRow
                  label="Account Status"
                  value="Active"
                  valueClass="text-emerald-400"
                />

                <InfoRow
                  label="Current Plan"
                  value="Free"
                  valueClass="text-purple-400"
                />

                <InfoRow
                  label="Account ID"
                  value={
                    user?.id
                      ? String(user.id)
                      : "—"
                  }
                />

                <InfoRow
                  label="Role"
                  value="User"
                />

                <InfoRow
                  label="Authentication"
                  value="JWT"
                  valueClass="text-blue-400"
                />

              </div>
            </ProfileCard>
          </div>

          {/* USAGE */}

          <section className="mt-6 rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-xl shadow-black/10 sm:p-7">

            <div>
              <h2 className="text-xl font-bold text-white">
                Usage Overview
              </h2>

              <p className="mt-1.5 text-sm text-slate-500">
                Your current StoryPilot AI usage.
              </p>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

              <UsageCard
                label="Stories Generated"
                value={
                  analyticsLoading
                    ? "..."
                    : formatNumber(
                        totalStories
                      )
                }
                description="Total user stories"
              />

              <UsageCard
                label="Story Points"
                value={
                  analyticsLoading
                    ? "..."
                    : formatNumber(
                        totalStoryPoints
                      )
                }
                description="Total estimated effort"
              />

              <UsageCard
                label="Current Plan"
                value="Free"
                description="Account subscription"
              />

            </div>
          </section>

          {/* SECURITY */}

          <div className="mt-6">

            <ProfileCard
              title="Security"
              description="Manage your account security."
            >
              <div className="space-y-3">

                <SecurityItem
                  title="Password"
                  description="Keep your account password secure."
                  action="Change"
                  onClick={
                    openPasswordModal
                  }
                />

                <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">

                  <div className="flex items-center justify-between gap-4">

                    <div className="min-w-0">

                      <div className="flex flex-wrap items-center gap-2">

                        <p className="text-sm font-semibold text-slate-200">
                          Two-Factor Authentication
                        </p>

                        {mfaLoading ? (
                          <span className="rounded-full border border-slate-500/20 bg-slate-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                            Checking...
                          </span>
                        ) : mfaEnabled ? (
                          <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-400">
                            Enabled
                          </span>
                        ) : (
                          <span className="rounded-full border border-slate-500/20 bg-slate-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                            Disabled
                          </span>
                        )}

                      </div>

                      <p className="mt-1 text-xs leading-5 text-slate-600">
                        Add an extra layer of security to your account.
                      </p>

                    </div>

                    {!mfaLoading && (
                      <button
                        type="button"
                        disabled={
                          mfaActionLoading
                        }
                        onClick={
                          mfaEnabled
                            ? handleDisableMFA
                            : handleEnableMFA
                        }
                        className={
                          mfaEnabled
                            ? "shrink-0 rounded-lg border border-red-500/20 bg-red-500/10 px-3.5 py-2 text-xs font-semibold text-red-400 transition hover:border-red-500/30 hover:bg-red-500/15 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
                            : "shrink-0 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-2 text-xs font-semibold text-emerald-400 transition hover:border-emerald-500/30 hover:bg-emerald-500/15 hover:text-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
                        }
                      >
                        {mfaActionLoading
                          ? mfaEnabled
                            ? "Disabling..."
                            : "Enabling..."
                          : mfaEnabled
                            ? "Disable"
                            : "Enable"}
                      </button>
                    )}

                  </div>

                  {mfaError && (
                    <div className="mt-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs text-red-400">
                      {mfaError}
                    </div>
                  )}

                  {mfaSuccess && (
                    <div className="mt-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-400">
                      {mfaSuccess}
                    </div>
                  )}

                </div>

                <SecurityItem
                  title="Active Sessions"
                  description="Review devices currently signed in."
                  action="View"
                  onClick={() => {
                    router.push(
                      "/dashboard/profile/active-sessions"
                    );
                  }}
                />

              </div>
            </ProfileCard>

          </div>

          {/* ACCOUNT ACTIONS */}

          <section className="mt-6 rounded-3xl border border-red-500/10 bg-red-500/[0.03] p-6 sm:p-7">

            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">

              <div>
                <h2 className="text-lg font-bold text-white">
                  Account Actions
                </h2>

                <p className="mt-1.5 text-sm text-slate-500">
                  Manage your StoryPilot AI session.
                </p>
              </div>

              <button
                type="button"
                onClick={
                  handleSignOut
                }
                className="w-fit rounded-xl border border-red-500/20 bg-red-500/10 px-5 py-2.5 text-sm font-semibold text-red-400 transition hover:border-red-500/30 hover:bg-red-500/15 hover:text-red-300"
              >
                Sign Out
              </button>

            </div>
          </section>

          {/* FOOTER */}

          <div className="mt-8 border-t border-white/5 py-6">
            <p className="text-xs text-slate-600">
              StoryPilot AI Profile
            </p>
          </div>

        </div>
      </main>

      {/* CHANGE PASSWORD MODAL */}

      {showPasswordModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closePasswordModal();
            }
          }}
        >
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl shadow-black/40 sm:p-7">

            <div className="flex items-start justify-between gap-4">

              <div>
                <h2 className="text-xl font-bold text-white">
                  Change Password
                </h2>

                <p className="mt-1.5 text-sm leading-5 text-slate-500">
                  Update your StoryPilot AI account password.
                </p>
              </div>

              <button
                type="button"
                disabled={
                  passwordLoading
                }
                onClick={
                  closePasswordModal
                }
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-lg text-slate-500 transition hover:bg-white/[0.05] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Close"
              >
                ×
              </button>

            </div>

            {passwordError && (
              <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {passwordError}
              </div>
            )}

            {passwordSuccess && (
              <div className="mt-5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
                {passwordSuccess}
              </div>
            )}

            <div className="mt-6 space-y-5">

              <PasswordInput
                label="Current Password"
                value={
                  passwordForm.current_password
                }
                onChange={(value) =>
                  setPasswordForm(
                    (current) => ({
                      ...current,
                      current_password:
                        value,
                    })
                  )
                }
                disabled={
                  passwordLoading
                }
              />

              <PasswordInput
                label="New Password"
                value={
                  passwordForm.new_password
                }
                onChange={(value) =>
                  setPasswordForm(
                    (current) => ({
                      ...current,
                      new_password:
                        value,
                    })
                  )
                }
                disabled={
                  passwordLoading
                }
              />

              <PasswordInput
                label="Confirm New Password"
                value={
                  passwordForm.confirm_password
                }
                onChange={(value) =>
                  setPasswordForm(
                    (current) => ({
                      ...current,
                      confirm_password:
                        value,
                    })
                  )
                }
                disabled={
                  passwordLoading
                }
              />

            </div>

            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

              <button
                type="button"
                disabled={
                  passwordLoading
                }
                onClick={
                  closePasswordModal
                }
                className="rounded-xl border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={
                  passwordLoading
                }
                onClick={
                  handleChangePassword
                }
                className="rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-500/20 transition hover:from-purple-400 hover:to-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {passwordLoading
                  ? "Changing..."
                  : "Change Password"}
              </button>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}

// ============================================================
// PROFILE CARD
// ============================================================

function ProfileCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-xl shadow-black/10 sm:p-7">

      <div>
        <h2 className="text-xl font-bold text-white">
          {title}
        </h2>

        <p className="mt-1.5 text-sm leading-6 text-slate-500">
          {description}
        </p>
      </div>

      <div className="mt-6">
        {children}
      </div>

    </section>
  );
}

// ============================================================
// INPUT FIELD
// ============================================================

function InputField({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-300">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        className="h-11 w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/10"
      />
    </div>
  );
}

// ============================================================
// PASSWORD INPUT
// ============================================================

function PasswordInput({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-300">
        {label}
      </label>

      <input
        type="password"
        value={value}
        disabled={disabled}
        autoComplete="new-password"
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        className="h-11 w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/10 disabled:cursor-not-allowed disabled:opacity-50"
      />
    </div>
  );
}

// ============================================================
// INFO ROW
// ============================================================

function InfoRow({
  label,
  value,
  valueClass = "text-slate-300",
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3">

      <span className="text-sm text-slate-500">
        {label}
      </span>

      <span
        className={`text-sm font-semibold ${valueClass}`}
      >
        {value}
      </span>

    </div>
  );
}

// ============================================================
// USAGE CARD
// ============================================================

function UsageCard({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5 transition hover:border-purple-500/20 hover:bg-white/[0.04]">

      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
        {label}
      </p>

      <p className="mt-3 text-2xl font-bold text-white">
        {value}
      </p>

      <p className="mt-1 text-xs text-slate-600">
        {description}
      </p>

    </div>
  );
}

// ============================================================
// SECURITY ITEM
// ============================================================

function SecurityItem({
  title,
  description,
  action,
  onClick,
}: {
  title: string;
  description: string;
  action: string;
  onClick: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/5 bg-white/[0.02] p-4">

      <div className="min-w-0">

        <p className="text-sm font-semibold text-slate-200">
          {title}
        </p>

        <p className="mt-1 text-xs leading-5 text-slate-600">
          {description}
        </p>

      </div>

      <button
        type="button"
        onClick={onClick}
        className="shrink-0 rounded-lg border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/[0.08] hover:text-white"
      >
        {action}
      </button>

    </div>
  );
}

// ============================================================
// BACKGROUND
// ============================================================

function Background() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">

      <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-purple-600/[0.08] blur-3xl" />

      <div className="absolute right-[-180px] top-40 h-[500px] w-[500px] rounded-full bg-blue-600/[0.07] blur-3xl" />

      <div className="absolute bottom-[-200px] left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-cyan-600/[0.04] blur-3xl" />

    </div>
  );
}

// ============================================================
// INITIALS
// ============================================================

function getInitials(
  name: string
): string {
  const words =
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean);

  if (!words.length) {
    return "SP";
  }

  if (words.length === 1) {
    return words[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
}

// ============================================================
// NUMBER FORMATTER
// ============================================================

function formatNumber(
  value: number
): string {
  return new Intl.NumberFormat(
    "en-US"
  ).format(
    Number.isFinite(value)
      ? value
      : 0
  );
}