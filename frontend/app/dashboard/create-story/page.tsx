"use client";

import AuthGuard from "@/components/auth/AuthGuard";
import StoryForm from "@/components/dashboard/StoryForm";

export default function CreateStoryPage() {
  return (
    <AuthGuard>
      <div className="w-full px-6 py-8 lg:px-10">

        {/* ====================================================== */}
        {/* PAGE HEADER */}
        {/* ====================================================== */}

        <div className="mb-8 w-full">
          <div
            className="
              mb-3
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
              font-semibold
              text-indigo-300
            "
          >
            <span>✨</span>
            AI Story Generator
          </div>

          <h1
            className="
              text-3xl
              font-bold
              tracking-tight
              text-white
              sm:text-4xl
            "
          >
            Create a User Story
          </h1>

          <p
            className="
              mt-3
              max-w-3xl
              text-sm
              leading-7
              text-slate-400
              sm:text-base
            "
          >
            Describe your feature, upload supporting screenshots
            or documents, and let StoryPilot AI transform your idea
            into a professional, production-ready user story.
          </p>
        </div>

        {/* ====================================================== */}
        {/* GENERATOR CARD */}
        {/* ====================================================== */}

        <div
          className="
            relative
            w-full
            overflow-hidden
            rounded-3xl
            border
            border-white/10
            bg-gradient-to-br
            from-slate-900
            via-slate-900
            to-indigo-950/30
            p-6
            shadow-2xl
            shadow-indigo-950/20
            lg:p-8
          "
        >

          {/* Decorative glow */}

          <div
            className="
              pointer-events-none
              absolute
              -right-24
              -top-24
              h-72
              w-72
              rounded-full
              bg-indigo-500/10
              blur-3xl
            "
          />

          <div
            className="
              pointer-events-none
              absolute
              -bottom-24
              -left-24
              h-72
              w-72
              rounded-full
              bg-purple-500/10
              blur-3xl
            "
          />

          <div className="relative w-full">

            {/* Story Details Header */}

            <div className="mb-6 flex items-center gap-4">

              <div
                className="
                  flex
                  h-12
                  w-12
                  shrink-0
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
                🤖
              </div>

              <div>
                <h2 className="text-xl font-bold text-white">
                  Story Details
                </h2>

                <p className="text-sm text-slate-500">
                  Provide as much context as possible for better AI
                  output.
                </p>
              </div>

            </div>

            {/* Story Form */}

            <div className="w-full">
              <StoryForm />
            </div>

          </div>
        </div>

        {/* ====================================================== */}
        {/* AI CAPABILITIES */}
        {/* ====================================================== */}

        <div
          className="
            mt-8
            grid
            w-full
            grid-cols-1
            gap-4
            md:grid-cols-3
          "
        >

          {/* Intelligent Generation */}

          <div
            className="
              w-full
              rounded-2xl
              border
              border-white/10
              bg-slate-900/60
              p-5
            "
          >
            <div className="mb-3 text-2xl">
              🧠
            </div>

            <h3 className="font-semibold text-white">
              Intelligent Generation
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              AI understands your feature context and generates
              structured product requirements.
            </p>
          </div>

          {/* Smart Test Cases */}

          <div
            className="
              w-full
              rounded-2xl
              border
              border-white/10
              bg-slate-900/60
              p-5
            "
          >
            <div className="mb-3 text-2xl">
              🧪
            </div>

            <h3 className="font-semibold text-white">
              Smart Test Cases
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Generate relevant functional, negative, edge, and
              validation scenarios from the story.
            </p>
          </div>

          {/* Ready to Export */}

          <div
            className="
              w-full
              rounded-2xl
              border
              border-white/10
              bg-slate-900/60
              p-5
            "
          >
            <div className="mb-3 text-2xl">
              📄
            </div>

            <h3 className="font-semibold text-white">
              Ready to Export
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Copy your result or export the generated story to
              Word and PDF.
            </p>
          </div>

        </div>

      </div>
    </AuthGuard>
  );
}