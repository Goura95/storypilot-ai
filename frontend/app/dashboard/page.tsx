"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import AuthGuard from "@/components/auth/AuthGuard";
import DashboardHeader from "@/components/dashboard/DashboardHeader";

import {
  getAnalytics,
  type AnalyticsResponse,
} from "@/services/analyticsService";

export default function DashboardPage() {
  const [analytics, setAnalytics] =
    useState<AnalyticsResponse | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  // ============================================================
  // LOAD ANALYTICS
  // ============================================================

  useEffect(() => {
    let mounted = true;

    async function loadAnalytics() {
      try {
        setLoading(true);
        setError(null);

        const data = await getAnalytics();

        if (!mounted) {
          return;
        }

        setAnalytics(data);
      } catch (err) {
        console.error(
          "Failed to load dashboard analytics:",
          err
        );

        if (!mounted) {
          return;
        }

        setError(
          "Unable to load dashboard statistics."
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadAnalytics();

    return () => {
      mounted = false;
    };
  }, []);

  // ============================================================
  // CALCULATE DASHBOARD VALUES
  // ============================================================

  const totalStories =
    analytics?.total_stories ?? 0;

  // ------------------------------------------------------------
  // THIS MONTH
  // ------------------------------------------------------------

  const currentMonth = new Date()
    .toISOString()
    .slice(0, 7);

  const thisMonth =
    analytics?.stories_over_time
      ?.filter((item) =>
        item.date.startsWith(currentMonth)
      )
      .reduce(
        (total, item) =>
          total + item.count,
        0
      ) ?? 0;

  // ------------------------------------------------------------
  // AI GENERATED
  // ------------------------------------------------------------
  //
  // Currently StoryPilot AI generates every story through AI.
  // Therefore all stored stories are considered AI generated.
  //
  // In a future sprint, if you add manual/non-AI stories,
  // introduce a generated_by_ai column in the Story model.
  // ------------------------------------------------------------

  const aiGenerated = totalStories;

  // ------------------------------------------------------------
  // PRODUCTIVITY
  // ------------------------------------------------------------
  //
  // Current MVP definition:
  // If StoryPilot AI has generated stories, AI-assisted
  // productivity is considered 100%.
  //
  // This can be replaced with a real productivity calculation
  // in a future sprint.
  // ------------------------------------------------------------

  const productivity =
    totalStories > 0 ? 100 : 0;

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <AuthGuard>
      <div className="w-full px-6 py-8 lg:px-10">

        {/* ======================================================
            DASHBOARD HEADER
        ====================================================== */}

        <DashboardHeader />

        {/* ======================================================
            WELCOME SECTION
        ====================================================== */}

        <section className="mt-8 mb-8">
          <div
            className="
              relative
              w-full
              overflow-hidden
              rounded-3xl
              border
              border-white/10
              bg-gradient-to-br
              from-indigo-600/20
              via-purple-600/10
              to-cyan-500/10
              p-8
              shadow-2xl
              shadow-indigo-950/20
            "
          >

            {/* Background glow */}

            <div
              className="
                pointer-events-none
                absolute
                -right-20
                -top-20
                h-64
                w-64
                rounded-full
                bg-indigo-500/20
                blur-3xl
              "
            />

            <div
              className="
                pointer-events-none
                absolute
                -bottom-20
                left-1/3
                h-56
                w-56
                rounded-full
                bg-purple-500/10
                blur-3xl
              "
            />

            <div className="relative">

              {/* Badge */}

              <div
                className="
                  mb-4
                  inline-flex
                  items-center
                  gap-2
                  rounded-full
                  border
                  border-indigo-400/20
                  bg-indigo-500/10
                  px-4
                  py-2
                  text-xs
                  font-medium
                  text-indigo-300
                "
              >
                <span>✨</span>
                AI-Powered Workspace
              </div>

              {/* Heading */}

              <h1
                className="
                  text-3xl
                  font-bold
                  tracking-tight
                  sm:text-4xl
                "
              >
                Welcome to{" "}
                <span className="gradient-text">
                  StoryPilot AI
                </span>
              </h1>

              {/* Description */}

              <p
                className="
                  mt-4
                  max-w-3xl
                  text-sm
                  leading-7
                  text-slate-400
                  sm:text-base
                "
              >
                Your intelligent product management
                workspace for creating professional,
                production-ready user stories with
                Artificial Intelligence.
              </p>

              {/* Capabilities */}

              <div className="mt-6 flex flex-wrap gap-3">

                <div
                  className="
                    flex
                    items-center
                    gap-2
                    rounded-xl
                    border
                    border-white/10
                    bg-white/[0.03]
                    px-4
                    py-2.5
                    text-xs
                    text-slate-300
                  "
                >
                  <span className="text-green-400">
                    ✓
                  </span>
                  AI Generated
                </div>

                <div
                  className="
                    flex
                    items-center
                    gap-2
                    rounded-xl
                    border
                    border-white/10
                    bg-white/[0.03]
                    px-4
                    py-2.5
                    text-xs
                    text-slate-300
                  "
                >
                  <span className="text-blue-400">
                    ✓
                  </span>
                  Azure DevOps Ready
                </div>

                <div
                  className="
                    flex
                    items-center
                    gap-2
                    rounded-xl
                    border
                    border-white/10
                    bg-white/[0.03]
                    px-4
                    py-2.5
                    text-xs
                    text-slate-300
                  "
                >
                  <span className="text-purple-400">
                    ✓
                  </span>
                  Smart Test Cases
                </div>

                <div
                  className="
                    flex
                    items-center
                    gap-2
                    rounded-xl
                    border
                    border-white/10
                    bg-white/[0.03]
                    px-4
                    py-2.5
                    text-xs
                    text-slate-300
                  "
                >
                  <span className="text-cyan-400">
                    ✓
                  </span>
                  Word & PDF Export
                </div>

              </div>
            </div>
          </div>
        </section>

        {/* ======================================================
            DASHBOARD STATISTICS
        ====================================================== */}

        <section
          className="
            grid
            w-full
            grid-cols-1
            gap-4
            sm:grid-cols-2
            xl:grid-cols-4
          "
        >

          {/* ====================================================
              TOTAL STORIES
          ==================================================== */}

          <div className="dashboard-card w-full p-5">
            <div className="flex items-start justify-between">

              <div>
                <p
                  className="
                    text-xs
                    font-medium
                    uppercase
                    tracking-wider
                    text-slate-500
                  "
                >
                  Total Stories
                </p>

                <p
                  className="
                    mt-2
                    text-3xl
                    font-bold
                    text-white
                  "
                >
                  {loading ? "..." : totalStories}
                </p>

                <p
                  className="
                    mt-2
                    text-xs
                    text-slate-500
                  "
                >
                  Your generated stories
                </p>
              </div>

              <div
                className="
                  flex
                  h-11
                  w-11
                  items-center
                  justify-center
                  rounded-xl
                  bg-indigo-500/10
                  text-xl
                  text-indigo-300
                "
              >
                📚
              </div>

            </div>
          </div>

          {/* ====================================================
              THIS MONTH
          ==================================================== */}

          <div className="dashboard-card w-full p-5">
            <div className="flex items-start justify-between">

              <div>
                <p
                  className="
                    text-xs
                    font-medium
                    uppercase
                    tracking-wider
                    text-slate-500
                  "
                >
                  This Month
                </p>

                <p
                  className="
                    mt-2
                    text-3xl
                    font-bold
                    text-white
                  "
                >
                  {loading ? "..." : thisMonth}
                </p>

                <p
                  className="
                    mt-2
                    text-xs
                    text-slate-500
                  "
                >
                  Stories created this month
                </p>
              </div>

              <div
                className="
                  flex
                  h-11
                  w-11
                  items-center
                  justify-center
                  rounded-xl
                  bg-purple-500/10
                  text-xl
                  text-purple-300
                "
              >
                📈
              </div>

            </div>
          </div>

          {/* ====================================================
              AI GENERATED
          ==================================================== */}

          <div className="dashboard-card w-full p-5">
            <div className="flex items-start justify-between">

              <div>
                <p
                  className="
                    text-xs
                    font-medium
                    uppercase
                    tracking-wider
                    text-slate-500
                  "
                >
                  AI Generated
                </p>

                <p
                  className="
                    mt-2
                    text-3xl
                    font-bold
                    text-white
                  "
                >
                  {loading ? "..." : aiGenerated}
                </p>

                <p
                  className="
                    mt-2
                    text-xs
                    text-slate-500
                  "
                >
                  Stories generated with AI
                </p>
              </div>

              <div
                className="
                  flex
                  h-11
                  w-11
                  items-center
                  justify-center
                  rounded-xl
                  bg-pink-500/10
                  text-xl
                  text-pink-300
                "
              >
                🤖
              </div>

            </div>
          </div>

          {/* ====================================================
              PRODUCTIVITY
          ==================================================== */}

          <div className="dashboard-card w-full p-5">
            <div className="flex items-start justify-between">

              <div>
                <p
                  className="
                    text-xs
                    font-medium
                    uppercase
                    tracking-wider
                    text-slate-500
                  "
                >
                  Productivity
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
                    : `${productivity}%`}
                </p>

                <p
                  className="
                    mt-2
                    text-xs
                    text-slate-500
                  "
                >
                  AI-assisted productivity
                </p>
              </div>

              <div
                className="
                  flex
                  h-11
                  w-11
                  items-center
                  justify-center
                  rounded-xl
                  bg-cyan-500/10
                  text-xl
                  text-cyan-300
                "
              >
                🚀
              </div>

            </div>
          </div>

        </section>

        {/* ======================================================
            ERROR MESSAGE
        ====================================================== */}

        {error && (
          <div
            className="
              mt-4
              rounded-xl
              border
              border-red-500/20
              bg-red-500/10
              px-4
              py-3
              text-sm
              text-red-300
            "
          >
            {error}
          </div>
        )}

        {/* ======================================================
            QUICK ACTIONS
        ====================================================== */}

        <section className="mt-8 w-full">

          <div className="mb-5">

            <p
              className="
                text-xs
                font-semibold
                uppercase
                tracking-[0.2em]
                text-indigo-400
              "
            >
              Workspace
            </p>

            <h2
              className="
                mt-1
                text-2xl
                font-bold
                text-white
              "
            >
              What would you like to do?
            </h2>

            <p
              className="
                mt-2
                text-sm
                text-slate-500
              "
            >
              Choose an action to continue working
              with StoryPilot AI.
            </p>

          </div>

          <div
            className="
              grid
              w-full
              grid-cols-1
              gap-5
              md:grid-cols-2
            "
          >

            {/* ==================================================
                CREATE STORY
            ================================================== */}

            <Link
              href="/dashboard/create-story"
              className="
                group
                relative
                w-full
                overflow-hidden
                rounded-2xl
                border
                border-indigo-400/20
                bg-gradient-to-br
                from-indigo-600/20
                via-purple-600/10
                to-transparent
                p-6
                transition
                duration-300
                hover:-translate-y-1
                hover:border-indigo-400/40
                hover:shadow-xl
                hover:shadow-indigo-950/30
              "
            >

              <div
                className="
                  absolute
                  -right-10
                  -top-10
                  h-32
                  w-32
                  rounded-full
                  bg-indigo-500/10
                  blur-3xl
                  transition
                  group-hover:bg-indigo-500/20
                "
              />

              <div className="relative">

                <div
                  className="
                    mb-4
                    flex
                    h-12
                    w-12
                    items-center
                    justify-center
                    rounded-xl
                    bg-gradient-to-br
                    from-indigo-500
                    to-purple-600
                    text-xl
                    shadow-lg
                    shadow-indigo-500/20
                  "
                >
                  ✨
                </div>

                <h3
                  className="
                    text-xl
                    font-bold
                    text-white
                  "
                >
                  Create a Story
                </h3>

                <p
                  className="
                    mt-2
                    text-sm
                    leading-6
                    text-slate-400
                  "
                >
                  Turn your feature idea into a
                  complete AI-generated user story.
                </p>

                <div
                  className="
                    mt-5
                    text-sm
                    font-semibold
                    text-indigo-300
                  "
                >
                  Start Creating →
                </div>

              </div>
            </Link>

            {/* ==================================================
                MY STORIES
            ================================================== */}

            <Link
              href="/dashboard/stories"
              className="
                group
                relative
                w-full
                overflow-hidden
                rounded-2xl
                border
                border-cyan-400/20
                bg-gradient-to-br
                from-cyan-600/10
                via-blue-600/10
                to-transparent
                p-6
                transition
                duration-300
                hover:-translate-y-1
                hover:border-cyan-400/40
                hover:shadow-xl
                hover:shadow-cyan-950/30
              "
            >

              <div
                className="
                  absolute
                  -right-10
                  -top-10
                  h-32
                  w-32
                  rounded-full
                  bg-cyan-500/10
                  blur-3xl
                  transition
                  group-hover:bg-cyan-500/20
                "
              />

              <div className="relative">

                <div
                  className="
                    mb-4
                    flex
                    h-12
                    w-12
                    items-center
                    justify-center
                    rounded-xl
                    bg-gradient-to-br
                    from-cyan-500
                    to-blue-600
                    text-xl
                    shadow-lg
                    shadow-cyan-500/20
                  "
                >
                  📚
                </div>

                <h3
                  className="
                    text-xl
                    font-bold
                    text-white
                  "
                >
                  My Stories
                </h3>

                <p
                  className="
                    mt-2
                    text-sm
                    leading-6
                    text-slate-400
                  "
                >
                  View, download, and manage all
                  your generated stories.
                </p>

                <div
                  className="
                    mt-5
                    text-sm
                    font-semibold
                    text-cyan-300
                  "
                >
                  View Stories →
                </div>

              </div>
            </Link>

          </div>
        </section>

      </div>
    </AuthGuard>
  );
}