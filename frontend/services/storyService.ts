import api, {
  RateLimitError,
} from "@/services/api";

// ============================================================
// ACCEPTANCE CRITERION
// ============================================================

export interface AcceptanceCriterion {
  id: string;
  criterion: string;
  given: string;
  when: string;
  then: string;
}

// ============================================================
// TEST SCENARIO
// ============================================================

export interface TestScenario {
  test_case_id: string;

  acceptance_criteria_ids: string[];

  scenario: string;

  test_type: string;

  preconditions: string;

  steps: string[];

  test_data: string;

  expected_result: string;

  priority: string;
}

// ============================================================
// STORY RESPONSE
// ============================================================

export interface StoryRisk {
  risk_id?: string;
  category?: string;
  risk?: string;
  impact?: string;
  likelihood?: string;
  risk_level?: string;
  mitigation?: string;
  related_acceptance_criteria?: string[];
}

export interface StoryResponse {
  id: number;

  feature_name: string;

  title: string;

  module: string;

  priority: string;

  story_type: string;

  user_role: string;

  business_value: string;

  user_story: string;

  product_outcome: string;

  requirement_summary: string;

  requirement_quality: string;

  business_rules: string[];

  preconditions: string[];

  assumptions: string[];

  dependencies: string[];

  edge_cases: string[];

  clarification_questions: string[];

  acceptance_criteria: AcceptanceCriterion[];

  definition_of_done: string[];

  test_scenarios: TestScenario[];

  technical_analysis: Record<string, unknown>;

  overall_risk_level: string;

  risk_summary: string;

  risks: StoryRisk[];

  story_points: number;

  story_point_reason: string;

  complexity: string;

  estimation_factors: string[];

  should_split: boolean;

  split_reason: string;

  traceability: {
    requirement?: string;
    requirements?: {
      id: string;
      description: string;
      acceptance_criteria_ids: string[];
    }[];
    acceptance_criteria?: string[];
    coverage_matrix?: Record<string, string[]>;
    test_cases?: {
      test_case_id?: string;
      acceptance_criteria_ids?: string[];
    }[];
  };

  quality_review: Record<string, unknown>;

  quality_score: number;

  review_status: string;

  review_summary: string;

  missing_acceptance_criteria: string[];

  uncovered_acceptance_criteria: string[];

  recommendations: string[];

  approved_for_final_output: boolean;

  created_at?: string | null;
}

// ============================================================
// GENERATE STORY INPUT
// ============================================================

export interface GenerateStoryData {
  feature_name: string;

  module: string;

  priority: string;

  story_type: string;

  description: string;

  requirement_image?: File | null;
}

// ============================================================
// GENERATE STORY
// ============================================================

export async function generateStory(
  data: GenerateStoryData | FormData
): Promise<StoryResponse> {
  const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");

  const formData =
    data instanceof FormData
      ? data
      : (() => {
          const payload = new FormData();

          payload.append(
            "feature_name",
            data.feature_name
          );

          payload.append(
            "module",
            data.module
          );

          payload.append(
            "priority",
            data.priority
          );

          payload.append(
            "story_type",
            data.story_type
          );

          payload.append(
            "description",
            data.description
          );

          if (data.requirement_image) {
            payload.append(
              "requirement_image",
              data.requirement_image
            );
          }

          return payload;
        })();

  try {
    const response =
      await api.post<StoryResponse>(
        // Avoid the Next development proxy for the long-running multi-agent
        // request. The proxy can reset its upstream socket after generation
        // has completed, even though FastAPI has successfully saved the story.
        backendUrl
          ? `${backendUrl}/api/generate-story`
          : "/api/generate-story",
        formData,
        {
          // Generation uses one bounded AI request. Leave a small margin above
          // the server-side 65-second limit for network and database work.
          timeout: 75000,
        }
      );

    return response.data;
  } catch (error) {
    if (error instanceof RateLimitError) {
      throw new RateLimitError(
        "Story generation rate limit exceeded. Please try again in a few minutes."
      );
    }

    throw error;
  }
}

// ============================================================
// GET ALL STORIES
// ============================================================

export async function getStories(): Promise<
  StoryResponse[]
> {
  const response =
    await api.get<StoryResponse[]>(
      "/api/stories"
    );

  return response.data;
}

// ============================================================
// GET STORY
// ============================================================

export async function getStory(
  storyId: number
): Promise<StoryResponse> {
  const response =
    await api.get<StoryResponse>(
      `/api/stories/${storyId}`
    );

  return response.data;
}

// ============================================================
// BACKWARD-COMPATIBLE ALIAS
// ============================================================

export async function getStoryById(
  storyId: number
): Promise<StoryResponse> {
  return getStory(storyId);
}

// ============================================================
// REVIEW APPROVAL
// ============================================================

export async function approveStoryReview(
  storyId: number
): Promise<StoryResponse> {
  const response = await api.post<StoryResponse>(
    `/api/stories/${storyId}/approve-review`
  );

  return response.data;
}

// ============================================================
// DELETE STORY
// ============================================================

export async function deleteStory(
  storyId: number
): Promise<void> {
  await api.delete(
    `/api/stories/${storyId}`
  );
}
