import api from "@/services/api";

// ============================================================
// SESSION TYPE
// ============================================================

export interface UserSession {
  id: number;

  session_id: string;

  device: string;

  browser: string;

  operating_system: string;

  ip_address: string | null;

  created_at: string;

  last_active_at: string;

  expires_at: string;

  is_current: boolean;
}

// ============================================================
// GET SESSIONS RESPONSE
// ============================================================

export interface ActiveSessionsResponse {
  success: boolean;

  message: string;

  sessions: UserSession[];
}

// ============================================================
// SESSION ACTION RESPONSE
// ============================================================

export interface SessionActionResponse {
  success: boolean;

  message: string;
}

// ============================================================
// GET ACTIVE SESSIONS
// ============================================================

export async function getActiveSessions(): Promise<ActiveSessionsResponse> {
  try {
    const response = await api.get<ActiveSessionsResponse>("/api/auth/sessions");
    return response.data;
  } catch (error) {
    throw error;
  }
}

// ============================================================
// REVOKE SESSION
// ============================================================

export async function revokeSession(sessionId: string): Promise<SessionActionResponse> {
  try {
    const response = await api.delete<SessionActionResponse>(`/api/auth/sessions/${sessionId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
}

// ============================================================
// REVOKE ALL OTHER SESSIONS
// ============================================================

export async function revokeAllOtherSessions(): Promise<SessionActionResponse> {
  try {
    const response = await api.post<SessionActionResponse>("/api/auth/sessions/revoke-all", {});
    return response.data;
  } catch (error) {
    throw error;
  }
}
