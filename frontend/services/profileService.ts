import api from "@/services/api";

// ============================================================
// PROFILE RESPONSE
// ============================================================

export interface ProfileResponse {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  job_title?: string;
  organization?: string;
}

// ============================================================
// PROFILE UPDATE REQUEST
// ============================================================

export interface ProfileUpdateRequest {
  first_name?: string;
  last_name?: string;
  email?: string;
  job_title?: string;
  organization?: string;
}

// ============================================================
// GET PROFILE
// ============================================================

export async function getProfile(): Promise<ProfileResponse> {
  try {
    const response =
      await api.get<ProfileResponse>(
        `/api/profile`
      );

    return response.data;
  } catch (error) {
    throw error;
  }
}

// ============================================================
// UPDATE PROFILE
// ============================================================

export async function updateProfile(
  data: ProfileUpdateRequest
): Promise<ProfileResponse> {
  try {
    const response =
      await api.put<ProfileResponse>(
        `/api/profile`,
        {
          first_name: data.first_name?.trim(),
          last_name: data.last_name?.trim(),
          email: data.email?.trim().toLowerCase(),
          job_title: data.job_title?.trim(),
          organization: data.organization?.trim(),
        }
      );

    return response.data;
  } catch (error) {
    throw error;
  }
}