import jsPDF from "jspdf";
import { StoryResponse } from "@/services/storyService";

export function exportToPdf(story: StoryResponse) {
  const pdf = new jsPDF();

  let y = 20;

  const addTitle = (title: string) => {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(16);
    pdf.text(title, 10, y);
    y += 10;
  };

  const addBody = (text: string) => {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(11);

    const lines = pdf.splitTextToSize(text, 180);
    pdf.text(lines, 10, y);

    y += lines.length * 6 + 5;
  };

  const addList = (items: string[]) => {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(11);

    items.forEach((item) => {
      const lines = pdf.splitTextToSize("• " + item, 180);
      pdf.text(lines, 15, y);
      y += lines.length * 6;
    });

    y += 6;
  };

  const acceptanceCriteria = story.acceptance_criteria?.map((item) => item.criterion) ?? [];
  const definitionOfDone = story.definition_of_done ?? [];
  const testScenarios = story.test_scenarios?.map((item) => item.scenario || item.test_case_id) ?? [];

  addTitle("StoryPilot AI");
  addTitle("User Story");
  addBody(story.user_story);

  addTitle("Acceptance Criteria");
  addList(acceptanceCriteria);

  addTitle("Definition of Done");
  addList(definitionOfDone);

  addTitle("Test Scenarios");
  addList(testScenarios);

  pdf.save("StoryPilotAI.pdf");
}