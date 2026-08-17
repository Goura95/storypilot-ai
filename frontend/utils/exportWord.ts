import {
  Document,
  Packer,
  Paragraph,
  HeadingLevel,
  TextRun,
} from "docx";

import { saveAs } from "file-saver";

import { StoryResponse } from "@/services/storyService";

export async function exportToWord(story: StoryResponse) {
  const acceptanceCriteria = story.acceptance_criteria?.map((item) => item.criterion) ?? [];
  const definitionOfDone = story.definition_of_done ?? [];
  const testScenarios = story.test_scenarios?.map((item) => item.scenario || item.test_case_id) ?? [];

  const document = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            heading: HeadingLevel.TITLE,
            children: [
              new TextRun({
                text: "StoryPilot AI",
                bold: true,
                size: 36,
              }),
            ],
          }),

          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            text: "User Story",
          }),

          new Paragraph(story.user_story),

          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            text: "Acceptance Criteria",
          }),

          ...acceptanceCriteria.map(
            (item) =>
              new Paragraph({
                bullet: {
                  level: 0,
                },
                text: item,
              })
          ),

          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            text: "Definition of Done",
          }),

          ...definitionOfDone.map(
            (item) =>
              new Paragraph({
                bullet: {
                  level: 0,
                },
                text: item,
              })
          ),

          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            text: "Test Scenarios",
          }),

          ...testScenarios.map(
            (item) =>
              new Paragraph({
                bullet: {
                  level: 0,
                },
                text: item,
              })
          ),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(document);

  saveAs(blob, "StoryPilotAI.docx");
}