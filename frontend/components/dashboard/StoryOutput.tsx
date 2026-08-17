"use client";

import { useState } from "react";
import type { StoryResponse } from "@/services/storyService";

interface StoryOutputProps {
  storyResult: StoryResponse | null;
  onApproveReview: () => void;
  approvingReview: boolean;
}

export default function StoryOutput({
  storyResult,
  onApproveReview,
  approvingReview,
}: StoryOutputProps) {
  const [copied, setCopied] = useState(false);

  if (!storyResult) {
    return null;
  }

  // ============================================================
  // COPY COMPLETE STORY
  // ============================================================

  const buildFullStoryText = (): string => {
    const acceptanceCriteria =
      storyResult.acceptance_criteria
        ?.map(
          (item) =>
            `${item.id}\n` +
            `Given ${item.given}\n` +
            `When ${item.when}\n` +
            `Then ${item.then}`
        )
        .join("\n") || "N/A";

    const definitionOfDone =
      storyResult.definition_of_done
        ?.map(
          (item, index) =>
            `${index + 1}. ${item}`
        )
        .join("\n") || "N/A";

    const testScenarios =
      storyResult.test_scenarios
        ?.map((testCase, index) => {
          const testCaseId =
            testCase.test_case_id ||
            `TC${String(index + 1).padStart(
              3,
              "0"
            )}`;

          const acceptanceCriteriaIds =
            testCase.acceptance_criteria_ids
              ?.join(", ") || "N/A";

          const steps =
            testCase.steps
              ?.map(
                (step, stepIndex) =>
                  `   ${stepIndex + 1}. ${step}`
              )
              .join("\n") || "N/A";

          return `
${testCaseId}
Scenario: ${
            testCase.scenario || "N/A"
          }

Acceptance Criteria:
${acceptanceCriteriaIds}

Test Type: ${
            testCase.test_type || "N/A"
          }

Preconditions: ${
            testCase.preconditions || "N/A"
          }

Steps:
${steps}

Test Data: ${
            testCase.test_data || "N/A"
          }

Expected Result:
${
            testCase.expected_result || "N/A"
          }

Priority: ${
            testCase.priority || "N/A"
          }
`;
        })
        .join(
          "\n------------------------------\n"
        ) || "N/A";

    const assumptions =
      storyResult.assumptions
        ?.map((item, index) => `${index + 1}. ${item}`)
        .join("\n") || "N/A";

    const dependencies =
      storyResult.dependencies
        ?.map((item, index) => `${index + 1}. ${item}`)
        .join("\n") || "N/A";

    const risks =
      storyResult.risks
        ?.map((risk, index) => {
          const riskId = risk.risk_id || `R${String(index + 1).padStart(3, "0")}`;
          return `${riskId}: ${risk.risk || "N/A"}\n  Category: ${risk.category || "N/A"}\n  Level: ${risk.risk_level || "N/A"}\n  Impact: ${risk.impact || "N/A"} · Likelihood: ${risk.likelihood || "N/A"}\n  Mitigation: ${risk.mitigation || "N/A"}`;
        })
        .join("\n") || "N/A";

    const technicalAnalysis = storyResult.technical_analysis;
    const technicalSummary =
      typeof technicalAnalysis === "object" && technicalAnalysis !== null
        ? (technicalAnalysis as Record<string, unknown>).technical_summary || "N/A"
        : "N/A";

    const traceability =
      storyResult.traceability?.acceptance_criteria?.join(", ") || "N/A";
    const traceabilityTests =
      storyResult.traceability?.test_cases
        ?.map(
          (tc) =>
            `${tc.test_case_id || "Test Case"}: ${tc.acceptance_criteria_ids?.join(", ") || "N/A"}`
        )
        .join("\n") || "N/A";

    return `
============================================================
STORYPILOT AI - USER STORY
============================================================

STORY ID
US-${storyResult.id}

TITLE
${storyResult.title || "N/A"}

FEATURE
${storyResult.feature_name || "N/A"}

MODULE
${storyResult.module || "N/A"}

PRIORITY
${storyResult.priority || "N/A"}

STORY TYPE
${storyResult.story_type || "N/A"}

USER ROLE
${storyResult.user_role || "N/A"}

STORY POINTS
${storyResult.story_points ?? "N/A"}

COMPLEXITY
${storyResult.complexity || "N/A"}


============================================================
BUSINESS VALUE
============================================================

${storyResult.business_value || "N/A"}


============================================================
PRODUCT OUTCOME
============================================================

${storyResult.product_outcome || "N/A"}


============================================================
USER STORY
============================================================

${storyResult.user_story || "N/A"}


============================================================
ASSUMPTIONS
============================================================

${assumptions}


============================================================
DEPENDENCIES
============================================================

${dependencies}


============================================================
ACCEPTANCE CRITERIA
============================================================

${acceptanceCriteria}


============================================================
DEFINITION OF DONE
============================================================

${definitionOfDone}


============================================================
REQUIREMENT SUMMARY
============================================================

${storyResult.requirement_summary || "N/A"}

REQUIREMENT QUALITY
${storyResult.requirement_quality || "N/A"}


============================================================
BUSINESS RULES
============================================================

${(storyResult.business_rules ?? []).length ? (storyResult.business_rules ?? []).map((item, index) => `${index + 1}. ${item}`).join("\n") : "N/A"}


============================================================
PRECONDITIONS
============================================================

${(storyResult.preconditions ?? []).length ? (storyResult.preconditions ?? []).map((item, index) => `${index + 1}. ${item}`).join("\n") : "N/A"}


============================================================
EDGE CASES
============================================================

${(storyResult.edge_cases ?? []).length ? (storyResult.edge_cases ?? []).map((item, index) => `${index + 1}. ${item}`).join("\n") : "N/A"}


============================================================
CLARIFICATION QUESTIONS
============================================================

${(storyResult.clarification_questions ?? []).length ? (storyResult.clarification_questions ?? []).map((item, index) => `${index + 1}. ${item}`).join("\n") : "N/A"}


============================================================
TECHNICAL ANALYSIS
============================================================

${technicalSummary}


============================================================
RISKS
============================================================

${risks}


============================================================
STORY POINT JUSTIFICATION
============================================================

${storyResult.story_point_reason || "N/A"}

ESTIMATION FACTORS
${(storyResult.estimation_factors ?? []).length ? (storyResult.estimation_factors ?? []).map((item, index) => `${index + 1}. ${item}`).join("\n") : "N/A"}

SHOULD SPLIT
${storyResult.should_split ? "Yes" : "No"}${storyResult.split_reason ? `\nREASON: ${storyResult.split_reason}` : ""}


============================================================
TEST SCENARIOS
============================================================

${testScenarios}


============================================================
TRACEABILITY
============================================================

Requirement → User Story → Acceptance Criteria → Test Cases

Acceptance Criteria:
${traceability}

Test Cases:
${traceabilityTests}


============================================================
QUALITY REVIEW
============================================================

Status: ${storyResult.review_status || "N/A"}
Quality Score: ${storyResult.quality_score ?? "N/A"}
${storyResult.review_summary ? `Summary: ${storyResult.review_summary}` : ""}
Approved: ${storyResult.approved_for_final_output ? "Yes" : "No"}


============================================================
END OF STORY
============================================================
`.trim();
  };

  // ============================================================
  // COPY HANDLER
  // ============================================================

  const handleCopyFullStory = async () => {
    try {
      const fullStory = buildFullStoryText();

      await navigator.clipboard.writeText(fullStory);

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error("Failed to copy story:", error);

      alert("Unable to copy the complete story.");
    }
  };

  return (
    <div className="mt-8 space-y-8">
      {/* ======================================================
          COPY
      ====================================================== */}
      <div
        className="
          flex
          flex-col
          gap-4
          rounded-2xl
          border border-indigo-400/20
          bg-slate-900/70
          p-5
          shadow-xl
          sm:flex-row
          sm:items-center
          sm:justify-between
        "
      >
        <div>
          <p className="text-sm font-semibold text-white">
            Generated Story
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Copy the complete story including traceable QA test
            scenarios.
          </p>
        </div>

        <button
          type="button"
          onClick={handleCopyFullStory}
          className="
            inline-flex
            items-center
            justify-center
            gap-2
            rounded-xl
            border
            border-indigo-400/20
            bg-indigo-500/10
            px-5
            py-3
            text-sm
            font-semibold
            text-indigo-300
            transition
            hover:bg-indigo-500/20
            hover:text-indigo-200
          "
        >
          {copied ? "✓ Copied Complete Story" : "📋 Copy Full Story"}
        </button>
      </div>

      {/* ======================================================
          STORY INFORMATION
      ====================================================== */}
      <div
        className="
          rounded-3xl
          border border-white/10
          bg-slate-900/70
          p-6
          shadow-2xl
          lg:p-8
        "
      >
        <div className="mb-6">
          <span
            className="
              text-xs
              font-semibold
              uppercase
              tracking-[0.2em]
              text-indigo-400
            "
          >
            Generated Story
          </span>

          <h2 className="mt-2 text-2xl font-bold text-white">
            {storyResult.title}
          </h2>
        </div>

        {/* ==================================================
            BASIC INFORMATION
        ================================================== */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <InfoCard label="Story ID" value={`US-${storyResult.id}`} />
          <InfoCard label="Feature" value={storyResult.feature_name} />
          <InfoCard label="Module" value={storyResult.module} />
          <InfoCard label="Priority" value={storyResult.priority} />
          <InfoCard label="Story Type" value={storyResult.story_type} />
          <InfoCard label="User Role" value={storyResult.user_role} />
          <InfoCard label="Complexity" value={storyResult.complexity} />
          <InfoCard
            label="Story Points"
            value={String(storyResult.story_points ?? "N/A")}
          />
        </div>

        {/* ==================================================
            USER STORY
        ================================================== */}
        <Section title="User Story">
          <div
            className="
              rounded-xl
              border border-indigo-400/10
              bg-slate-800/60
              p-5
              leading-7
              text-slate-200
            "
          >
            {storyResult.user_story}
          </div>
        </Section>

        {/* ==================================================
            BUSINESS VALUE
        ================================================== */}
        <Section title="Business Value">
          <div className="rounded-xl border border-white/10 bg-slate-800/50 p-5 leading-7 text-slate-300">
            {storyResult.business_value}
          </div>
        </Section>

        {/* ==================================================
            PRODUCT OUTCOME
        ================================================== */}
        {storyResult.product_outcome && (
          <Section title="Product Outcome">
            <div className="rounded-xl border border-cyan-500/10 bg-cyan-500/5 p-5 leading-7 text-slate-300">
              {storyResult.product_outcome}
            </div>
          </Section>
        )}

        {/* ==================================================
            ASSUMPTIONS & DEPENDENCIES
        ================================================== */}
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <ListSection
            title="Assumptions"
            items={storyResult.assumptions ?? []}
            emptyText="No assumptions recorded."
          />
          <ListSection
            title="Dependencies"
            items={storyResult.dependencies ?? []}
            emptyText="No dependencies recorded."
          />
        </div>

        {/* ==================================================
            ACCEPTANCE CRITERIA
        ================================================== */}
        <Section title="Acceptance Criteria">
          <ul className="space-y-3">
            {storyResult.acceptance_criteria?.map(
              (criterion, index) => (
                <li
                  key={criterion.id || index}
                  className="flex gap-3 rounded-xl border border-white/10 bg-slate-800/50 p-4 text-slate-300"
                >
                  <span className="shrink-0 rounded-lg bg-indigo-500/20 px-2.5 py-1 text-xs font-bold text-indigo-300">
                    {criterion.id}
                  </span>
                  <div className="space-y-2 leading-6">
                    <p>
                      <span className="font-semibold text-violet-300">
                        Given:
                      </span>{" "}
                      {criterion.given}
                    </p>
                    <p>
                      <span className="font-semibold text-sky-300">
                        When:
                      </span>{" "}
                      {criterion.when}
                    </p>
                    <p>
                      <span className="font-semibold text-emerald-300">
                        Then:
                      </span>{" "}
                      {criterion.then}
                    </p>
                  </div>
                </li>
              )
            )}
          </ul>
        </Section>

        {/* ==================================================
            DEFINITION OF DONE
        ================================================== */}
        <Section title="Definition of Done">
          <ul className="space-y-3">
            {storyResult.definition_of_done?.map((item, index) => (
              <li
                key={index}
                className="flex gap-3 rounded-xl border border-white/10 bg-slate-800/50 p-4 text-slate-300"
              >
                <span className="text-green-400">✓</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Section>

        {/* ==================================================
            BUSINESS ANALYST SECTION
        ================================================== */}
        {(storyResult.requirement_summary ||
          storyResult.requirement_quality ||
          (storyResult.business_rules ?? []).length > 0 ||
          (storyResult.preconditions ?? []).length > 0) && (
          <Section title="Business Analysis">
            <div className="space-y-4">
              {storyResult.requirement_summary && (
                <div className="rounded-xl border border-amber-500/10 bg-amber-500/5 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-400">
                    Requirement Summary
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    {storyResult.requirement_summary}
                  </p>
                </div>
              )}

              {storyResult.requirement_quality && (
                <div className="rounded-xl border border-amber-500/10 bg-amber-500/5 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-400">
                    Requirement Quality
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    {storyResult.requirement_quality}
                  </p>
                </div>
              )}

              {(storyResult.business_rules ?? []).length > 0 && (
                <div className="rounded-xl border border-amber-500/10 bg-amber-500/5 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-400">
                    Business Rules
                  </p>
                  <ul className="mt-2 space-y-2 text-sm leading-6 text-slate-300">
                    {(storyResult.business_rules ?? []).map((rule, index) => (
                      <li key={`${rule}-${index}`}>• {rule}</li>
                    ))}
                  </ul>
                </div>
              )}

              {(storyResult.preconditions ?? []).length > 0 && (
                <div className="rounded-xl border border-amber-500/10 bg-amber-500/5 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-400">
                    Preconditions
                  </p>
                  <ul className="mt-2 space-y-2 text-sm leading-6 text-slate-300">
                    {(storyResult.preconditions ?? []).map((pre, index) => (
                      <li key={`${pre}-${index}`}>• {pre}</li>
                    ))}
                  </ul>
                </div>
              )}

              {(storyResult.edge_cases ?? []).length > 0 && (
                <div className="rounded-xl border border-amber-500/10 bg-amber-500/5 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-400">
                    Edge Cases
                  </p>
                  <ul className="mt-2 space-y-2 text-sm leading-6 text-slate-300">
                    {(storyResult.edge_cases ?? []).map((edge, index) => (
                      <li key={`${edge}-${index}`}>• {edge}</li>
                    ))}
                  </ul>
                </div>
              )}

              {(storyResult.clarification_questions ?? []).length > 0 && (
                <div className="rounded-xl border border-amber-500/10 bg-amber-500/5 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-400">
                    Clarification Questions
                  </p>
                  <ul className="mt-2 space-y-2 text-sm leading-6 text-slate-300">
                    {(storyResult.clarification_questions ?? []).map(
                      (question, index) => (
                        <li key={`${question}-${index}`}>• {question}</li>
                      )
                    )}
                  </ul>
                </div>
              )}
            </div>
          </Section>
        )}

        {/* ==================================================
            TECHNICAL ANALYSIS
        ================================================== */}
        {storyResult.technical_analysis &&
          Object.keys(storyResult.technical_analysis).length > 0 && (
            <TechnicalAnalysisSection
              technical={storyResult.technical_analysis}
            />
          )}
      </div>

      {/* ======================================================
          TEST SCENARIOS
      ====================================================== */}
      <div
        className="
          rounded-3xl
          border border-white/10
          bg-slate-900/70
          p-6
          shadow-2xl
          lg:p-8
        "
      >
        <div className="mb-6">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-purple-400">
            QA Coverage
          </span>
          <h2 className="mt-2 text-2xl font-bold text-white">
            Test Scenarios
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Test cases generated from the requirement, user story and
            acceptance criteria with explicit traceability.
          </p>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-white/10">
          <table className="min-w-[1700px] w-full border-collapse">
            <thead>
              <tr className="bg-slate-800">
                <TableHeader>TC ID</TableHeader>
                <TableHeader>AC IDs</TableHeader>
                <TableHeader>Scenario</TableHeader>
                <TableHeader>Test Type</TableHeader>
                <TableHeader>Preconditions</TableHeader>
                <TableHeader>Steps</TableHeader>
                <TableHeader>Test Data</TableHeader>
                <TableHeader>Expected Result</TableHeader>
                <TableHeader>Priority</TableHeader>
              </tr>
            </thead>
            <tbody>
              {storyResult.test_scenarios?.map((testCase, index) => {
                const testCaseId =
                  testCase.test_case_id ||
                  `TC${String(index + 1).padStart(3, "0")}`;

                return (
                  <tr
                    key={testCaseId}
                    className="border-b border-white/5 bg-slate-900/40 transition hover:bg-slate-800/70"
                  >
                    <td className="whitespace-nowrap px-4 py-5 align-top text-sm">
                      <span className="inline-flex rounded-lg bg-indigo-500/15 px-3 py-1 font-bold text-indigo-300">
                        {testCaseId}
                      </span>
                    </td>

                    <td className="min-w-[160px] px-4 py-5 align-top">
                      <div className="flex flex-wrap gap-2">
                        {testCase.acceptance_criteria_ids?.length ? (
                          testCase.acceptance_criteria_ids.map((id) => (
                            <span
                              key={id}
                              className="rounded-md bg-indigo-500/10 px-2 py-1 text-xs font-semibold text-indigo-300"
                            >
                              {id}
                            </span>
                          ))
                        ) : (
                          <span className="text-sm text-slate-500">N/A</span>
                        )}
                      </div>
                    </td>

                    <td className="min-w-[220px] px-4 py-5 align-top text-sm font-semibold text-white">
                      {testCase.scenario || "N/A"}
                    </td>

                    <td className="whitespace-nowrap px-4 py-5 align-top">
                      <span className="inline-flex rounded-full bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-300">
                        {testCase.test_type || "Functional"}
                      </span>
                    </td>

                    <td className="min-w-[220px] px-4 py-5 align-top text-sm leading-6 text-slate-300">
                      {testCase.preconditions || "N/A"}
                    </td>

                    <td className="min-w-[300px] px-4 py-5 align-top">
                      {testCase.steps && testCase.steps.length > 0 ? (
                        <ol className="space-y-2">
                          {testCase.steps.map((step, stepIndex) => (
                            <li
                              key={stepIndex}
                              className="flex gap-2 text-sm leading-6 text-slate-300"
                            >
                              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-700 text-[10px] text-slate-300">
                                {stepIndex + 1}
                              </span>
                              <span>{step}</span>
                            </li>
                          ))}
                        </ol>
                      ) : (
                        <span className="text-sm text-slate-500">N/A</span>
                      )}
                    </td>

                    <td className="min-w-[200px] px-4 py-5 align-top text-sm leading-6 text-slate-300">
                      {testCase.test_data || "N/A"}
                    </td>

                    <td className="min-w-[280px] px-4 py-5 align-top text-sm leading-6 text-slate-300">
                      {testCase.expected_result || "N/A"}
                    </td>

                    <td className="whitespace-nowrap px-4 py-5 align-top">
                      <PriorityBadge priority={testCase.priority} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ======================================================
          RISK & STORY POINT JUSTIFICATION
      ====================================================== */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-3xl border border-amber-500/20 bg-amber-500/5 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-400">
            Story Point Justification
          </p>
          <p className="mt-3 text-3xl font-bold text-white">
            {storyResult.story_points}
          </p>

          {storyResult.complexity && (
            <p className="mt-2 text-sm text-slate-400">
              Complexity: {storyResult.complexity}
            </p>
          )}

          <p className="mt-3 text-sm leading-6 text-slate-300">
            {storyResult.story_point_reason || "No estimation rationale recorded."}
          </p>

          {(storyResult.estimation_factors ?? []).length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-400">
                Estimation Factors
              </p>
              <ul className="mt-2 space-y-2 text-sm leading-6 text-slate-300">
                {(storyResult.estimation_factors ?? []).map((factor, index) => (
                  <li key={`${factor}-${index}`}>• {factor}</li>
                ))}
              </ul>
            </div>
          )}

          {storyResult.should_split && (
            <p className="mt-3 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-200">
              ⚠ Suggested split: {storyResult.split_reason || "Story should be split."}
            </p>
          )}
        </section>

        <section className="rounded-3xl border border-rose-500/20 bg-rose-500/5 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-400">
            Risks
          </p>
          <p className="mt-2 text-sm text-rose-200">
            {storyResult.risk_summary || storyResult.overall_risk_level || "No risk summary recorded."}
          </p>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
            {(storyResult.risks ?? []).map((risk, index) => (
              <li
                key={`${risk.risk_id ?? risk.risk ?? index}-${index}`}
                className="rounded-xl border border-rose-500/10 bg-black/10 p-3"
              >
                <p className="font-medium text-slate-200">
                  {risk.risk || "No validated risk description recorded."}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  {[risk.category, risk.risk_level, risk.impact, risk.likelihood]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                {risk.mitigation && (
                  <p className="mt-2 text-sm text-slate-300">
                    Mitigation: {risk.mitigation}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* ======================================================
          TRACEABILITY
      ====================================================== */}
      <section className="rounded-3xl border border-cyan-500/20 bg-cyan-500/5 p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-400">
          Traceability
        </p>
        <p className="mt-3 text-sm text-slate-300">
          Requirement → User Story → Acceptance Criteria → Test Cases
        </p>
        <p className="mt-3 text-sm text-slate-400">
          Acceptance Criteria:{" "}
          {(storyResult.traceability?.acceptance_criteria ?? []).join(", ") || "N/A"}
        </p>
        {(storyResult.traceability?.requirements ?? []).map((requirement) => (
          <p key={requirement.id} className="mt-2 text-sm text-slate-300">
            <span className="font-medium text-cyan-200">{requirement.id}</span>: {requirement.description} → {requirement.acceptance_criteria_ids.join(", ") || "Unmapped"}
          </p>
        ))}
        <div className="mt-3 flex flex-wrap gap-2">
          {(storyResult.traceability?.test_cases ?? []).map((testCase, index) => (
            <span
              key={`${testCase.test_case_id ?? index}-${index}`}
              className="rounded-lg bg-cyan-500/10 px-3 py-1 text-xs text-cyan-200"
            >
              {testCase.test_case_id || "Test Case"}:{" "}
              {(testCase.acceptance_criteria_ids ?? []).join(", ") || "N/A"}
            </span>
          ))}
        </div>
      </section>

      {/* ======================================================
          QUALITY REVIEW
      ====================================================== */}
      <section className="rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-400">
          Quality Review
        </p>

        <div className="mt-3 flex flex-wrap gap-3">
          <span className="rounded-lg bg-emerald-500/10 px-3 py-1 text-sm font-semibold text-emerald-300">
            Status: {storyResult.review_status || "N/A"}
          </span>
          <span className="rounded-lg bg-emerald-500/10 px-3 py-1 text-sm font-semibold text-emerald-300">
            Score: {storyResult.quality_score ?? "N/A"}/100
          </span>
          <span className="rounded-lg bg-emerald-500/10 px-3 py-1 text-sm font-semibold text-emerald-300">
            Approved: {storyResult.approved_for_final_output ? "Yes" : "No"}
          </span>
        </div>

        {!storyResult.approved_for_final_output && (
          <button
            type="button"
            onClick={onApproveReview}
            disabled={approvingReview}
            className="mt-4 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {approvingReview ? "Approving review..." : "Approve review"}
          </button>
        )}

        {storyResult.review_summary && (
          <p className="mt-3 text-sm leading-6 text-slate-300">
            {storyResult.review_summary}
          </p>
        )}

        {Array.isArray(storyResult.quality_review?.findings) &&
          storyResult.quality_review.findings.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-400">
                Validation Findings
              </p>
              <ul className="mt-2 space-y-2 text-sm leading-6 text-slate-300">
                {storyResult.quality_review.findings.map((finding, index) => {
                  const item = finding as Record<string, unknown>;
                  const severity = String(item.severity || "Medium");
                  const issue = String(item.issue || "Quality finding");
                  const evidence = String(item.evidence || "");

                  return (
                    <li key={`${issue}-${index}`} className="rounded-lg border border-emerald-500/10 bg-black/10 p-3">
                      <span className="font-semibold text-emerald-200">{severity}: {issue}</span>
                      {evidence && <p className="mt-1 text-slate-400">{evidence}</p>}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

        {(storyResult.recommendations ?? []).length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-400">
              Recommendations
            </p>
            <ul className="mt-2 space-y-2 text-sm leading-6 text-slate-300">
              {(storyResult.recommendations ?? []).map((rec, index) => (
                <li key={`${rec}-${index}`}>• {rec}</li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}

// ============================================================
// TECHNICAL ANALYSIS SECTION
// ============================================================

function TechnicalAnalysisSection({
  technical,
}: {
  technical: Record<string, unknown>;
}) {
  const technicalSummary = technical.technical_summary as string | undefined;

  const frontend = technical.frontend as
    | { required?: boolean; changes?: string[] }
    | undefined;
  const backend = technical.backend as
    | { required?: boolean; changes?: string[] }
    | undefined;
  const api = technical.api as
    | { required?: boolean; changes?: Array<Record<string, unknown>> }
    | undefined;
  const database = technical.database as
    | { required?: boolean; changes?: string[] }
    | undefined;
  const security = technical.security as
    | Array<{ requirement?: string; acceptance_criteria_ids?: string[] }>
    | undefined;

  const integrations = technical.integrations as string[] | undefined;
  const dependencies = technical.dependencies as string[] | undefined;
  const assumptions = technical.assumptions as string[] | undefined;
  const errorHandling = technical.error_handling as string[] | undefined;
  const logging = technical.logging_and_monitoring as string[] | undefined;
  const performance = technical.performance_considerations as string[] | undefined;
  const testing = technical.testing_considerations as string[] | undefined;

  const hasContent =
    technicalSummary ||
    frontend?.changes?.length ||
    backend?.changes?.length ||
    api?.changes?.length ||
    database?.changes?.length ||
    security?.length ||
    integrations?.length ||
    dependencies?.length ||
    assumptions?.length ||
    errorHandling?.length ||
    logging?.length ||
    performance?.length ||
    testing?.length;

  if (!hasContent) {
    return null;
  }

  return (
    <Section title="Technical Analysis">
      <div className="space-y-4">
        {technicalSummary && (
          <div className="rounded-xl border border-sky-500/10 bg-sky-500/5 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-sky-400">
              Technical Summary
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              {technicalSummary}
            </p>
          </div>
        )}

        {frontend?.changes?.length ? (
          <div className="rounded-xl border border-sky-500/10 bg-sky-500/5 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-sky-400">
              Frontend Changes
            </p>
            <ul className="mt-2 space-y-2 text-sm leading-6 text-slate-300">
              {frontend.changes.map((change, index) => (
                <li key={`${change}-${index}`}>• {change}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {backend?.changes?.length ? (
          <div className="rounded-xl border border-sky-500/10 bg-sky-500/5 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-sky-400">
              Backend Changes
            </p>
            <ul className="mt-2 space-y-2 text-sm leading-6 text-slate-300">
              {backend.changes.map((change, index) => (
                <li key={`${change}-${index}`}>• {change}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {api?.changes?.length ? (
          <div className="rounded-xl border border-sky-500/10 bg-sky-500/5 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-sky-400">
              API Changes
            </p>
            <ul className="mt-2 space-y-2 text-sm leading-6 text-slate-300">
              {api.changes.map((change, index) => {
                const method = String(change.method || "Method");
                const purpose = String(
                  change.purpose || change.description || ""
                );
                const acIds = change.acceptance_criteria_ids as
                  | string[]
                  | undefined;

                return (
                  <li key={`${method}-${index}`}>
                    • {method}: {purpose}
                    {acIds?.length
                      ? ` (AC: ${acIds.join(", ")})`
                      : ""}
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}

        {database?.changes?.length ? (
          <div className="rounded-xl border border-sky-500/10 bg-sky-500/5 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-sky-400">
              Database Changes
            </p>
            <ul className="mt-2 space-y-2 text-sm leading-6 text-slate-300">
              {database.changes.map((change, index) => (
                <li key={`${change}-${index}`}>• {change}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {security?.length ? (
          <div className="rounded-xl border border-sky-500/10 bg-sky-500/5 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-sky-400">
              Security Requirements
            </p>
            <ul className="mt-2 space-y-2 text-sm leading-6 text-slate-300">
              {security.map((item, index) => (
                <li key={`${item.requirement}-${index}`}>
                  • {item.requirement}
                  {item.acceptance_criteria_ids?.length
                    ? ` (AC: ${item.acceptance_criteria_ids.join(", ")})`
                    : ""}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {integrations?.length ? (
          <div className="rounded-xl border border-sky-500/10 bg-sky-500/5 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-sky-400">
              Integrations
            </p>
            <ul className="mt-2 space-y-2 text-sm leading-6 text-slate-300">
              {integrations.map((item, index) => (
                <li key={`${item}-${index}`}>• {item}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {dependencies?.length ? (
          <div className="rounded-xl border border-sky-500/10 bg-sky-500/5 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-sky-400">
              Technical Dependencies
            </p>
            <ul className="mt-2 space-y-2 text-sm leading-6 text-slate-300">
              {dependencies.map((item, index) => (
                <li key={`${item}-${index}`}>• {item}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {assumptions?.length ? (
          <div className="rounded-xl border border-sky-500/10 bg-sky-500/5 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-sky-400">
              Technical Assumptions
            </p>
            <ul className="mt-2 space-y-2 text-sm leading-6 text-slate-300">
              {assumptions.map((item, index) => (
                <li key={`${item}-${index}`}>• {item}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {errorHandling?.length ? (
          <div className="rounded-xl border border-sky-500/10 bg-sky-500/5 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-sky-400">
              Error Handling
            </p>
            <ul className="mt-2 space-y-2 text-sm leading-6 text-slate-300">
              {errorHandling.map((item, index) => (
                <li key={`${item}-${index}`}>• {item}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {logging?.length ? (
          <div className="rounded-xl border border-sky-500/10 bg-sky-500/5 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-sky-400">
              Logging & Monitoring
            </p>
            <ul className="mt-2 space-y-2 text-sm leading-6 text-slate-300">
              {logging.map((item, index) => (
                <li key={`${item}-${index}`}>• {item}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {performance?.length ? (
          <div className="rounded-xl border border-sky-500/10 bg-sky-500/5 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-sky-400">
              Performance Considerations
            </p>
            <ul className="mt-2 space-y-2 text-sm leading-6 text-slate-300">
              {performance.map((item, index) => (
                <li key={`${item}-${index}`}>• {item}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {testing?.length ? (
          <div className="rounded-xl border border-sky-500/10 bg-sky-500/5 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-sky-400">
              Testing Considerations
            </p>
            <ul className="mt-2 space-y-2 text-sm leading-6 text-slate-300">
              {testing.map((item, index) => (
                <li key={`${item}-${index}`}>• {item}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </Section>
  );
}

// ============================================================
// LIST SECTION
// ============================================================

function ListSection({
  title,
  items,
  emptyText,
}: {
  title: string;
  items: string[];
  emptyText: string;
}) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
        {title}
      </p>
      {items.length ? (
        <ul className="mt-4 space-y-2 text-sm leading-6 text-slate-300">
          {items.map((item, index) => (
            <li key={`${item}-${index}`}>• {item}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-slate-500">{emptyText}</p>
      )}
    </section>
  );
}

// ============================================================
// TABLE HEADER
// ============================================================

function TableHeader({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <th
      className="
        whitespace-nowrap
        border-b border-white/10
        px-4
        py-4
        text-left
        text-xs
        font-semibold
        uppercase
        tracking-wide
        text-indigo-300
      "
    >
      {children}
    </th>
  );
}

// ============================================================
// INFO CARD
// ============================================================

function InfoCard({
  label,
  value,
}: {
  label: string;
  value?: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-800/50 p-4">
      <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </span>
      <p className="mt-2 font-semibold text-white">{value || "N/A"}</p>
    </div>
  );
}

// ============================================================
// SECTION
// ============================================================

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8">
      <h3 className="mb-4 text-lg font-semibold text-white">{title}</h3>
      {children}
    </section>
  );
}

// ============================================================
// PRIORITY BADGE
// ============================================================

function PriorityBadge({
  priority,
}: {
  priority?: string;
}) {
  const value = priority || "N/A";

  let className = "bg-slate-700/50 text-slate-300";

  if (value === "Critical") {
    className = "bg-red-500/20 text-red-200";
  } else if (value === "High") {
    className = "bg-red-500/10 text-red-300";
  } else if (value === "Medium") {
    className = "bg-yellow-500/10 text-yellow-300";
  } else if (value === "Low") {
    className = "bg-green-500/10 text-green-300";
  }

  return (
    <span
      className={`
        inline-flex
        rounded-full
        px-3
        py-1
        text-xs
        font-semibold
        ${className}
      `}
    >
      {value}
    </span>
  );
}
