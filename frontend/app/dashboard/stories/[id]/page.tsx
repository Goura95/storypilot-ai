"use client";

import {
  useEffect,
  useState,
  type ReactNode,
  type ChangeEvent,
} from "react";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

import jsPDF from "jspdf";

import {
  Document as WordDocument,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
} from "docx";

import { saveAs } from "file-saver";

import {
  approveStoryReview,
  getStoryById,
  deleteStory,
  type StoryResponse,
  type TestScenario,
} from "@/services/storyService";

// ============================================================
// TYPES
// ============================================================

type ExportFormat = "" | "pdf" | "docx";

// ============================================================
// PAGE
// ============================================================

export default function StoryDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const storyId = Number(params.id);

  const [story, setStory] =
    useState<StoryResponse | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [deleting, setDeleting] =
    useState(false);

  const [approvingReview, setApprovingReview] =
    useState(false);

  const [exporting, setExporting] =
    useState(false);

  const [exportFormat, setExportFormat] =
    useState<ExportFormat>("");

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [copied, setCopied] =
    useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] =
    useState(false);

  // ==========================================================
  // LOAD STORY
  // ==========================================================

  useEffect(() => {
    async function loadStory() {
      try {
        setLoading(true);
        setError("");

        if (!storyId || Number.isNaN(storyId)) {
          setError("Invalid story ID.");
          return;
        }

        const data =
          await getStoryById(storyId);

        setStory(data);
      } catch (loadError) {
        console.error(
          "Failed to load story:",
          loadError
        );

        setError(
          "Unable to load this story. Please try again."
        );
      } finally {
        setLoading(false);
      }
    }

    loadStory();
  }, [storyId]);

  // ==========================================================
  // SAFE FILE NAME
  // ==========================================================

  const createSafeFileName = (
    title: string
  ): string => {
    const safeName = title
      .trim()
      .replace(/[<>:"/\\|?*\x00-\x1F]/g, "")
      .replace(/\s+/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_+|_+$/g, "");

    return safeName || "User_Story";
  };

  // ==========================================================
  // BUILD STORY TEXT
  // ==========================================================

  const buildFullStoryText = (
    currentStory: StoryResponse
  ): string => {
    const acceptanceCriteria =
      currentStory.acceptance_criteria ?? [];

    const definitionOfDone =
      currentStory.definition_of_done ?? [];

    const testScenarios =
      currentStory.test_scenarios ?? [];

    const acceptanceText =
      acceptanceCriteria.length > 0
        ? acceptanceCriteria
            .map(
              (item) => (
                `- ${item.id}\n` +
                `  Given ${item.given}\n` +
                `  When ${item.when}\n` +
                `  Then ${item.then}`
              )
            )
            .join("\n")
        : "N/A";

    const definitionText =
      definitionOfDone.length > 0
        ? definitionOfDone
            .map(
              (item) => `- ${item}`
            )
            .join("\n")
        : "N/A";

    const testScenarioText =
      testScenarios.length > 0
        ? testScenarios
            .map(
              (testCase, testIndex) => {
                const testCaseId =
                  testCase.test_case_id ||
                  `TC${String(
                    testIndex + 1
                  ).padStart(3, "0")}`;

                const steps =
                  testCase.steps ?? [];

                const stepText =
                  steps.length > 0
                    ? steps
                        .map(
                          (step, stepIndex) =>
                            `   ${
                              stepIndex + 1
                            }. ${step}`
                        )
                        .join("\n")
                    : "   N/A";

                return `
${testCaseId}
Scenario:
${testCase.scenario || "N/A"}

Priority:
${testCase.priority || "N/A"}

Preconditions:
${testCase.preconditions || "N/A"}

Steps:
${stepText}

Test Data:
${testCase.test_data || "N/A"}

Expected Result:
${testCase.expected_result || "N/A"}
`;
              }
            )
            .join(
              "\n------------------------------\n"
            )
        : "N/A";

    return `
STORYPILOT AI
USER STORY
============================================================

TITLE
${currentStory.title || "N/A"}

FEATURE
${currentStory.feature_name || "N/A"}

MODULE
${currentStory.module || "N/A"}

PRIORITY
${currentStory.priority || "N/A"}

STORY TYPE
${currentStory.story_type || "N/A"}

STORY POINTS
${currentStory.story_points ?? "N/A"}


============================================================
BUSINESS VALUE
============================================================

${currentStory.business_value || "N/A"}


============================================================
USER STORY
============================================================

${currentStory.user_story || "N/A"}


============================================================
ACCEPTANCE CRITERIA
============================================================

${acceptanceText}


============================================================
DEFINITION OF DONE
============================================================

${definitionText}


============================================================
TEST SCENARIOS
============================================================

${testScenarioText}


============================================================
END OF STORY
============================================================
`.trim();
  };

  // ==========================================================
  // COPY FULL STORY
  // ==========================================================

  const handleCopyFullStory = async () => {
    if (!story) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        buildFullStoryText(story)
      );

      setCopied(true);
      setSuccess("");

      window.setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (copyError) {
      console.error(
        "Failed to copy story:",
        copyError
      );

      setError(
        "Unable to copy the complete story."
      );
    }
  };

  // ==========================================================
  // PDF EXPORT
  // ==========================================================

  const handleExportPdf = () => {
    if (!story) {
      return;
    }

    try {
      setExporting(true);
      setError("");
      setSuccess("");

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth =
        pdf.internal.pageSize.getWidth();

      const pageHeight =
        pdf.internal.pageSize.getHeight();

      const margin = 18;

      const usableWidth =
        pageWidth - margin * 2;

      let currentY = margin;

      // ------------------------------------------------------
      // PAGE SPACE
      // ------------------------------------------------------

      const checkPageSpace = (
        requiredHeight: number
      ) => {
        if (
          currentY + requiredHeight >
          pageHeight - margin
        ) {
          pdf.addPage();
          currentY = margin;
        }
      };

      // ------------------------------------------------------
      // TITLE
      // ------------------------------------------------------

      pdf.setFont(
        "helvetica",
        "bold"
      );

      pdf.setFontSize(20);

      pdf.setTextColor(
        79,
        70,
        229
      );

      pdf.text(
        "StoryPilot AI",
        margin,
        currentY
      );

      currentY += 10;

      pdf.setFontSize(16);

      pdf.setTextColor(
        30,
        30,
        40
      );

      const titleLines =
        pdf.splitTextToSize(
          story.title || "User Story",
          usableWidth
        );

      checkPageSpace(
        titleLines.length * 8 + 8
      );

      pdf.text(
        titleLines,
        margin,
        currentY
      );

      currentY +=
        titleLines.length * 8 + 6;

      // ------------------------------------------------------
      // HELPER: ADD HEADING
      // ------------------------------------------------------

      const addHeading = (
        title: string
      ) => {
        checkPageSpace(14);

        pdf.setFont(
          "helvetica",
          "bold"
        );

        pdf.setFontSize(12);

        pdf.setTextColor(
          79,
          70,
          229
        );

        pdf.text(
          title,
          margin,
          currentY
        );

        currentY += 7;
      };

      // ------------------------------------------------------
      // HELPER: ADD TEXT
      // ------------------------------------------------------

      const addText = (
        text: string,
        fontSize = 10
      ) => {
        const safeText =
          text || "N/A";

        pdf.setFont(
          "helvetica",
          "normal"
        );

        pdf.setFontSize(
          fontSize
        );

        pdf.setTextColor(
          55,
          65,
          81
        );

        const lines =
          pdf.splitTextToSize(
            safeText,
            usableWidth
          );

        for (
          const line of lines
        ) {
          checkPageSpace(6);

          pdf.text(
            line,
            margin,
            currentY
          );

          currentY += 5;
        }

        currentY += 2;
      };

      // ------------------------------------------------------
      // STORY INFORMATION
      // ------------------------------------------------------

      addHeading(
        "Story Information"
      );

      addText(
        `Feature: ${
          story.feature_name || "N/A"
        }`
      );

      addText(
        `Module: ${
          story.module || "N/A"
        }`
      );

      addText(
        `Priority: ${
          story.priority || "N/A"
        }`
      );

      addText(
        `Story Type: ${
          story.story_type || "N/A"
        }`
      );

      addText(
        `Story Points: ${
          story.story_points ?? "N/A"
        }`
      );

      // ------------------------------------------------------
      // BUSINESS VALUE
      // ------------------------------------------------------

      addHeading(
        "Business Value"
      );

      addText(
        story.business_value ||
          "N/A"
      );

      // ------------------------------------------------------
      // USER STORY
      // ------------------------------------------------------

      addHeading(
        "User Story"
      );

      addText(
        story.user_story ||
          "N/A"
      );

      // ------------------------------------------------------
      // ACCEPTANCE CRITERIA
      // ------------------------------------------------------

      addHeading(
        "Acceptance Criteria"
      );

      const acceptanceCriteria =
        story.acceptance_criteria ?? [];

      if (
        acceptanceCriteria.length ===
        0
      ) {
        addText("N/A");
      } else {
        acceptanceCriteria.forEach(
          (item, itemIndex) => {
            addText(
              `${itemIndex + 1}. ${item.id}\n` +
              `Given ${item.given}\n` +
              `When ${item.when}\n` +
              `Then ${item.then}`
            );
          }
        );
      }

      // ------------------------------------------------------
      // DEFINITION OF DONE
      // ------------------------------------------------------

      addHeading(
        "Definition of Done"
      );

      const definitionOfDone =
        story.definition_of_done ?? [];

      if (
        definitionOfDone.length ===
        0
      ) {
        addText("N/A");
      } else {
        definitionOfDone.forEach(
          (item) => {
            addText(`✓ ${item}`);
          }
        );
      }

      // ------------------------------------------------------
      // TEST SCENARIOS
      // ------------------------------------------------------

      addHeading(
        "Test Scenarios"
      );

      const testScenarios =
        story.test_scenarios ?? [];

      if (
        testScenarios.length ===
        0
      ) {
        addText("No test scenarios available.");
      } else {
        testScenarios.forEach(
          (
            testCase,
            testIndex
          ) => {
            const testCaseId =
              testCase.test_case_id ||
              `TC${String(
                testIndex + 1
              ).padStart(3, "0")}`;

            checkPageSpace(20);

            pdf.setFont(
              "helvetica",
              "bold"
            );

            pdf.setFontSize(11);

            pdf.setTextColor(
              79,
              70,
              229
            );

            pdf.text(
              testCaseId,
              margin,
              currentY
            );

            currentY += 7;

            addText(
              `Scenario: ${
                testCase.scenario ||
                "N/A"
              }`
            );

            addText(
              `Priority: ${
                testCase.priority ||
                "N/A"
              }`
            );

            addText(
              `Preconditions: ${
                testCase.preconditions ||
                "N/A"
              }`
            );

            addText(
              "Steps:"
            );

            const steps =
              testCase.steps ?? [];

            if (
              steps.length === 0
            ) {
              addText(
                "  N/A"
              );
            } else {
              steps.forEach(
                (
                  step,
                  stepIndex
                ) => {
                  addText(
                    `  ${
                      stepIndex + 1
                    }. ${step}`
                  );
                }
              );
            }

            addText(
              `Test Data: ${
                testCase.test_data ||
                "N/A"
              }`
            );

            addText(
              `Expected Result: ${
                testCase.expected_result ||
                "N/A"
              }`
            );

            currentY += 3;
          }
        );
      }

      // ------------------------------------------------------
      // FOOTER ON ALL PAGES
      // ------------------------------------------------------

      const totalPages =
        pdf.getNumberOfPages();

      for (
        let pageNumber = 1;
        pageNumber <= totalPages;
        pageNumber++
      ) {
        pdf.setPage(
          pageNumber
        );

        pdf.setFont(
          "helvetica",
          "normal"
        );

        pdf.setFontSize(8);

        pdf.setTextColor(
          120,
          120,
          120
        );

        pdf.text(
          `StoryPilot AI • Page ${pageNumber} of ${totalPages}`,
          pageWidth / 2,
          pageHeight - 8,
          {
            align: "center",
          }
        );
      }

      const fileName =
        `${createSafeFileName(
          story.title ||
            "User_Story"
        )}.pdf`;

      pdf.save(fileName);

      setSuccess(
        "PDF exported successfully."
      );
    } catch (exportError) {
      console.error(
        "Failed to export PDF:",
        exportError
      );

      setError(
        "Unable to export the story as PDF."
      );
    } finally {
      setExporting(false);
      setExportFormat("");
    }
  };

  // ==========================================================
  // WORD EXPORT
  // ==========================================================

  const handleExportWord =
    async () => {
      if (!story) {
        return;
      }

      try {
        setExporting(true);
        setError("");
        setSuccess("");

        const children: Paragraph[] =
          [];

        // ----------------------------------------------------
        // TITLE
        // ----------------------------------------------------

        children.push(
          new Paragraph({
            text: "StoryPilot AI",
            heading:
              HeadingLevel.TITLE,
          })
        );

        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text:
                  story.title ||
                  "User Story",
                bold: true,
                size: 32,
              }),
            ],
            spacing: {
              after: 240,
            },
          })
        );

        // ----------------------------------------------------
        // STORY INFORMATION
        // ----------------------------------------------------

        children.push(
          new Paragraph({
            text: "Story Information",
            heading:
              HeadingLevel.HEADING_1,
          })
        );

        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: "Feature: ",
                bold: true,
              }),
              new TextRun(
                story.feature_name ||
                  "N/A"
              ),
            ],
          })
        );

        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: "Module: ",
                bold: true,
              }),
              new TextRun(
                story.module ||
                  "N/A"
              ),
            ],
          })
        );

        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: "Priority: ",
                bold: true,
              }),
              new TextRun(
                story.priority ||
                  "N/A"
              ),
            ],
          })
        );

        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: "Story Type: ",
                bold: true,
              }),
              new TextRun(
                story.story_type ||
                  "N/A"
              ),
            ],
          })
        );

        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text:
                  "Story Points: ",
                bold: true,
              }),
              new TextRun(
                String(
                  story.story_points ??
                    "N/A"
                )
              ),
            ],
            spacing: {
              after: 240,
            },
          })
        );

        // ----------------------------------------------------
        // BUSINESS VALUE
        // ----------------------------------------------------

        children.push(
          new Paragraph({
            text: "Business Value",
            heading:
              HeadingLevel.HEADING_1,
          })
        );

        children.push(
          new Paragraph({
            text:
              story.business_value ||
              "N/A",
            spacing: {
              after: 240,
            },
          })
        );

        // ----------------------------------------------------
        // USER STORY
        // ----------------------------------------------------

        children.push(
          new Paragraph({
            text: "User Story",
            heading:
              HeadingLevel.HEADING_1,
          })
        );

        children.push(
          new Paragraph({
            text:
              story.user_story ||
              "N/A",
            spacing: {
              after: 240,
            },
          })
        );

        // ----------------------------------------------------
        // ACCEPTANCE CRITERIA
        // ----------------------------------------------------

        children.push(
          new Paragraph({
            text:
              "Acceptance Criteria",
            heading:
              HeadingLevel.HEADING_1,
          })
        );

        const acceptanceCriteria =
          story.acceptance_criteria ?? [];

        if (
          acceptanceCriteria.length ===
          0
        ) {
          children.push(
            new Paragraph({
              text: "N/A",
            })
          );
        } else {
          acceptanceCriteria.forEach(
            (
              item,
              itemIndex
            ) => {
              children.push(
                new Paragraph({
                  text: `${
                    itemIndex + 1
                  }. ${item.id}\nGiven ${item.given}\nWhen ${item.when}\nThen ${item.then}`,
                  spacing: {
                    after: 100,
                  },
                })
              );
            }
          );
        }

        // ----------------------------------------------------
        // DEFINITION OF DONE
        // ----------------------------------------------------

        children.push(
          new Paragraph({
            text:
              "Definition of Done",
            heading:
              HeadingLevel.HEADING_1,
          })
        );

        const definitionOfDone =
          story.definition_of_done ?? [];

        if (
          definitionOfDone.length ===
          0
        ) {
          children.push(
            new Paragraph({
              text: "N/A",
            })
          );
        } else {
          definitionOfDone.forEach(
            (item) => {
              children.push(
                new Paragraph({
                  text: `✓ ${item}`,
                  spacing: {
                    after: 100,
                  },
                })
              );
            }
          );
        }

        // ----------------------------------------------------
        // TEST SCENARIOS
        // ----------------------------------------------------

        children.push(
          new Paragraph({
            text:
              "Test Scenarios",
            heading:
              HeadingLevel.HEADING_1,
          })
        );

        const testScenarios =
          story.test_scenarios ?? [];

        if (
          testScenarios.length ===
          0
        ) {
          children.push(
            new Paragraph({
              text:
                "No test scenarios available.",
            })
          );
        } else {
          testScenarios.forEach(
            (
              testCase,
              testIndex
            ) => {
              const testCaseId =
                testCase.test_case_id ||
                `TC${String(
                  testIndex + 1
                ).padStart(3, "0")}`;

              children.push(
                new Paragraph({
                  text:
                    testCaseId,
                  heading:
                    HeadingLevel.HEADING_2,
                })
              );

              children.push(
                new Paragraph({
                  children: [
                    new TextRun({
                      text:
                        "Scenario: ",
                      bold: true,
                    }),
                    new TextRun(
                      testCase.scenario ||
                        "N/A"
                    ),
                  ],
                })
              );

              children.push(
                new Paragraph({
                  children: [
                    new TextRun({
                      text:
                        "Priority: ",
                      bold: true,
                    }),
                    new TextRun(
                      testCase.priority ||
                        "N/A"
                    ),
                  ],
                })
              );

              children.push(
                new Paragraph({
                  children: [
                    new TextRun({
                      text:
                        "Preconditions: ",
                      bold: true,
                    }),
                    new TextRun(
                      testCase.preconditions ||
                        "N/A"
                    ),
                  ],
                })
              );

              children.push(
                new Paragraph({
                  children: [
                    new TextRun({
                      text:
                        "Test Steps",
                      bold: true,
                    }),
                  ],
                  spacing: {
                    before: 120,
                  },
                })
              );

              const steps =
                testCase.steps ?? [];

              if (
                steps.length === 0
              ) {
                children.push(
                  new Paragraph({
                    text: "N/A",
                  })
                );
              } else {
                steps.forEach(
                  (
                    step,
                    stepIndex
                  ) => {
                    children.push(
                      new Paragraph({
                        text: `${
                          stepIndex + 1
                        }. ${step}`,
                        spacing: {
                          after: 80,
                        },
                      })
                    );
                  }
                );
              }

              children.push(
                new Paragraph({
                  children: [
                    new TextRun({
                      text:
                        "Test Data: ",
                      bold: true,
                    }),
                    new TextRun(
                      testCase.test_data ||
                        "N/A"
                    ),
                  ],
                })
              );

              children.push(
                new Paragraph({
                  children: [
                    new TextRun({
                      text:
                        "Expected Result: ",
                      bold: true,
                    }),
                    new TextRun(
                      testCase.expected_result ||
                        "N/A"
                    ),
                  ],
                  spacing: {
                    after: 240,
                  },
                })
              );
            }
          );
        }

        // ----------------------------------------------------
        // CREATE WORD DOCUMENT
        // ----------------------------------------------------

        const wordDocument =
          new WordDocument({
            sections: [
              {
                children,
              },
            ],
          });

        const blob =
          await Packer.toBlob(
            wordDocument
          );

        const fileName =
          `${createSafeFileName(
            story.title ||
              "User_Story"
          )}.docx`;

        // IMPORTANT:
        // No document.createElement()
        // No document.body
        // No URL.createObjectURL()
        // No anchor element.
        saveAs(
          blob,
          fileName
        );

        setSuccess(
          "Word document exported successfully."
        );
      } catch (exportError) {
        console.error(
          "Failed to export Word document:",
          exportError
        );

        setError(
          "Unable to export the story as Word document."
        );
      } finally {
        setExporting(false);
        setExportFormat("");
      }
    };

  // ==========================================================
  // EXPORT DROPDOWN
  // ==========================================================

  const handleExportChange = async (
    event: ChangeEvent<HTMLSelectElement>
  ) => {
    const selectedFormat =
      event.target.value as ExportFormat;

    setExportFormat(
      selectedFormat
    );

    if (
      selectedFormat ===
      "pdf"
    ) {
      handleExportPdf();
      return;
    }

    if (
      selectedFormat ===
      "docx"
    ) {
      await handleExportWord();
    }
  };

  // ==========================================================
  // DELETE STORY
  // ==========================================================

  const handleDelete =
    async () => {
      try {
        setDeleting(true);
        setError("");
        setSuccess("");

        await deleteStory(
          storyId
        );

        router.push(
          "/dashboard/stories"
        );
      } catch (deleteError) {
        console.error(
          "Failed to delete story:",
          deleteError
        );

        setError(
          "Unable to delete this story. Please try again."
        );

        setDeleting(false);
        setShowDeleteConfirm(
          false
        );
      }
  };

  const handleApproveReview = async () => {
    if (!story || story.approved_for_final_output) {
      return;
    }

    try {
      setApprovingReview(true);
      setError("");
      setSuccess("");

      const updatedStory = await approveStoryReview(story.id);
      setStory(updatedStory);
      setSuccess("Story review approved.");
    } catch (approveError) {
      console.error("Failed to approve story review:", approveError);
      setError("Unable to approve the story review. Please try again.");
    } finally {
      setApprovingReview(false);
    }
  };

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <div className="relative min-h-screen overflow-hidden p-6">
        <Background />

        <div className="relative">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8">
            <div className="h-2 w-24 rounded-full bg-gradient-to-r from-purple-500 to-blue-500" />

            <h1 className="mt-5 text-2xl font-bold text-white">
              Loading Story...
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              Please wait while we load the story.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================
  // ERROR
  // ==========================================================

  if (
    error &&
    !story
  ) {
    return (
      <div className="relative min-h-screen overflow-hidden p-6">
        <Background />

        <div className="relative">
          <Link
            href="/dashboard/stories"
            className="text-sm font-medium text-indigo-400 transition hover:text-indigo-300"
          >
            ← Back to My Stories
          </Link>

          <div className="mt-8 rounded-3xl border border-red-500/20 bg-red-500/5 p-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-2xl">
              ⚠
            </div>

            <h1 className="mt-5 text-2xl font-bold text-white">
              Unable to Load Story
            </h1>

            <p className="mt-2 text-sm text-red-300">
              {error}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!story) {
    return null;
  }

  // ==========================================================
  // PAGE
  // ==========================================================

  return (
    <div className="relative min-h-screen overflow-hidden">
      <Background />

      <div className="relative p-6">

        {/* ==================================================
            ERROR
            ================================================== */}

        {error && (
          <div className="mb-5 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* ==================================================
            SUCCESS
            ================================================== */}

        {success && (
          <div className="mb-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-300">
            ✓ {success}
          </div>
        )}

        {/* ==================================================
            HEADER
            ================================================== */}

        <div className="mt-6 flex flex-col justify-between gap-6 lg:flex-row lg:items-start">

          {/* STORY TITLE */}

          <div className="min-w-0">

            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-purple-400">
              Story Details
            </p>

            <h1 className="mt-2 break-words text-3xl font-bold text-white md:text-4xl">
              {story.title}
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              Feature:{" "}
              {story.feature_name ||
                "N/A"}
            </p>

          </div>

          {/* ==================================================
              ACTIONS
              ================================================== */}

          <div className="flex flex-wrap items-center gap-3">

            {/* COPY */}

            <button
              type="button"
              onClick={
                handleCopyFullStory
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-indigo-400/20 bg-indigo-500/10 px-4 py-3 text-sm font-semibold text-indigo-300 transition hover:bg-indigo-500/20 hover:text-indigo-200"
            >
              {copied
                ? "✓ Copied"
                : "📋 Copy Full Story"}
            </button>

            {/* EXPORT DROPDOWN */}

            <select
              value={
                exportFormat
              }
              onChange={
                handleExportChange
              }
              disabled={
                exporting
              }
              className="cursor-pointer rounded-xl border border-purple-400/20 bg-purple-500/10 px-4 py-3 text-sm font-semibold text-purple-300 outline-none transition hover:bg-purple-500/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option
                value=""
                className="bg-slate-900 text-slate-300"
              >
                {exporting
                  ? "Exporting..."
                  : "Export Story"}
              </option>

              <option
                value="pdf"
                className="bg-slate-900 text-white"
              >
                Export as PDF
              </option>

              <option
                value="docx"
                className="bg-slate-900 text-white"
              >
                Export as Word
              </option>
            </select>

            {/* DELETE */}

            <button
              type="button"
              onClick={() =>
                setShowDeleteConfirm(
                  true
                )
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-300 transition hover:bg-red-500/20"
            >
              🗑 Delete
            </button>

            {/* MY STORIES */}

            <Link
              href="/dashboard/stories"
              className="rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-500/20 transition hover:scale-[1.02]"
            >
              My Stories
            </Link>

          </div>
        </div>

        {/* ==================================================
            STORY VIEW
            ================================================== */}

        <ViewMode
          story={story}
          onApproveReview={handleApproveReview}
          approvingReview={approvingReview}
        />

        {/* ==================================================
            FOOTER
            ================================================== */}

        <div className="mt-8 border-t border-white/5 pt-5">
          <p className="text-xs text-slate-600">
            Created{" "}
            {story.created_at
              ? new Date(
                  story.created_at
                ).toLocaleString()
              : "Recently"}
          </p>
        </div>

      </div>

      {/* ====================================================
          DELETE CONFIRMATION
          ==================================================== */}

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm">

          <div className="w-full max-w-md rounded-3xl border border-red-500/20 bg-slate-900 p-7 shadow-2xl">

            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-2xl">
              🗑
            </div>

            <h2 className="mt-5 text-2xl font-bold text-white">
              Delete Story?
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-400">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-white">
                &quot;
                {story.title}
                &quot;
              </span>
              ? This action cannot be undone.
            </p>

            <div className="mt-7 flex justify-end gap-3">

              <button
                type="button"
                disabled={
                  deleting
                }
                onClick={() =>
                  setShowDeleteConfirm(
                    false
                  )
                }
                className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/10 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={
                  deleting
                }
                onClick={
                  handleDelete
                }
                className="rounded-xl bg-red-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleting
                  ? "Deleting..."
                  : "Yes, Delete"}
              </button>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// VIEW MODE
// ============================================================

function ViewMode({
  story,
  onApproveReview,
  approvingReview,
}: {
  story: StoryResponse;
  onApproveReview: () => void;
  approvingReview: boolean;
}) {
  return (
    <>
      {/* ==================================================
          META CARDS
          ================================================== */}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

        <InfoCard
          label="Story ID"
          value={`US-${story.id}`}
        />

        <InfoCard
          label="Feature"
          value={story.feature_name}
        />

        <InfoCard
          label="Module"
          value={
            story.module
          }
        />

        <InfoCard
          label="Priority"
          value={
            story.priority
          }
        />

        <InfoCard
          label="Story Type"
          value={
            story.story_type
          }
        />

        <InfoCard
          label="User Role"
          value={story.user_role || "N/A"}
        />

        <InfoCard
          label="Complexity"
          value={story.complexity || "N/A"}
        />

        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">

          <p className="text-xs uppercase tracking-wider text-emerald-400">
            Story Points
          </p>

          <p className="mt-2 text-2xl font-bold text-white">
            {story.story_points ??
              0}
          </p>

        </div>
      </div>

      {/* ==================================================
          USER STORY
          ================================================== */}

      <section className="mt-6 rounded-3xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/10 to-purple-500/5 p-6">

        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-400">
          User Story
        </p>

        <p className="mt-4 whitespace-pre-line text-base leading-7 text-slate-200">
          {story.user_story ||
            "N/A"}
        </p>

      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <StoryListSection
          title="Assumptions"
          items={story.assumptions}
          emptyText="No assumptions recorded."
        />
        <StoryListSection
          title="Dependencies"
          items={story.dependencies}
          emptyText="No dependencies recorded."
        />
      </section>

      {/* ==================================================
          BUSINESS VALUE
          ================================================== */}

      <section className="mt-6 rounded-3xl border border-cyan-500/20 bg-cyan-500/5 p-6">

        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-400">
          Business Value
        </p>

        <p className="mt-4 whitespace-pre-line text-sm leading-7 text-slate-300">
          {story.business_value ||
            "N/A"}
        </p>

      </section>

      {/* ==================================================
          PRODUCT OUTCOME
          ================================================== */}

      {story.product_outcome && (
        <section className="mt-6 rounded-3xl border border-cyan-500/20 bg-cyan-500/5 p-6">

          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-400">
            Product Outcome
          </p>

          <p className="mt-4 whitespace-pre-line text-sm leading-7 text-slate-300">
            {story.product_outcome}
          </p>

        </section>
      )}

      {/* ==================================================
          ACCEPTANCE CRITERIA
          ================================================== */}

      <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.03] p-6">

        <SectionHeader
          label="Acceptance Criteria"
          description="Conditions required for completion."
          count={
            story.acceptance_criteria
              ?.length || 0
          }
        />

        <div className="mt-5 space-y-3">

          {(
            story.acceptance_criteria ??
            []
          ).map(
            (
              item,
              itemIndex
            ) => (
              <div
                key={
                  `${item.id ?? itemIndex}-${itemIndex}`
                }
                className="flex gap-3 rounded-xl border border-white/5 bg-black/10 p-4"
              >

                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-500/15 text-xs font-bold text-indigo-300">
                  {itemIndex + 1}
                </span>

                <div className="min-w-0 space-y-3 text-sm leading-6">
                  <dl className="grid gap-2 text-slate-400">
                    <div className="grid gap-1 sm:grid-cols-[4rem_1fr] sm:gap-3">
                      <dt className="font-semibold text-violet-300">Given</dt>
                      <dd>{item.given}</dd>
                    </div>
                    <div className="grid gap-1 sm:grid-cols-[4rem_1fr] sm:gap-3">
                      <dt className="font-semibold text-sky-300">When</dt>
                      <dd>{item.when}</dd>
                    </div>
                    <div className="grid gap-1 sm:grid-cols-[4rem_1fr] sm:gap-3">
                      <dt className="font-semibold text-emerald-300">Then</dt>
                      <dd>{item.then}</dd>
                    </div>
                  </dl>
                </div>

              </div>
            )
          )}

          {(
            story.acceptance_criteria
              ?.length ?? 0
          ) === 0 && (
            <p className="text-sm text-slate-500">
              No acceptance criteria.
            </p>
          )}

        </div>
      </section>

      {/* ==================================================
          DEFINITION OF DONE
          ================================================== */}

      <section className="mt-6 rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-6">

        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-400">
          Definition of Done
        </p>

        <div className="mt-5 space-y-3">

          {(
            story.definition_of_done ??
            []
          ).map(
            (
              item,
              itemIndex
            ) => (
              <div
                key={
                  `${item}-${itemIndex}`
                }
                className="flex gap-3 rounded-xl border border-emerald-500/10 bg-black/10 p-4"
              >

                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-sm font-bold text-emerald-400">
                  ✓
                </span>

                <p className="text-sm leading-6 text-slate-300">
                  {item}
                </p>

              </div>
            )
          )}

          {(
            story.definition_of_done
              ?.length ?? 0
          ) === 0 && (
            <p className="text-sm text-slate-500">
              No definition of done items.
            </p>
          )}

        </div>
      </section>

      {/* ==================================================
          BUSINESS ANALYSIS
          ================================================== */}

      {(story.requirement_summary ||
        story.requirement_quality ||
        (story.business_rules ?? []).length > 0 ||
        (story.preconditions ?? []).length > 0 ||
        (story.edge_cases ?? []).length > 0 ||
        (story.clarification_questions ?? []).length > 0) && (
        <section className="mt-6 rounded-3xl border border-amber-500/20 bg-amber-500/5 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-400">
            Business Analysis
          </p>

          <div className="mt-5 space-y-4">
            {story.requirement_summary && (
              <div className="rounded-xl border border-amber-500/10 bg-amber-500/5 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-400">
                  Requirement Summary
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  {story.requirement_summary}
                </p>
              </div>
            )}

            {story.requirement_quality && (
              <div className="rounded-xl border border-amber-500/10 bg-amber-500/5 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-400">
                  Requirement Quality
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  {story.requirement_quality}
                </p>
              </div>
            )}

            {(story.business_rules ?? []).length > 0 && (
              <div className="rounded-xl border border-amber-500/10 bg-amber-500/5 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-400">
                  Business Rules
                </p>
                <ul className="mt-2 space-y-2 text-sm leading-6 text-slate-300">
                  {(story.business_rules ?? []).map((rule, index) => (
                    <li key={`${rule}-${index}`}>• {rule}</li>
                  ))}
                </ul>
              </div>
            )}

            {(story.preconditions ?? []).length > 0 && (
              <div className="rounded-xl border border-amber-500/10 bg-amber-500/5 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-400">
                  Preconditions
                </p>
                <ul className="mt-2 space-y-2 text-sm leading-6 text-slate-300">
                  {(story.preconditions ?? []).map((pre, index) => (
                    <li key={`${pre}-${index}`}>• {pre}</li>
                  ))}
                </ul>
              </div>
            )}

            {(story.edge_cases ?? []).length > 0 && (
              <div className="rounded-xl border border-amber-500/10 bg-amber-500/5 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-400">
                  Edge Cases
                </p>
                <ul className="mt-2 space-y-2 text-sm leading-6 text-slate-300">
                  {(story.edge_cases ?? []).map((edge, index) => (
                    <li key={`${edge}-${index}`}>• {edge}</li>
                  ))}
                </ul>
              </div>
            )}

            {(story.clarification_questions ?? []).length > 0 && (
              <div className="rounded-xl border border-amber-500/10 bg-amber-500/5 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-400">
                  Clarification Questions
                </p>
                <ul className="mt-2 space-y-2 text-sm leading-6 text-slate-300">
                  {(story.clarification_questions ?? []).map((question, index) => (
                    <li key={`${question}-${index}`}>• {question}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ==================================================
          TECHNICAL ANALYSIS
          ================================================== */}

      {story.technical_analysis &&
        Object.keys(story.technical_analysis).length > 0 && (
          <TechnicalAnalysisSection
            technical={story.technical_analysis}
          />
        )}

      {/* ==================================================
          TEST SCENARIOS
          ================================================== */}

      <TestScenarioView
        scenarios={
          story.test_scenarios ??
          []
        }
      />

      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-3xl border border-amber-500/20 bg-amber-500/5 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-400">
            Story Point Justification
          </p>
          <p className="mt-3 text-3xl font-bold text-white">{story.story_points}</p>

          {story.complexity && (
            <p className="mt-2 text-sm text-slate-400">
              Complexity: {story.complexity}
            </p>
          )}

          <p className="mt-3 text-sm leading-6 text-slate-300">
            {story.story_point_reason || "No estimation rationale recorded."}
          </p>

          {(story.estimation_factors ?? []).length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-400">
                Estimation Factors
              </p>
              <ul className="mt-2 space-y-2 text-sm leading-6 text-slate-300">
                {(story.estimation_factors ?? []).map((factor, index) => (
                  <li key={`${factor}-${index}`}>• {factor}</li>
                ))}
              </ul>
            </div>
          )}

          {story.should_split && (
            <p className="mt-3 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-200">
              ⚠ Suggested split: {story.split_reason || "Story should be split."}
            </p>
          )}
        </section>

        <section className="rounded-3xl border border-rose-500/20 bg-rose-500/5 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-400">
            Risks
          </p>
          <p className="mt-2 text-sm text-rose-200">{story.risk_summary || story.overall_risk_level || "No risk summary recorded."}</p>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
            {(story.risks ?? []).map((risk, index) => (
              <li key={`${risk.risk_id ?? risk.risk ?? index}-${index}`} className="rounded-xl border border-rose-500/10 bg-black/10 p-3">
                <p className="font-medium text-slate-200">{risk.risk || "Unspecified risk"}</p>
                <p className="mt-1 text-xs text-slate-400">
                  {[risk.category, risk.risk_level, risk.impact, risk.likelihood].filter(Boolean).join(" · ")}
                </p>
                {risk.mitigation && <p className="mt-2 text-sm text-slate-300">Mitigation: {risk.mitigation}</p>}
              </li>
            ))}
          </ul>
        </section>
      </section>

      <section className="mt-6 rounded-3xl border border-cyan-500/20 bg-cyan-500/5 p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-400">Traceability</p>
        <p className="mt-3 text-sm text-slate-300">Requirement → User Story → Acceptance Criteria → Test Cases</p>
        <p className="mt-3 text-sm text-slate-400">Acceptance Criteria: {(story.traceability?.acceptance_criteria ?? []).join(", ") || "N/A"}</p>
        {(story.traceability?.requirements ?? []).map((requirement) => (
          <p key={requirement.id} className="mt-2 text-sm text-slate-300">
            <span className="font-medium text-cyan-200">{requirement.id}</span>: {requirement.description} → {requirement.acceptance_criteria_ids.join(", ") || "Unmapped"}
          </p>
        ))}
        <div className="mt-3 flex flex-wrap gap-2">
          {(story.traceability?.test_cases ?? []).map((testCase, index) => (
            <span key={`${testCase.test_case_id ?? index}-${index}`} className="rounded-lg bg-cyan-500/10 px-3 py-1 text-xs text-cyan-200">
              {testCase.test_case_id || "Test Case"}: {(testCase.acceptance_criteria_ids ?? []).join(", ") || "N/A"}
            </span>
          ))}
        </div>
      </section>

      {/* ==================================================
          QUALITY REVIEW
          ================================================== */}

      <section className="mt-6 rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-400">
          Quality Review
        </p>

        <div className="mt-3 flex flex-wrap gap-3">
          <span className="rounded-lg bg-emerald-500/10 px-3 py-1 text-sm font-semibold text-emerald-300">
            Status: {story.review_status || "N/A"}
          </span>
          <span className="rounded-lg bg-emerald-500/10 px-3 py-1 text-sm font-semibold text-emerald-300">
            Score: {story.quality_score ?? "N/A"}/100
          </span>
          <span className="rounded-lg bg-emerald-500/10 px-3 py-1 text-sm font-semibold text-emerald-300">
            Approved: {story.approved_for_final_output ? "Yes" : "No"}
          </span>
        </div>

        {!story.approved_for_final_output && (
          <button
            type="button"
            onClick={onApproveReview}
            disabled={approvingReview}
            className="mt-4 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {approvingReview ? "Approving review..." : "Approve review"}
          </button>
        )}

        {story.review_summary && (
          <p className="mt-3 text-sm leading-6 text-slate-300">
            {story.review_summary}
          </p>
        )}

        {(story.recommendations ?? []).length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-400">
              Recommendations
            </p>
            <ul className="mt-2 space-y-2 text-sm leading-6 text-slate-300">
              {(story.recommendations ?? []).map((rec, index) => (
                <li key={`${rec}-${index}`}>• {rec}</li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </>
  );
}

function StoryListSection({
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
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">{title}</p>
      {items.length ? (
        <ul className="mt-4 space-y-2 text-sm leading-6 text-slate-300">
          {items.map((item, index) => <li key={`${item}-${index}`}>• {item}</li>)}
        </ul>
      ) : <p className="mt-4 text-sm text-slate-500">{emptyText}</p>}
    </section>
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
    <section className="mt-6 rounded-3xl border border-sky-500/20 bg-sky-500/5 p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-400">
        Technical Analysis
      </p>

      <div className="mt-5 space-y-4">
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
              {(frontend.changes ?? []).map((change, index) => (
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
              {(backend.changes ?? []).map((change, index) => (
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
            <ul className="mt-2 space-y-3 text-sm leading-6 text-slate-300">
              {(api.changes ?? []).map((change, index) => {
                const method = change.method as string | undefined;
                const purpose = change.purpose as string | undefined;
                const authentication = change.authentication as string | undefined;
                const authorization = change.authorization as string | undefined;
                const acIds = change.acceptance_criteria_ids as string[] | undefined;

                return (
                  <li key={`${method ?? index}-${index}`} className="rounded-lg border border-sky-500/10 bg-black/10 p-3">
                    <p className="font-medium text-slate-200">
                      {method || "API"} {purpose ? `- ${purpose}` : ""}
                    </p>
                    {(authentication || authorization) && (
                      <p className="mt-1 text-xs text-slate-400">
                        {[authentication, authorization].filter(Boolean).join(" · ")}
                      </p>
                    )}
                    {acIds?.length ? (
                      <p className="mt-1 text-xs text-cyan-300">
                        AC: {acIds.join(", ")}
                      </p>
                    ) : null}
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
              {(database.changes ?? []).map((change, index) => (
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
                <li key={`${item.requirement ?? index}-${index}`}>
                  • {item.requirement}
                  {item.acceptance_criteria_ids?.length ? (
                    <span className="ml-2 text-xs text-cyan-300">
                      (AC: {item.acceptance_criteria_ids.join(", ")})
                    </span>
                  ) : null}
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
    </section>
  );
}

// ============================================================
// TEST SCENARIO VIEW
// ============================================================

function TestScenarioView({
  scenarios,
}: {
  scenarios: TestScenario[];
}) {
  return (
    <section className="mt-6 rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-2xl lg:p-8">

      <div className="mb-6">

        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-purple-400">
          QA Coverage
        </span>

        <h2 className="mt-2 text-2xl font-bold text-white">
          Test Scenarios
        </h2>

        <p className="mt-2 text-sm text-slate-500">
          Test cases generated directly from the requirement, user story and acceptance criteria.
        </p>

      </div>

      {scenarios.length === 0 ? (
        <div className="rounded-2xl border border-white/5 bg-black/10 p-8 text-center text-sm text-slate-500">
          No test scenarios available.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/10">

          <table className="min-w-[1400px] w-full border-collapse">

            <thead>
              <tr className="bg-slate-800">

                <TableHeader>
                  TC ID
                </TableHeader>

                <TableHeader>
                  Scenario
                </TableHeader>

                <TableHeader>
                  AC IDs
                </TableHeader>

                <TableHeader>
                  Test Type
                </TableHeader>

                <TableHeader>
                  Preconditions
                </TableHeader>

                <TableHeader>
                  Steps
                </TableHeader>

                <TableHeader>
                  Test Data
                </TableHeader>

                <TableHeader>
                  Expected Result
                </TableHeader>

                <TableHeader nowrap>
                  Priority
                </TableHeader>

              </tr>
            </thead>

            <tbody>

              {scenarios.map(
                (
                  testCase,
                  testIndex
                ) => {

                  const testCaseId =
                    testCase.test_case_id ||
                    `TC${String(
                      testIndex + 1
                    ).padStart(3, "0")}`;

                  return (
                    <tr
                      key={
                        testCaseId
                      }
                      className="border-b border-white/5 bg-slate-900/40 transition hover:bg-slate-800/70"
                    >

                      {/* TC ID */}

                      <td className="whitespace-nowrap px-4 py-5 align-top text-sm">

                        <span className="inline-flex rounded-lg bg-indigo-500/15 px-3 py-1 font-bold text-indigo-300">
                          {
                            testCaseId
                          }
                        </span>

                      </td>

                      {/* SCENARIO */}

                      <td className="min-w-[220px] px-4 py-5 align-top text-sm font-semibold text-white">
                        {
                          testCase.scenario ||
                          "N/A"
                        }
                      </td>

                      <td className="min-w-[140px] px-4 py-5 align-top text-sm text-cyan-200">
                        {(testCase.acceptance_criteria_ids ?? []).join(", ") || "N/A"}
                      </td>

                      <td className="min-w-[140px] px-4 py-5 align-top text-sm text-slate-300">
                        {testCase.test_type || "N/A"}
                      </td>

                      {/* PRECONDITIONS */}

                      <td className="min-w-[220px] px-4 py-5 align-top text-sm leading-6 text-slate-300">
                        {
                          testCase.preconditions ||
                          "N/A"
                        }
                      </td>

                      {/* STEPS */}

                      <td className="min-w-[300px] px-4 py-5 align-top">

                        {(
                          testCase.steps
                            ?.length ??
                          0
                        ) > 0 ? (

                          <ol className="space-y-2">

                            {(
                              testCase.steps ??
                              []
                            ).map(
                              (
                                step,
                                stepIndex
                              ) => (
                                <li
                                  key={
                                    `${testCaseId}-step-${stepIndex}`
                                  }
                                  className="flex gap-2 text-sm leading-6 text-slate-300"
                                >

                                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-700 text-[10px] text-slate-300">
                                    {
                                      stepIndex +
                                      1
                                    }
                                  </span>

                                  <span>
                                    {
                                      step
                                    }
                                  </span>

                                </li>
                              )
                            )}

                          </ol>

                        ) : (
                          <span className="text-sm text-slate-500">
                            N/A
                          </span>
                        )}

                      </td>

                      {/* TEST DATA */}

                      <td className="min-w-[200px] px-4 py-5 align-top text-sm leading-6 text-slate-300">
                        {
                          testCase.test_data ||
                          "N/A"
                        }
                      </td>

                      {/* EXPECTED RESULT */}

                      <td className="min-w-[250px] px-4 py-5 align-top text-sm leading-6 text-slate-300">
                        {
                          testCase.expected_result ||
                          "N/A"
                        }
                      </td>

                      {/* PRIORITY */}

                      <td className="whitespace-nowrap px-4 py-5 align-top">

                        <PriorityBadge
                          priority={
                            testCase.priority
                          }
                        />

                      </td>

                    </tr>
                  );
                }
              )}

            </tbody>
          </table>

        </div>
      )}
    </section>
  );
}

// ============================================================
// BACKGROUND
// ============================================================

function Background() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">

      <div className="absolute -left-32 top-0 h-96 w-96 rounded-full bg-purple-600/10 blur-3xl" />

      <div className="absolute right-0 top-40 h-96 w-96 rounded-full bg-blue-600/10 blur-3xl" />

      <div className="absolute bottom-20 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-cyan-600/5 blur-3xl" />

    </div>
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
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">

      <p className="text-xs uppercase tracking-wider text-slate-400">
        {label}
      </p>

      <p className="mt-2 font-semibold text-white">
        {value || "N/A"}
      </p>

    </div>
  );
}

// ============================================================
// SECTION HEADER
// ============================================================

function SectionHeader({
  label,
  description,
  count,
}: {
  label: string;
  description: string;
  count: number;
}) {
  return (
    <div className="flex items-center justify-between gap-4">

      <div>

        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-400">
          {label}
        </p>

        <p className="mt-1 text-xs text-slate-500">
          {description}
        </p>

      </div>

      <span className="rounded-lg bg-indigo-500/10 px-3 py-1.5 text-xs font-semibold text-indigo-300">
        {count}
      </span>

    </div>
  );
}

// ============================================================
// TABLE HEADER
// ============================================================

function TableHeader({
  children,
  nowrap = false,
}: {
  children: ReactNode;
  nowrap?: boolean;
}) {
  return (
    <th
      className={`
        ${nowrap ? "whitespace-nowrap" : ""}
        border-b
        border-white/10
        px-4
        py-4
        text-left
        text-xs
        font-semibold
        uppercase
        tracking-wide
        text-indigo-300
      `}
    >
      {children}
    </th>
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
  const value =
    priority || "N/A";

  let className =
    "bg-slate-700/50 text-slate-300";

  if (
    value.toLowerCase() ===
    "high"
  ) {
    className =
      "bg-red-500/10 text-red-300";
  } else if (
    value.toLowerCase() ===
    "medium"
  ) {
    className =
      "bg-yellow-500/10 text-yellow-300";
  } else if (
    value.toLowerCase() ===
    "low"
  ) {
    className =
      "bg-green-500/10 text-green-300";
  } else if (
    value.toLowerCase() ===
    "critical"
  ) {
    className =
      "bg-red-500/20 text-red-200";
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
