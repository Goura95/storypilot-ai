"use client";

import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative min-h-[calc(100vh-80px)] overflow-hidden bg-slate-950 text-white">

      {/* Background Glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">

        <div className="absolute left-[20%] top-20 h-[420px] w-[420px] rounded-full bg-purple-600/20 blur-[120px]" />

        <div className="absolute right-[20%] top-40 h-[420px] w-[420px] rounded-full bg-blue-600/20 blur-[120px]" />

        <div className="absolute bottom-0 left-1/2 h-[300px] w-[500px] -translate-x-1/2 rounded-full bg-pink-600/10 blur-[120px]" />

      </div>

      {/* Hero Content */}
      <div className="relative mx-auto flex max-w-7xl flex-col items-center px-6 py-24 text-center md:py-32">

        {/* Badge */}
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-5 py-2 text-sm font-medium text-purple-300 shadow-lg shadow-purple-500/10">

          <span className="text-lg">
            ✦
          </span>

          <span>
            AI-Powered Product Management
          </span>

        </div>

        {/* Heading */}
        <h1 className="max-w-5xl text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl md:text-7xl">

          Turn Ideas Into

          <span className="mt-3 block bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Production-Ready User Stories
          </span>

        </h1>

        {/* Description */}
        <p className="mx-auto mt-8 max-w-3xl text-base leading-8 text-slate-400 sm:text-lg md:text-xl">

          StoryPilot AI transforms your feature ideas into structured,
          professional user stories, acceptance criteria, test cases,
          edge cases, and more — in seconds.

        </p>

        {/* Single Hero CTA */}
        <div className="mt-10">

          <Link
            href="/register"
            className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 px-8 py-4 font-semibold text-white shadow-xl shadow-purple-500/20 transition duration-300 hover:scale-105 hover:shadow-purple-500/40"
          >

            Create Your First Story

            <span className="transition-transform duration-300 group-hover:translate-x-1">
              →
            </span>

          </Link>

        </div>

        {/* Feature Cards */}
        <div className="mt-20 grid w-full max-w-5xl grid-cols-1 gap-5 md:grid-cols-3">

          {/* AI Generation */}
          <div className="group rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-left shadow-xl backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-purple-500/40 hover:bg-slate-900">

            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-2xl ring-1 ring-purple-500/20">
              🤖
            </div>

            <h3 className="mb-2 text-lg font-bold">
              AI Story Generation
            </h3>

            <p className="text-sm leading-6 text-slate-400">
              Turn simple feature descriptions into detailed,
              professional user stories automatically.
            </p>

          </div>

          {/* Testing */}
          <div className="group rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-left shadow-xl backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-blue-500/40 hover:bg-slate-900">

            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-2xl ring-1 ring-blue-500/20">
              🧪
            </div>

            <h3 className="mb-2 text-lg font-bold">
              Complete Test Coverage
            </h3>

            <p className="text-sm leading-6 text-slate-400">
              Generate acceptance criteria, test cases,
              edge cases, and non-functional requirements.
            </p>

          </div>

          {/* Export */}
          <div className="group rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-left shadow-xl backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-pink-500/40 hover:bg-slate-900">

            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-pink-500/10 text-2xl ring-1 ring-pink-500/20">
              📄
            </div>

            <h3 className="mb-2 text-lg font-bold">
              Export & Share
            </h3>

            <p className="text-sm leading-6 text-slate-400">
              Copy your stories or export them directly
              to Word and PDF formats.
            </p>

          </div>

        </div>

        {/* Bottom Trust Text */}
        <div className="mt-12 flex flex-wrap justify-center gap-x-8 gap-y-3 text-sm text-slate-500">

          <span>✓ Azure DevOps Ready</span>

          <span>✓ AI Powered</span>

          <span>✓ Production Focused</span>

        </div>

      </div>

    </section>
  );
}