"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

interface StoredUser {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  // ============================================================
  // USER
  // ============================================================

  const [user, setUser] = useState<StoredUser | null>(null);

  // ============================================================
  // LOAD USER FROM LOCAL STORAGE
  // ============================================================

  useEffect(() => {
    const loadUser = () => {
      const storedUser =
        window.localStorage.getItem("user");

      if (!storedUser) {
        setUser(null);
        return;
      }

      try {
        const parsedUser: unknown =
          JSON.parse(storedUser);

        if (
          typeof parsedUser === "object" &&
          parsedUser !== null
        ) {
          const userData =
            parsedUser as Record<string, unknown>;

          if (
            typeof userData.id === "number" &&
            typeof userData.first_name === "string" &&
            typeof userData.last_name === "string" &&
            typeof userData.email === "string"
          ) {
            setUser({
              id: userData.id,
              first_name: userData.first_name,
              last_name: userData.last_name,
              email: userData.email,
            });

            return;
          }
        }

        setUser(null);
      } catch (error) {
        console.error(
          "Failed to parse stored user:",
          error
        );

        setUser(null);
      }
    };

    // Load initially
    loadUser();

    // Listen for profile updates
    window.addEventListener(
      "storypilot-user-updated",
      loadUser
    );

    // Listen for localStorage changes
    window.addEventListener(
      "storage",
      loadUser
    );

    return () => {
      window.removeEventListener(
        "storypilot-user-updated",
        loadUser
      );

      window.removeEventListener(
        "storage",
        loadUser
      );
    };
  }, []);

  // ============================================================
  // USER DISPLAY
  // ============================================================

  const firstName =
    user?.first_name?.trim() || "User";

  const firstLetter =
    firstName.charAt(0).toUpperCase() || "U";

  // ============================================================
  // NAVIGATION
  // ============================================================

