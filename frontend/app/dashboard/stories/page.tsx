"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import {
  getStories,
  StoryResponse,
} from "@/services/storyService";

export default function MyStoriesPage() {
  const [stories, setStories] = useState<StoryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [apiStatus, setApiStatus] = useState("checking");

  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [moduleFilter, setModuleFilter] = useState("All");

  // ==========================================================
  // CHECK API HEALTH
  // ==========================================================

  useEffect(() => {
    async function checkAPIHealth() {
      try {
        const apiUrl = "/api";
        console.log("API Base URL:", apiUrl);
        
        const response = await fetch(`${apiUrl}/health`);
        if (response.ok) {
          setApiStatus("connected");
          console.log("API Health Check: OK");
        } else {
          setApiStatus("error");
          console.error("API Health Check Failed:", response.status);
        }
      } catch (err) {
        setApiStatus("error");
        console.error("API Health Check Error:", err);
      }
    }

    checkAPIHealth();
  }, []);

  // ==========================================================
  // LOAD STORIES
  // ==========================================================

  useEffect(() => {
    async function loadStories() {
      try {
        setLoading(true);
        setError("");

        const data = await getStories();

        setStories(data);
      } catch (error) {
        console.error("Failed to load stories:", error);

        let errorMsg = "Unable to load your stories. Please try again.";

        if (error instanceof Error) {
          if (error.message.includes("Network error") || error.message.includes("Unable to reach")) {
            errorMsg = "Cannot connect to the server. Please ensure the API server is running.";
          } else if (error.message.includes("timeout")) {
            errorMsg = "Request timed out. The server took too long to respond.";
          } else if (error.message.includes("401") || error.message.includes("Unauthorized")) {
            errorMsg = "Your session has expired. Please login again.";
          } else {
            errorMsg = error.message;
          }
        }

        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    }

    loadStories();
  }, []);

  // ==========================================================
  // FILTER OPTIONS
  // ==========================================================

  const modules = useMemo(() => {
    const values = stories
      .map((story) => story.module)
      .filter(Boolean);

    return Array.from(new Set(values));
  }, [stories]);

  const priorities = useMemo(() => {
    const values = stories
      .map((story) => story.priority)
      .filter(Boolean);

    return Array.from(new Set(values));
  }, [stories]);

  // ==========================================================
  // FILTER STORIES
  // ==========================================================

  const filteredStories = useMemo(() => {
    const searchValue = search.toLowerCase().trim();

    return stories.filter((story) => {
      const matchesSearch =
        !searchValue ||
        story.title?.toLowerCase().includes(searchValue) ||
        story.feature_name
          ?.toLowerCase()
          .includes(searchValue) ||
        story.module
          ?.toLowerCase()
          .includes(searchValue) ||
        story.user_story
          ?.toLowerCase()
          .includes(searchValue);

      const matchesPriority =
        priorityFilter === "All" ||
        story.priority === priorityFilter;

      const matchesModule =
        moduleFilter === "All" ||
        story.module === moduleFilter;

      return (
        matchesSearch &&
        matchesPriority &&
        matchesModule
      );
    });
  }, [
    stories,
    search,
    priorityFilter,
    moduleFilter,
  ]);

  // ==========================================================
  // PRIORITY STYLE
  // ==========================================================

  function getPriorityStyle(priority: string) {
    const value = priority?.toLowerCase().trim();

    if (
      value === "high" ||
      value === "critical"
    ) {
      return "border-red-500/20 bg-red-500/10 text-red-300";
    }

    if (value === "medium") {
      return "border-amber-500/20 bg-amber-500/10 text-amber-300";
    }

    if (value === "low") {
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-300";
    }

    return "border-blue-500/20 bg-blue-500/10 text-blue-300";
  }

  // ==========================================================
  // STORY TYPE STYLE
  // ==========================================================

  function getStoryTypeStyle(storyType: string) {
    const value = storyType?.toLowerCase().trim();

    if (value.includes("bug")) {
      return "bg-red-500/10 text-red-300 border-red-500/20";
    }

    if (value.includes("task")) {
      return "bg-cyan-500/10 text-cyan-300 border-cyan-500/20";
    }

    if (value.includes("feature")) {
      return "bg-purple-500/10 text-purple-300 border-purple-500/20";
    }

    return "bg-indigo-500/10 text-indigo-300 border-indigo-500/20";
  }

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <div className="relative min-h-screen overflow-hidden p-8">
        {/* Background */}

        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-10 top-10 h-72 w-72 rounded-full bg-purple-600/10 blur-3xl" />

          <div className="absolute right-10 top-40 h-72 w-72 rounded-full bg-blue-600/10 blur-3xl" />
        </div>

        <div className="relative">
          <div className="h-10 w-56 animate-pulse rounded-xl bg-white/10" />

          <div className="mt-3 h-5 w-96 animate-pulse rounded-lg bg-white/5" />

          <div className="mt-8 h-16 animate-pulse rounded-2xl bg-white/5" />

          <div className="mt-6 space-y-5">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-48 animate-pulse rounded-3xl border border-white/5 bg-white/[0.03]"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================
  // ERROR
  // ==========================================================

  if (error) {
    const apiUrl = "/api (proxied to FastAPI)";

    return (
      <div className="relative min-h-screen p-8">
        <div className="rounded-3xl border border-red-500/20 bg-gradient-to-br from-red-500/10 to-purple-500/5 p-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-2xl">
            ⚠
          </div>

          <h1 className="mt-5 text-2xl font-bold text-white">
            Unable to Load Stories
          </h1>

          <p className="mt-2 text-sm text-red-300">
            {error}
          </p>

          {/* Debug Info */}
          <div className="mt-6 rounded-lg bg-slate-900/50 p-4 border border-slate-700">
            <p className="text-xs font-mono text-slate-400">
              <strong>Debug Info:</strong><br />
              API URL: {apiUrl}<br />
              API Status: {apiStatus}<br />
              Token: {typeof window !== "undefined" && localStorage.getItem("token") ? "Present" : "Missing"}
            </p>
          </div>

          <button
            onClick={() => window.location.reload()}
            className="mt-6 rounded-lg bg-blue-600 hover:bg-blue-700 px-6 py-3 text-white font-medium"
          >
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  // ==========================================================
  // PAGE
  // ==========================================================

  return (
    <div className="relative min-h-screen overflow-hidden p-6 md:p-8">
      {/* ======================================================
          BACKGROUND EFFECTS
          ====================================================== */}

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 top-0 h-96 w-96 rounded-full bg-purple-600/10 blur-3xl" />

        <div className="absolute right-0 top-32 h-96 w-96 rounded-full bg-blue-600/10 blur-3xl" />

        <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-cyan-500/5 blur-3xl" />
      </div>

      <div className="relative">
        {/* ====================================================
            HEADER
            ==================================================== */}

        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <div className="flex items-center gap-3">
              <div
                className="
                  flex
                  h-12
                  w-12
                  items-center
                  justify-center
                  rounded-2xl
                  bg-gradient-to-br
                  from-purple-500
                  via-indigo-500
                  to-blue-500
                  text-xl
                  shadow-lg
                  shadow-purple-500/20
                "
              >
                ✦
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-purple-400">
                  StoryPilot AI
                </p>

                <h1 className="mt-1 text-3xl font-bold text-white md:text-4xl">
                  My Stories
                </h1>
              </div>
            </div>

            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-400">
              Manage, review, and explore your
              AI-generated user stories in one place.
            </p>
          </div>

          {/* CREATE BUTTON */}

          <Link
            href="/dashboard/create-story"
            className="
              inline-flex
              items-center
              justify-center
              gap-2
              rounded-2xl
              bg-gradient-to-r
              from-purple-500
              via-indigo-500
              to-blue-500
              px-6
              py-3.5
              text-sm
              font-bold
              text-white
              shadow-lg
              shadow-indigo-500/20
              transition
              hover:scale-[1.02]
              hover:shadow-indigo-500/30
            "
          >
            <span className="text-lg">
              +
            </span>

            Create Story
          </Link>
        </div>

        {/* ====================================================
            STATS
            ==================================================== */}

        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {/* TOTAL */}

          <div
            className="
              rounded-2xl
              border
              border-purple-500/20
              bg-gradient-to-br
              from-purple-500/10
              to-transparent
              p-5
            "
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                  Total Stories
                </p>

                <p className="mt-2 text-3xl font-bold text-white">
                  {stories.length}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-500/15 text-xl">
                ✦
              </div>
            </div>
          </div>

          {/* FILTERED */}

          <div
            className="
              rounded-2xl
              border
              border-blue-500/20
              bg-gradient-to-br
              from-blue-500/10
              to-transparent
              p-5
            "
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                  Showing
                </p>

                <p className="mt-2 text-3xl font-bold text-white">
                  {filteredStories.length}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/15 text-xl">
                ◉
              </div>
            </div>
          </div>

          {/* MODULES */}

          <div
            className="
              rounded-2xl
              border
              border-cyan-500/20
              bg-gradient-to-br
              from-cyan-500/10
              to-transparent
              p-5
            "
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                  Modules
                </p>

                <p className="mt-2 text-3xl font-bold text-white">
                  {modules.length}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500/15 text-xl">
                ◈
              </div>
            </div>
          </div>

          {/* STORY POINTS */}

          <div
            className="
              rounded-2xl
              border
              border-emerald-500/20
              bg-gradient-to-br
              from-emerald-500/10
              to-transparent
              p-5
            "
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                  Story Points
                </p>

                <p className="mt-2 text-3xl font-bold text-white">
                  {stories.reduce(
                    (total, story) =>
                      total +
                      (story.story_points || 0),
                    0
                  )}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/15 text-xl">
                ★
              </div>
            </div>
          </div>
        </div>

        {/* ====================================================
            SEARCH + FILTERS
            ==================================================== */}

        <div
          className="
            mt-8
            rounded-2xl
            border
            border-white/10
            bg-white/[0.03]
            p-4
            backdrop-blur-xl
          "
        >
          <div className="grid gap-3 lg:grid-cols-[1fr_180px_180px]">
            {/* SEARCH */}

            <div className="relative">
              <span
                className="
                  pointer-events-none
                  absolute
                  left-4
                  top-1/2
                  -translate-y-1/2
                  text-slate-500
                "
              >
                🔍
              </span>

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search stories, features, modules..."
                className="
                  w-full
                  rounded-xl
                  border
                  border-white/10
                  bg-black/20
                  py-3
                  pl-11
                  pr-4
                  text-sm
                  text-white
                  outline-none
                  placeholder:text-slate-600
                  transition
                  focus:border-purple-500/50
                  focus:ring-2
                  focus:ring-purple-500/10
                "
              />
            </div>

            {/* PRIORITY */}

            <select
              value={priorityFilter}
              onChange={(event) =>
                setPriorityFilter(event.target.value)
              }
              className="
                rounded-xl
                border
                border-white/10
                bg-slate-900
                px-4
                py-3
                text-sm
                text-slate-300
                outline-none
                focus:border-purple-500/50
              "
            >
              <option value="All">
                All Priorities
              </option>

              {priorities.map((priority) => (
                <option
                  key={priority}
                  value={priority}
                >
                  {priority}
                </option>
              ))}
            </select>

            {/* MODULE */}

            <select
              value={moduleFilter}
              onChange={(event) =>
                setModuleFilter(event.target.value)
              }
              className="
                rounded-xl
                border
                border-white/10
                bg-slate-900
                px-4
                py-3
                text-sm
                text-slate-300
                outline-none
                focus:border-purple-500/50
              "
            >
              <option value="All">
                All Modules
              </option>

              {modules.map((module) => (
                <option
                  key={module}
                  value={module}
                >
                  {module}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ====================================================
            STORY COUNT
            ==================================================== */}

        <div className="mt-8 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">
              Generated Stories
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              {filteredStories.length}{" "}
              {filteredStories.length === 1
                ? "story"
                : "stories"}{" "}
              displayed
            </p>
          </div>
        </div>

        {/* ====================================================
            EMPTY STATE
            ==================================================== */}

        {filteredStories.length === 0 ? (
          <div
            className="
              mt-6
              rounded-3xl
              border
              border-white/10
              bg-gradient-to-br
              from-purple-500/5
              via-white/[0.02]
              to-blue-500/5
              p-12
              text-center
            "
          >
            <div
              className="
                mx-auto
                flex
                h-20
                w-20
                items-center
                justify-center
                rounded-3xl
                bg-gradient-to-br
                from-purple-500/20
                to-blue-500/20
                text-3xl
              "
            >
              ✦
            </div>

            <h2 className="mt-6 text-2xl font-bold text-white">
              {stories.length === 0
                ? "No Stories Yet"
                : "No Matching Stories"}
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              {stories.length === 0
                ? "Create your first AI-generated user story and start building your product backlog."
                : "Try changing your search or filters to find the story you are looking for."}
            </p>

            {stories.length === 0 && (
              <Link
                href="/dashboard/create-story"
                className="
                  mt-7
                  inline-flex
                  rounded-xl
                  bg-gradient-to-r
                  from-purple-500
                  to-blue-500
                  px-6
                  py-3
                  text-sm
                  font-semibold
                  text-white
                  shadow-lg
                  shadow-purple-500/20
                  transition
                  hover:scale-[1.02]
                "
              >
                Create Your First Story
              </Link>
            )}
          </div>
        ) : (
          /* ==================================================
             STORY CARDS
             ================================================== */

          <div className="mt-6 grid gap-5 xl:grid-cols-2">
            {filteredStories.map((story) => (
              <div
                key={story.id}
                className="
                  group
                  relative
                  overflow-hidden
                  rounded-3xl
                  border
                  border-white/10
                  bg-gradient-to-br
                  from-white/[0.06]
                  via-white/[0.025]
                  to-purple-500/[0.03]
                  p-6
                  transition
                  duration-300
                  hover:-translate-y-1
                  hover:border-purple-500/30
                  hover:shadow-2xl
                  hover:shadow-purple-500/10
                "
              >
                {/* CARD GLOW */}

                <div
                  className="
                    pointer-events-none
                    absolute
                    -right-20
                    -top-20
                    h-40
                    w-40
                    rounded-full
                    bg-purple-500/10
                    blur-3xl
                    transition
                    group-hover:bg-purple-500/20
                  "
                />

                <div className="relative">
                  {/* TOP */}

                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className="
                            rounded-lg
                            border
                            border-indigo-500/20
                            bg-indigo-500/10
                            px-2.5
                            py-1
                            text-[11px]
                            font-semibold
                            text-indigo-300
                          "
                        >
                          {story.module}
                        </span>

                        <span
                          className={`
                            rounded-lg
                            border
                            px-2.5
                            py-1
                            text-[11px]
                            font-semibold
                            ${getPriorityStyle(
                              story.priority
                            )}
                          `}
                        >
                          {story.priority}
                        </span>
                      </div>

                      <h3
                        className="
                          mt-4
                          line-clamp-2
                          text-xl
                          font-bold
                          leading-7
                          text-white
                          transition
                          group-hover:text-purple-200
                        "
                      >
                        {story.title}
                      </h3>

                      {story.feature_name && (
                        <p
                          className="
                            mt-2
                            truncate
                            text-xs
                            text-slate-500
                          "
                        >
                          Feature:{" "}
                          {story.feature_name}
                        </p>
                      )}
                    </div>

                    {/* STORY POINTS */}

                    <div
                      className="
                        flex
                        h-14
                        min-w-14
                        shrink-0
                        flex-col
                        items-center
                        justify-center
                        rounded-2xl
                        border
                        border-purple-500/20
                        bg-gradient-to-br
                        from-purple-500/15
                        to-blue-500/10
                      "
                    >
                      <span className="text-lg font-bold text-white">
                        {story.story_points}
                      </span>

                      <span className="text-[9px] font-semibold uppercase tracking-wider text-purple-300">
                        Points
                      </span>
                    </div>
                  </div>

                  {/* DESCRIPTION */}

                  <div
                    className="
                      mt-5
                      rounded-2xl
                      border
                      border-white/5
                      bg-black/10
                      p-4
                    "
                  >
                    <p
                      className="
                        line-clamp-3
                        text-sm
                        leading-6
                        text-slate-300
                      "
                    >
                      {story.user_story}
                    </p>
                  </div>

                  {/* TAGS */}

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span
                      className={`
                        rounded-lg
                        border
                        px-2.5
                        py-1
                        text-[11px]
                        font-medium
                        ${getStoryTypeStyle(
                          story.story_type
                        )}
                      `}
                    >
                      {story.story_type}
                    </span>

                    <span
                      className="
                        rounded-lg
                        border
                        border-cyan-500/20
                        bg-cyan-500/10
                        px-2.5
                        py-1
                        text-[11px]
                        font-medium
                        text-cyan-300
                      "
                    >
                      AI Generated
                    </span>

                    <span
                      className="
                        rounded-lg
                        border
                        border-emerald-500/20
                        bg-emerald-500/10
                        px-2.5
                        py-1
                        text-[11px]
                        font-medium
                        text-emerald-300
                      "
                    >
                      {story.acceptance_criteria?.length || 0}{" "}
                      Criteria
                    </span>
                  </div>

                  {/* FOOTER */}

                  <div
                    className="
                      mt-6
                      flex
                      items-center
                      justify-between
                      border-t
                      border-white/5
                      pt-4
                    "
                  >
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-slate-600">
                        Created
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {story.created_at
                          ? new Date(
                              story.created_at
                            ).toLocaleDateString(
                              undefined,
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              }
                            )
                          : "Recently"}
                      </p>
                    </div>

                    {/* VIEW */}

                    <Link
                      href={`/dashboard/stories/${story.id}`}
                      className="
                        inline-flex
                        items-center
                        gap-2
                        rounded-xl
                        border
                        border-purple-500/20
                        bg-purple-500/10
                        px-4
                        py-2.5
                        text-xs
                        font-semibold
                        text-purple-300
                        transition
                        hover:border-purple-400/40
                        hover:bg-purple-500/20
                        hover:text-purple-200
                      "
                    >
                      View Story

                      <span className="text-sm transition group-hover:translate-x-0.5">
                        →
                      </span>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
