"use client";

import Link from "next/link";

export default function DashboardHeader() {
  return (
    <div className="mb-8">
      {/* Header */}
      <div
        className="
          flex
          flex-col
          gap-6
          rounded-3xl
          border
          border-slate-800
          bg-gradient-to-r
          from-slate-900
          via-slate-900
          to-purple-950/30
          p-8
          shadow-2xl
          shadow-purple-950/20
          md:flex-row
          md:items-center
          md:justify-between
        "
      >
        {/* Brand */}
        <div className="flex items-center gap-5">
          {/* Logo */}
          <div
            className="
              flex
              h-16
              w-16
              shrink-0
              items-center
              justify-center
              rounded-2xl
              bg-gradient-to-br
              from-blue-500
              via-purple-500
              to-pink-500
              text-3xl
              shadow-xl
              shadow-purple-500/20
            "
          >
            ✦
          </div>

          {/* Text */}
          <div>
            <div className="mb-1 flex items-center gap-3">
              <h1 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl">
                StoryPilot AI
              </h1>

              <span
                className="
                  rounded-full
                  border
                  border-purple-500/30
                  bg-purple-500/10
                  px-3
                  py-1
                  text-xs
                  font-semibold
                  text-purple-300
                "
              >
                AI
              </span>
            </div>

            <p className="text-base text-slate-400 md:text-lg">
              Your intelligent product management workspace.
            </p>
          </div>
        </div>

        {/* Create Story */}
        <Link
          href="/dashboard/create-story"
          className="
            group
            inline-flex
            items-center
            justify-center
            gap-2
            rounded-xl
            bg-gradient-to-r
            from-blue-600
            via-purple-600
            to-pink-600
            px-6
            py-3.5
            font-semibold
            text-white
            shadow-lg
            shadow-purple-500/20
            transition
            duration-300
            hover:scale-[1.02]
            hover:shadow-purple-500/40
          "
        >
          <span className="text-lg">
            ✨
          </span>

          Create Story

          <span className="transition-transform duration-300 group-hover:translate-x-1">
            →
          </span>
        </Link>
      </div>
    </div>
  );
}