  const workspaceNavigation = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: "⌂",
    },
    {
      name: "Create Story",
      href: "/dashboard/create-story",
      icon: "✦",
    },
    {
      name: "My Stories",
      href: "/dashboard/stories",
      icon: "▣",
    },
  ];

  const insightNavigation = [
    {
      name: "Analytics",
      href: "/dashboard/analytics",
      icon: "◇",
    },
  ];

  const accountNavigation = [
    {
      name: "My Profile",
      href: "/dashboard/profile",
      icon: "⚙",
    },
  ];

  function isActive(href: string) {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }

    return pathname.startsWith(href);
  }

  // ============================================================
  // LOGOUT
  // ============================================================

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("access_token");
    localStorage.removeItem("token_type");
    localStorage.removeItem("user");

    window.dispatchEvent(
      new Event("storypilot-user-updated")
    );

    router.push("/login");
  }

  // ============================================================
  // UI
  // ============================================================

  return (
    <div className="min-h-screen bg-[#030615] text-white">
      {/* =====================================================
          SIDEBAR
          ===================================================== */}

      <aside
        className="
          fixed
          inset-y-0
          left-0
          z-50
          flex
          w-[294px]
          flex-col
          overflow-hidden
          border-r
          border-white/[0.08]
          bg-[#030615]
        "
      >
        {/* =================================================
            PURPLE VERTICAL ACCENT
            ================================================= */}

        <div
          className="
            pointer-events-none
            absolute
            right-0
            top-[92px]
            h-[518px]
            w-[8px]
            rounded-l-full
            bg-gradient-to-b
            from-indigo-500
            via-purple-500
            to-fuchsia-500
            opacity-95
          "
        />

        {/* =================================================
            LOGO
            ================================================= */}

        <div
          className="
            flex
            h-[93px]
            shrink-0
            items-center
            border-b
            border-white/[0.08]
            px-7
          "
        >
          <Link
            href="/dashboard"
            className="flex items-center gap-3"
          >
            {/* Logo */}

            <div
              className="
                relative
                flex
                h-11
                w-11
                shrink-0
                items-center
                justify-center
                overflow-hidden
                rounded-[13px]
                bg-gradient-to-br
                from-violet-500
                via-purple-500
                to-blue-500
                shadow-lg
                shadow-purple-500/30
              "
            >
              <div
                className="
                  absolute
                  inset-0
                  bg-gradient-to-br
                  from-white/20
                  via-transparent
                  to-transparent
                "
              />

              <span className="relative text-xl text-white">
                ✦
              </span>
            </div>

            {/* Brand */}

            <div>
              <h1 className="text-[17px] font-bold leading-5 text-white">
                StoryPilot
              </h1>

              <p
                className="
                  mt-1
                  text-[9px]
                  font-medium
                  uppercase
                  tracking-[0.23em]
                  text-slate-500
                "
              >
                AI Story Generator
              </p>
            </div>
          </Link>
        </div>

        {/* =================================================
            NAVIGATION
            ================================================= */}

        {/* ================= WORKSPACE ================= */}

        <NavigationSection
          title="WORKSPACE"
          items={workspaceNavigation}
          isActive={isActive}
        />

        {/* ================= INSIGHTS ================= */}

        <div className="mt-12">
          <NavigationSection
            title="INSIGHTS"
            items={insightNavigation}
            isActive={isActive}
          />
        </div>

        {/* ================= ACCOUNT ================= */}

        <div className="mt-12">
          <NavigationSection
            title="ACCOUNT"
            items={accountNavigation}
            isActive={isActive}
          />
        </div>

        {/* =================================================
            USER AREA
            ================================================= */}

        <div
          className="
            mt-8
            shrink-0
            border-t
            border-white/[0.08]
            bg-[#030615]
            p-4
          "
        >
          {/* =================================================
              USER CARD
              ================================================= */}

          <div
            className="
              flex
              items-center
              gap-3
              rounded-xl
              bg-[#080c1d]
              px-3
              py-3
            "
          >
            {/* Avatar */}

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
                from-violet-500
                to-purple-600
                text-sm
                font-bold
                text-white
                shadow-lg
                shadow-purple-500/20
              "
            >
              {firstLetter}
            </div>

            {/* User Information */}

            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-white">
                {firstName}
              </p>

              <p className="mt-0.5 truncate text-[10px] text-slate-500">
                AI Product Workspace
              </p>
            </div>
          </div>

          {/* =================================================
              LOGOUT
              ================================================= */}

          <button
            type="button"
            onClick={handleLogout}
            className="
              mt-3
              flex
              w-full
              items-center
              gap-3
              rounded-xl
              px-3
              py-3
              text-sm
              text-slate-400
              transition
              hover:bg-white/[0.04]
              hover:text-white
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
                bg-white/[0.03]
                text-base
              "
            >
              ↪
            </span>

            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* =====================================================
          MAIN CONTENT
          ===================================================== */}

      <main className="ml-[294px] min-h-screen">
        {children}
      </main>
    </div>
  );
}

/* ============================================================
   NAVIGATION SECTION
   ============================================================ */

function NavigationSection({
  title,
  items,
  isActive,
}: {
  title: string;
  items: {
    name: string;
    href: string;
    icon: string;
  }[];
  isActive: (href: string) => boolean;
}) {
  return (
    <div>
      {/* Section title */}

      <p
        className="
          mb-4
          px-3
          text-[10px]
          font-semibold
          uppercase
          tracking-[0.25em]
          text-slate-600
        "
      >
        {title}
      </p>

      {/* Items */}

      <div className="space-y-2">
        {items.map((item) => {
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                group
                relative
                flex
                h-[62px]
                items-center
                gap-3
                rounded-xl
                px-4
                transition-all
                duration-200
                ${
                  active
                    ? `
                      border
                      border-purple-400/30
                      bg-gradient-to-r
                      from-indigo-500/20
                      via-purple-500/10
                      to-purple-500/[0.04]
                      shadow-lg
                      shadow-purple-500/5
                    `
                    : `
                      border
                      border-transparent
                      hover:border-white/[0.05]
                      hover:bg-white/[0.035]
                    `
                }
              `}
            >
              {/* Active left border */}

              {active && (
                <span
                  className="
                    absolute
                    left-0
                    top-1/2
                    h-[46px]
                    w-[3px]
                    -translate-y-1/2
                    rounded-r-full
                    bg-gradient-to-b
                    from-indigo-400
                    to-purple-500
                  "
                />
              )}

              {/* Icon */}

              <span
                className={`
                  flex
                  h-9
                  w-9
                  shrink-0
                  items-center
                  justify-center
                  rounded-lg
                  text-sm
                  transition
                  ${
                    active
                      ? "bg-indigo-500/20 text-indigo-300"
                      : "bg-white/[0.04] text-slate-500 group-hover:bg-white/[0.07] group-hover:text-slate-300"
                  }
                `}
              >
                {item.icon}
              </span>

              {/* Label */}

              <span
                className={`
                  text-sm
                  font-medium
                  ${
                    active
                      ? "text-white"
                      : "text-slate-400 group-hover:text-slate-200"
                  }
                `}
              >
                {item.name}
              </span>

              {/* Active indicator */}

              {active && (
                <span
                  className="
                    ml-auto
                    h-1.5
                    w-1.5
                    rounded-full
                    bg-indigo-400
                    shadow-sm
                    shadow-indigo-400/50
                  "
                />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}