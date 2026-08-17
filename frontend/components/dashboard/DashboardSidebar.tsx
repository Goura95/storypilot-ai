"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

interface MenuItem {
  label: string;
  icon: string;
  href: string;
}

const mainMenu: MenuItem[] = [
  {
    label: "Dashboard",
    icon: "⌂",
    href: "/dashboard",
  },
  {
    label: "Create Story",
    icon: "✦",
    href: "/dashboard/create-story",
  },
  {
    label: "My Stories",
    icon: "▣",
    href: "/dashboard/stories",
  },
];

const workspaceMenu: MenuItem[] = [
  {
    label: "Analytics",
    icon: "◈",
    href: "/dashboard/analytics",
  },
];

const accountMenu: MenuItem[] = [
  {
    label: "Settings",
    icon: "⚙",
    href: "/dashboard/settings",
  },
  {
    label: "My Profile",
    icon: "👤",
    href: "/dashboard/profile",
  },
];

export default function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }

    return pathname.startsWith(href);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  const renderMenuItem = (item: MenuItem) => {
    const active = isActive(item.href);

    return (
      <Link
        key={item.href}
        href={item.href}
        className={`
          group
          flex
          items-center
          gap-3
          rounded-xl
          px-4
          py-3
          text-sm
          font-medium
          transition-all
          duration-200
          ${
            active
              ? "sidebar-active"
              : "text-slate-400 hover:bg-white/5 hover:text-white"
          }
        `}
      >
        <span
          className={`
            flex
            h-9
            w-9
            items-center
            justify-center
            rounded-lg
            text-base
            transition-all
            duration-200
            ${
              active
                ? "bg-indigo-500/20 text-indigo-300"
                : "bg-white/5 text-slate-500 group-hover:bg-indigo-500/10 group-hover:text-indigo-300"
            }
          `}
        >
          {item.icon}
        </span>

        <span className="flex-1">
          {item.label}
        </span>

        {active && (
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 shadow-lg shadow-indigo-400/50" />
        )}
      </Link>
    );
  };

  return (
    <aside
      className="
        fixed
        left-0
        top-0
        z-40
        flex
        h-screen
        w-72
        flex-col
        border-r
        border-white/10
        bg-slate-950
      "
    >
      {/* =====================================================
          BRAND
          ===================================================== */}

      <div className="border-b border-white/10 px-6 py-6">
        <Link
          href="/dashboard"
          className="group flex items-center gap-3"
        >
          {/* Logo */}
          <div
            className="
              flex
              h-11
              w-11
              shrink-0
              items-center
              justify-center
              rounded-xl
              bg-gradient-to-br
              from-indigo-500
              via-purple-500
              to-cyan-400
              shadow-lg
              shadow-indigo-500/20
              transition
              duration-300
              group-hover:scale-105
              group-hover:shadow-indigo-500/40
            "
          >
            <span className="text-xl font-bold text-white">
              ✦
            </span>
          </div>

          <div>
            <h1 className="text-lg font-bold tracking-tight text-white">
              Story<span className="gradient-text">Pilot</span>
            </h1>

            <p className="text-[9px] font-medium uppercase tracking-[0.2em] text-slate-500">
              AI Story Generator
            </p>
          </div>
        </Link>
      </div>

      {/* =====================================================
          SIDEBAR CONTENT
          ===================================================== */}

      <div className="flex flex-1 flex-col overflow-y-auto px-4 py-6">

        {/* Main */}
        <div>
          <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-600">
            Workspace
          </p>

          <div className="space-y-1">
            {mainMenu.map(renderMenuItem)}
          </div>
        </div>

        {/* Divider */}
        <div className="my-6 h-px bg-white/5" />

        {/* Analytics */}
        <div>
          <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-600">
            Insights
          </p>

          <div className="space-y-1">
            {workspaceMenu.map(renderMenuItem)}
          </div>
        </div>

        {/* Divider */}
        <div className="my-6 h-px bg-white/5" />

        {/* Account */}
        <div>
          <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-600">
            Account
          </p>

          <div className="space-y-1">
            {accountMenu.map(renderMenuItem)}
          </div>
        </div>

        {/* =================================================
            PRODUCT PROMO
            ================================================= */}

        <div className="mt-8 rounded-2xl border border-indigo-400/10 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-cyan-500/10 p-4">
          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/15 text-indigo-300">
            ✨
          </div>

          <h3 className="text-sm font-semibold text-white">
            Build faster with AI
          </h3>

          <p className="mt-1 text-xs leading-5 text-slate-500">
            Turn product ideas into structured user stories in seconds.
          </p>

          <Link
            href="/dashboard/create-story"
            className="
              mt-4
              flex
              items-center
              justify-center
              rounded-lg
              bg-indigo-500/10
              px-3
              py-2
              text-xs
              font-semibold
              text-indigo-300
              transition
              hover:bg-indigo-500/20
              hover:text-indigo-200
            "
          >
            Create Story

            <span className="ml-2">
              →
            </span>
          </Link>
        </div>
      </div>

      {/* =====================================================
          USER / LOGOUT
          ===================================================== */}

      <div className="border-t border-white/10 p-4">

        <div className="mb-3 flex items-center gap-3 rounded-xl bg-white/[0.03] p-3">

          <div
            className="
              flex
              h-10
              w-10
              shrink-0
              items-center
              justify-center
              rounded-full
              bg-gradient-to-br
              from-indigo-500
              to-purple-600
              text-sm
              font-bold
              text-white
            "
          >
            U
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">
              StoryPilot User
            </p>

            <p className="truncate text-xs text-slate-500">
              AI Product Workspace
            </p>
          </div>

        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="
            group
            flex
            w-full
            items-center
            gap-3
            rounded-xl
            px-4
            py-3
            text-sm
            font-medium
            text-slate-400
            transition
            duration-200
            hover:bg-red-500/5
            hover:text-red-300
          "
        >
          <span
            className="
              flex
              h-9
              w-9
              items-center
              justify-center
              rounded-lg
              bg-white/5
              text-slate-500
              transition
              group-hover:bg-red-500/10
              group-hover:text-red-300
            "
          >
            ⇥
          </span>

          <span>
            Logout
          </span>
        </button>

      </div>
    </aside>
  );
}