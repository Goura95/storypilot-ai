"use client";

import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">

        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-3"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 text-2xl shadow-lg shadow-purple-500/30">
            ✦
          </div>

          <div>
            <div className="text-xl font-bold text-white">
              StoryPilot
            </div>

            <div className="text-[10px] tracking-[0.25em] text-slate-400">
              AI STORY GENERATOR
            </div>
          </div>
        </Link>

        {/* Navigation */}
        <div className="flex items-center gap-3">

          <Link
            href="/login"
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
          >
            Login
          </Link>

          <Link
            href="/register"
            className="rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:from-blue-500 hover:to-purple-500"
          >
            Get Started
          </Link>

        </div>

      </div>
    </nav>
  );
}