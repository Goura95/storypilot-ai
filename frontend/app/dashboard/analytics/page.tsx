"use client";

import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";



import {
  getAnalytics,
  AnalyticsResponse,
  AnalyticsCount,
  StoryOverTime,
} from "@/services/analyticsService";

// ============================================================
// PAGE
// ============================================================

export default function AnalyticsPage() {
  const [analytics, setAnalytics] =
    useState<AnalyticsResponse | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ==========================================================
  // LOAD ANALYTICS
  // ==========================================================

  useEffect(() => {
    async function loadAnalytics() {
      try {
        setLoading(true);
        setError("");

        const data = await getAnalytics();

        setAnalytics(data);
      } catch (err) {
        console.error(
          "Failed to load analytics:",
          err
        );

        setError(
          "Unable to load analytics. Please try again."
        );
      } finally {
        setLoading(false);
      }
    }

    loadAnalytics();
  }, []);

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <div className="relative min-h-screen w-full overflow-hidden bg-slate-950">
        <Background />

        <div className="relative min-h-screen w-full p-6 lg:p-8">
          <div className="mx-auto w-full max-w-[1600px]">
            <div className="mb-8">
              <div className="h-3 w-28 animate-pulse rounded-full bg-white/10" />

              <div className="mt-4 h-10 w-56 animate-pulse rounded-xl bg-white/10" />

              <div className="mt-3 h-5 w-96 max-w-full animate-pulse rounded-lg bg-white/5" />
            </div>

            {/* KPI Skeleton */}

            <div className="grid gap-5 md:grid-cols-2">
              <SkeletonCard />
              <SkeletonCard />
            </div>

            {/* Chart Skeleton */}

            <div className="mt-6 h-[420px] animate-pulse rounded-3xl border border-white/10 bg-white/[0.03]" />

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <div className="h-[380px] animate-pulse rounded-3xl border border-white/10 bg-white/[0.03]" />

              <div className="h-[380px] animate-pulse rounded-3xl border border-white/10 bg-white/[0.03]" />
            </div>

            <div className="mt-6 h-[430px] animate-pulse rounded-3xl border border-white/10 bg-white/[0.03]" />
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================
  // ERROR
  // ==========================================================

  if (error || !analytics) {
    return (
      <div className="relative min-h-screen w-full overflow-hidden bg-slate-950">
        <Background />

        <div className="relative min-h-screen w-full p-6 lg:p-8">
          <div className="mx-auto w-full max-w-[1600px]">
        

            <div className="mt-8 rounded-3xl border border-red-500/20 bg-red-500/5 p-8">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-2xl">
                ⚠
              </div>

              <h1 className="mt-5 text-2xl font-bold text-white">
                Unable to Load Analytics
              </h1>

              <p className="mt-2 max-w-xl text-sm leading-6 text-red-300">
                {error ||
                  "Analytics data is currently unavailable."}
              </p>

              <button
                type="button"
                onClick={() =>
                  window.location.reload()
                }
                className="mt-6 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-500/20 transition hover:scale-[1.02]"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================
  // SAFE DATA
  // ==========================================================

  const totalStories =
    analytics.total_stories ?? 0;

  const totalStoryPoints =
    analytics.total_story_points ?? 0;

  const storiesOverTime =
    analytics.stories_over_time ?? [];

  const storiesByPriority =
    analytics.stories_by_priority ?? [];

  const storiesByType =
    analytics.stories_by_type ?? [];

  const storiesByModule =
    analytics.stories_by_module ?? [];

  // ==========================================================
  // PAGE
  // ==========================================================

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-slate-950">
      <Background />

      <div className="relative min-h-screen w-full p-6 lg:p-8">
        <div className="mx-auto w-full max-w-[1600px]">
          {/* ==================================================
              HEADER
              ================================================== */}

          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-purple-400">
                StoryPilot AI
              </p>

              <h1 className="mt-2 text-3xl font-bold tracking-tight text-white md:text-4xl">
                Analytics
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                Track your story generation activity and
                understand what your requirements contain.
              </p>
            </div>

            
          </div>

          {/* ==================================================
              KPI CARDS
              ================================================== */}

          <div className="mt-8 grid gap-5 md:grid-cols-2">
            <MetricCard
              label="Total Stories"
              value={totalStories}
              icon="📚"
              description="Generated user stories"
            />

            <MetricCard
              label="Story Points"
              value={totalStoryPoints}
              icon="🎯"
              description="Total estimated effort"
            />
          </div>

          {/* ==================================================
              STORY GENERATION TREND
              ================================================== */}

          <div className="mt-6">
            <AnalyticsCard
              title="Story Generation Trend"
              description="Number of user stories generated over time."
            >
              <StoryTrendChart
                data={storiesOverTime}
              />
            </AnalyticsCard>
          </div>

          {/* ==================================================
              PRIORITY + TYPE
              ================================================== */}

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            {/* PRIORITY */}

            <AnalyticsCard
              title="Stories by Priority"
              description="Distribution of generated stories across priority levels."
            >
              <PriorityDonutChart
                data={storiesByPriority}
              />
            </AnalyticsCard>

            {/* TYPE */}

            <AnalyticsCard
              title="Stories by Type"
              description="Breakdown of the different types of stories generated."
            >
              <StoryTypeChart
                data={storiesByType}
              />
            </AnalyticsCard>
          </div>

          {/* ==================================================
              MODULE
              ================================================== */}

          <div className="mt-6">
            <AnalyticsCard
              title="Stories by Module"
              description="Number of generated stories across product modules."
            >
              <ModuleChart
                data={storiesByModule}
              />
            </AnalyticsCard>
          </div>

          {/* ==================================================
              FOOTER
              ================================================== */}

          <div className="mt-8 border-t border-white/5 py-5">
            <p className="text-xs text-slate-600">
              StoryPilot AI Analytics
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// METRIC CARD
// ============================================================

function MetricCard({
  label,
  value,
  icon,
  description,
}: {
  label: string;
  value: number;
  icon: string;
  description: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-xl shadow-black/10 transition duration-300 hover:border-purple-500/30 hover:bg-slate-900">
      {/* Glow */}

      <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-purple-500/10 blur-3xl transition group-hover:bg-purple-500/20" />

      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">
            {label}
          </p>

          <p className="mt-4 text-4xl font-bold tracking-tight text-white">
            {formatNumber(value)}
          </p>

          <p className="mt-2 text-sm text-slate-500">
            {description}
          </p>
        </div>

        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-purple-500/10 bg-purple-500/10 text-xl">
          {icon}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// ANALYTICS CARD
// ============================================================

function AnalyticsCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-xl shadow-black/10 lg:p-7">
      <div>
        <h2 className="text-xl font-bold text-white">
          {title}
        </h2>

        <p className="mt-1.5 text-sm text-slate-500">
          {description}
        </p>
      </div>

      <div className="mt-7">
        {children}
      </div>
    </section>
  );
}

// ============================================================
// STORY TREND CHART
// ============================================================

function StoryTrendChart({
  data,
}: {
  data: StoryOverTime[];
}) {
  const chartData = useMemo(() => {
    return [...(data ?? [])].sort(
      (a, b) =>
        String(a.date).localeCompare(
          String(b.date)
        )
    );
  }, [data]);

  if (!chartData.length) {
    return (
      <EmptyState message="No story generation data available yet." />
    );
  }

  const counts = chartData.map(
    (item) => item.count ?? 0
  );

  const maxCount = Math.max(
    ...counts,
    1
  );

  const width = 1000;
  const height = 320;

  const paddingLeft = 60;
  const paddingRight = 20;
  const paddingTop = 25;
  const paddingBottom = 50;

  const graphWidth =
    width -
    paddingLeft -
    paddingRight;

  const graphHeight =
    height -
    paddingTop -
    paddingBottom;

  const points = chartData.map(
    (item, index) => {
      const x =
        chartData.length === 1
          ? paddingLeft +
            graphWidth / 2
          : paddingLeft +
            (index /
              (chartData.length - 1)) *
              graphWidth;

      const count =
        item.count ?? 0;

      const y =
        paddingTop +
        graphHeight -
        (count / maxCount) *
          graphHeight;

      return {
        x,
        y,
        count,
        date: item.date,
      };
    }
  );

  const linePath = points
    .map((point, index) => {
      return `${
        index === 0 ? "M" : "L"
      } ${point.x} ${point.y}`;
    })
    .join(" ");

  const areaPath =
    points.length > 0
      ? `${linePath} L ${
          points[points.length - 1].x
        } ${
          paddingTop + graphHeight
        } L ${points[0].x} ${
          paddingTop + graphHeight
        } Z`
      : "";

  const yTicks =
    createYAxisTicks(maxCount);

  return (
    <div className="w-full">
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-[320px] min-w-[700px] w-full"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient
              id="trendAreaGradient"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="0%"
                stopColor="#8b5cf6"
                stopOpacity="0.28"
              />

              <stop
                offset="100%"
                stopColor="#8b5cf6"
                stopOpacity="0"
              />
            </linearGradient>

            <linearGradient
              id="trendLineGradient"
              x1="0"
              y1="0"
              x2="1"
              y2="0"
            >
              <stop
                offset="0%"
                stopColor="#a855f7"
              />

              <stop
                offset="100%"
                stopColor="#3b82f6"
              />
            </linearGradient>
          </defs>

          {/* Y-axis grid */}

          {yTicks.map((tick) => {
            const y =
              paddingTop +
              graphHeight -
              (tick / maxCount) *
                graphHeight;

            return (
              <g key={tick}>
                <line
                  x1={paddingLeft}
                  x2={width - paddingRight}
                  y1={y}
                  y2={y}
                  stroke="rgba(255,255,255,0.06)"
                  strokeWidth="1"
                />

                <text
                  x={paddingLeft - 12}
                  y={y + 4}
                  textAnchor="end"
                  fill="#64748b"
                  fontSize="12"
                >
                  {tick}
                </text>
              </g>
            );
          })}

          {/* Area */}

          {areaPath && (
            <path
              d={areaPath}
              fill="url(#trendAreaGradient)"
            />
          )}

          {/* Line */}

          {linePath && (
            <path
              d={linePath}
              fill="none"
              stroke="url(#trendLineGradient)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Data points */}

          {points.map((point) => (
            <g key={point.date}>
              <circle
                cx={point.x}
                cy={point.y}
                r="6"
                fill="#0f172a"
                stroke="#8b5cf6"
                strokeWidth="3"
              />

              <title>
                {formatDateLabel(
                  point.date
                )}
                : {point.count} stories
              </title>
            </g>
          ))}

          {/* X-axis labels */}

          {points.map(
            (point, index) => {
              const showLabel =
                shouldShowDateLabel(
                  index,
                  points.length
                );

              if (!showLabel) {
                return null;
              }

              return (
                <text
                  key={`label-${point.date}`}
                  x={point.x}
                  y={height - 18}
                  textAnchor="middle"
                  fill="#64748b"
                  fontSize="11"
                >
                  {formatDateLabel(
                    point.date
                  )}
                </text>
              );
            }
          )}
        </svg>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-4">
        <span className="text-xs text-slate-600">
          {chartData.length} data point
          {chartData.length === 1
            ? ""
            : "s"}
        </span>

        <span className="flex items-center gap-2 text-xs text-slate-500">
          <span className="h-2 w-2 rounded-full bg-purple-500" />

          Stories generated
        </span>
      </div>
    </div>
  );
}

// ============================================================
// PRIORITY DONUT CHART
// ============================================================

function PriorityDonutChart({
  data,
}: {
  data: AnalyticsCount[];
}) {
  const safeData = [...(data ?? [])]
    .filter(
      (item) => (item.count ?? 0) > 0
    )
    .sort(
      (a, b) =>
        (b.count ?? 0) -
        (a.count ?? 0)
    );

  if (!safeData.length) {
    return (
      <EmptyState message="No priority data available yet." />
    );
  }

  const total = safeData.reduce(
    (sum, item) =>
      sum + (item.count ?? 0),
    0
  );

  const radius = 78;

  const circumference =
    2 * Math.PI * radius;

  // ==========================================================
  // IMPORTANT:
  // No mutation of "accumulated" during render.
  // Each offset is calculated independently.
  // ==========================================================

  const segments = safeData.map(
    (item, index) => {
      const count =
        item.count ?? 0;

      const percentage =
        total > 0
          ? count / total
          : 0;

      const accumulated =
        safeData
          .slice(0, index)
          .reduce(
            (
              sum,
              previousItem
            ) => {
              const previousCount =
                previousItem.count ??
                0;

              const previousPercentage =
                total > 0
                  ? previousCount /
                    total
                  : 0;

              return (
                sum +
                previousPercentage
              );
            },
            0
          );

      return {
        ...item,
        count,
        percentage,
        offset:
          -accumulated *
          circumference,
      };
    }
  );

  return (
    <div className="flex flex-col items-center gap-8 md:flex-row md:justify-center">
      {/* Donut */}

      <div className="relative h-56 w-56 shrink-0">
        <svg
          viewBox="0 0 220 220"
          className="h-full w-full -rotate-90"
        >
          <circle
            cx="110"
            cy="110"
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="24"
          />

          {segments.map(
            (segment, index) => {
              const dashLength =
                segment.percentage *
                circumference;

              const gap = 2;

              return (
                <circle
                  key={segment.name}
                  cx="110"
                  cy="110"
                  r={radius}
                  fill="none"
                  stroke={getPriorityColor(
                    segment.name,
                    index
                  )}
                  strokeWidth="24"
                  strokeLinecap="round"
                  strokeDasharray={`${Math.max(
                    dashLength - gap,
                    0
                  )} ${circumference}`}
                  strokeDashoffset={
                    segment.offset
                  }
                />
              );
            }
          )}
        </svg>

        {/* Center */}

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-white">
            {total}
          </span>

          <span className="mt-1 text-xs uppercase tracking-wider text-slate-500">
            Stories
          </span>
        </div>
      </div>

      {/* Legend */}

      <div className="w-full max-w-xs space-y-4">
        {segments.map(
          (segment, index) => (
            <div
              key={segment.name}
              className="flex items-center justify-between"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{
                    backgroundColor:
                      getPriorityColor(
                        segment.name,
                        index
                      ),
                  }}
                />

                <span className="truncate text-sm font-medium text-slate-300">
                  {segment.name}
                </span>
              </div>

              <div className="ml-4 flex items-center gap-3">
                <span className="text-sm font-semibold text-white">
                  {segment.count}
                </span>

                <span className="w-12 text-right text-xs text-slate-500">
                  {(
                    segment.percentage *
                    100
                  ).toFixed(0)}
                  %
                </span>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}

// ============================================================
// STORY TYPE CHART
// ============================================================

function StoryTypeChart({
  data,
}: {
  data: AnalyticsCount[];
}) {
  const safeData = [...(data ?? [])]
    .filter(
      (item) =>
        (item.count ?? 0) >= 0
    )
    .sort(
      (a, b) =>
        (b.count ?? 0) -
        (a.count ?? 0)
    );

  if (!safeData.length) {
    return (
      <EmptyState message="No story type data available yet." />
    );
  }

  const maxValue = Math.max(
    ...safeData.map(
      (item) => item.count ?? 0
    ),
    1
  );

  return (
    <div className="space-y-5">
      {safeData.map((item) => {
        const count =
          item.count ?? 0;

        const percentage =
          (count / maxValue) * 100;

        return (
          <div key={item.name}>
            <div className="mb-2.5 flex items-center justify-between gap-4">
              <span className="truncate text-sm font-medium text-slate-300">
                {item.name}
              </span>

              <span className="shrink-0 text-sm font-semibold text-white">
                {count}
              </span>
            </div>

            <div className="h-3 overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-700"
                style={{
                  width: `${Math.max(
                    percentage,
                    count > 0
                      ? 2
                      : 0
                  )}%`,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// MODULE CHART
// ============================================================

function ModuleChart({
  data,
}: {
  data: AnalyticsCount[];
}) {
  const safeData = [...(data ?? [])]
    .filter(
      (item) =>
        (item.count ?? 0) >= 0
    )
    .sort(
      (a, b) =>
        (b.count ?? 0) -
        (a.count ?? 0)
    );

  if (!safeData.length) {
    return (
      <EmptyState message="No module data available yet." />
    );
  }

  const maxValue = Math.max(
    ...safeData.map(
      (item) => item.count ?? 0
    ),
    1
  );

  return (
    <div className="space-y-6">
      {safeData.map(
        (item, index) => {
          const count =
            item.count ?? 0;

          const percentage =
            (count / maxValue) *
            100;

          return (
            <div key={item.name}>
              <div className="mb-2.5 flex items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/5 text-xs font-semibold text-slate-500">
                    {index + 1}
                  </span>

                  <span className="truncate text-sm font-medium text-slate-300">
                    {item.name}
                  </span>
                </div>

                <span className="shrink-0 rounded-lg bg-cyan-500/10 px-2.5 py-1 text-xs font-semibold text-cyan-300">
                  {count}
                </span>
              </div>

              <div className="ml-10 h-3 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-700"
                  style={{
                    width: `${Math.max(
                      percentage,
                      count > 0
                        ? 2
                        : 0
                    )}%`,
                  }}
                />
              </div>
            </div>
          );
        }
      )}
    </div>
  );
}

// ============================================================
// EMPTY STATE
// ============================================================

function EmptyState({
  message,
}: {
  message: string;
}) {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-white/5 bg-black/10 px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-2xl">
        📊
      </div>

      <p className="mt-4 text-sm text-slate-500">
        {message}
      </p>
    </div>
  );
}

// ============================================================
// SKELETON
// ============================================================

function SkeletonCard() {
  return (
    <div className="h-36 animate-pulse rounded-3xl border border-white/10 bg-white/[0.03]" />
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
// NUMBER FORMATTER
// ============================================================

function formatNumber(
  value: number
) {
  return new Intl.NumberFormat(
    "en-US"
  ).format(
    Number.isFinite(value)
      ? value
      : 0
  );
}

// ============================================================
// DATE FORMATTER
// ============================================================

function formatDateLabel(
  dateValue: string
) {
  if (!dateValue) {
    return "";
  }

  const date = new Date(
    `${dateValue}T00:00:00`
  );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return dateValue;
  }

  return date.toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
    }
  );
}

// ============================================================
// DATE LABEL VISIBILITY
// ============================================================

function shouldShowDateLabel(
  index: number,
  total: number
) {
  if (total <= 7) {
    return true;
  }

  if (
    index === 0 ||
    index === total - 1
  ) {
    return true;
  }

  const step = Math.ceil(
    total / 6
  );

  return index % step === 0;
}

// ============================================================
// Y-AXIS TICKS
// ============================================================

function createYAxisTicks(
  maxValue: number
) {
  if (maxValue <= 5) {
    return Array.from(
      {
        length:
          Math.floor(maxValue) + 1,
      },
      (_, index) => index
    );
  }

  const rawStep =
    maxValue / 4;

  const magnitude =
    Math.pow(
      10,
      Math.floor(
        Math.log10(rawStep)
      )
    );

  const normalized =
    rawStep / magnitude;

  let niceStep: number;

  if (normalized <= 1) {
    niceStep = 1;
  } else if (normalized <= 2) {
    niceStep = 2;
  } else if (normalized <= 5) {
    niceStep = 5;
  } else {
    niceStep = 10;
  }

  niceStep *= magnitude;

  const ticks: number[] = [];

  for (
    let value = 0;
    value <= maxValue;
    value += niceStep
  ) {
    ticks.push(
      Math.round(value)
    );
  }

  if (
    ticks[ticks.length - 1] !==
    maxValue
  ) {
    ticks.push(maxValue);
  }

  return ticks;
}

// ============================================================
// PRIORITY COLORS
// ============================================================

function getPriorityColor(
  name: string,
  index: number
) {
  const value = name
    .toLowerCase()
    .trim();

  if (value === "critical") {
    return "#ef4444";
  }

  if (value === "high") {
    return "#f97316";
  }

  if (value === "medium") {
    return "#eab308";
  }

  if (value === "low") {
    return "#22c55e";
  }

  const fallbackColors = [
    "#8b5cf6",
    "#3b82f6",
    "#06b6d4",
    "#14b8a6",
    "#ec4899",
    "#f59e0b",
  ];

  return fallbackColors[
    index %
      fallbackColors.length
  ];
}