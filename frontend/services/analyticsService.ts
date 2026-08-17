import api from "@/services/api";

// ============================================================
// TYPES
// ============================================================

export interface AnalyticsDistribution {
  name: string;
  count: number;
  percentage: number;
}

export interface AnalyticsCount {
  name: string;
  count: number;
}

export interface StoryOverTime {
  date: string;
  count: number;
}

export interface QACoverage {
  total_acceptance_criteria: number;
  total_definition_of_done: number;
  total_test_scenarios: number;
  total_test_steps: number;
  average_test_scenarios_per_story: number;
}

export interface AnalyticsResponse {
  total_stories: number;

  total_story_points: number;

  average_story_points: number;

  total_test_scenarios: number;

  total_acceptance_criteria: number;

  total_definition_of_done: number;

  total_test_steps: number;

  stories_by_priority: AnalyticsDistribution[];

  stories_by_type: AnalyticsDistribution[];

  stories_by_module: AnalyticsDistribution[];

  stories_over_time: StoryOverTime[];

  qa_coverage: QACoverage;
}

// ============================================================
// GET ANALYTICS
// ============================================================

export async function getAnalytics(): Promise<AnalyticsResponse> {
  try {
    const response = await api.get<AnalyticsResponse>(
      `/api/analytics`
    );

    return response.data;
  } catch (error) {
    throw error;
  }
}