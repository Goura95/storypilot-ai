import axios from "axios";
import api, { UnauthorizedError, ApiError } from "@/services/api";

// ============================================================
// API URL
// ============================================================

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8000";

// ============================================================
// USER TYPE
// ============================================================

export interface AuthUser {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  job_title?: string;
  organization?: string;
}

// ============================================================
// REGISTER REQUEST
// ============================================================

export interface RegisterRequest {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
}

// ============================================================
// REGISTER RESPONSE
// ============================================================

export interface RegisterResponse {
  success: boolean;
  message: string;
  user_id?: number;
  user?: AuthUser;
}

// ============================================================
// LOGIN REQUEST
// ============================================================

export interface LoginRequest {
  email: string;
  password: string;
}

// ============================================================
// LOGIN RESPONSE
// ============================================================

export interface LoginResponse {
  success: boolean;
  message: string;
  mfa_required?: boolean;
  email?: string;
  access_token?: string;
  token_type?: string;
  user?: AuthUser;
}

// ============================================================
// VERIFY MFA REQUEST
// ============================================================

export interface VerifyMFARequest {
  email: string;
  otp_code: string;
}

// ============================================================
// VERIFY MFA RESPONSE
// ============================================================

export interface VerifyMFAResponse {
  success: boolean;
  message: string;
  access_token?: string;
  token_type?: string;
  user?: AuthUser;
}

// ============================================================
// REGISTER USER
// ============================================================

export async function registerUser(
  data: RegisterRequest
): Promise<RegisterResponse> {
  try {
    const response =
      await axios.post<RegisterResponse>(
        `${API_URL}/api/auth/register`,
        data
      );

    return response.data;
  } catch (error) {
    throw error;
  }
}

// ============================================================
// LOGIN USER
// ============================================================

export async function loginUser(
  data: LoginRequest
): Promise<LoginResponse> {
  try {
    const response =
      await axios.post<LoginResponse>(
        `${API_URL}/api/auth/login`,
        data
      );

    return response.data;
  } catch (error) {
    throw error;
  }
}

// ============================================================
// VERIFY MFA
// ============================================================

export async function verifyMFA(
  data: VerifyMFARequest
): Promise<VerifyMFAResponse> {
  try {
    const response =
      await axios.post<VerifyMFAResponse>(
        `${API_URL}/api/auth/verify-mfa`,
        data
      );

    return response.data;
  } catch (error) {
    throw error;
  }
}

// ============================================================
// CHANGE PASSWORD REQUEST
// ============================================================

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

// ============================================================
// CHANGE PASSWORD RESPONSE
// ============================================================

export interface ChangePasswordResponse {
  success: boolean;
  message: string;
}

// ============================================================
// CHANGE PASSWORD
// ============================================================

export async function changePassword(
  data: ChangePasswordRequest
): Promise<ChangePasswordResponse> {
  try {
    const response =
      await api.post<ChangePasswordResponse>(
        `/api/auth/change-password`,
        data
      );

    return response.data;
  } catch (error) {
    throw error;
  }
}

// ============================================================
// MFA STATUS
// ============================================================

export interface MFAStatusResponse {
  success: boolean;
  mfa_enabled: boolean;
  message: string;
}

// ============================================================
// GET MFA STATUS
// ============================================================

export async function getMFAStatus(): Promise<MFAStatusResponse> {
  try {
    const response =
      await api.get<MFAStatusResponse>(
        `/api/auth/mfa/status`
      );

    return response.data;
  } catch (error) {
    throw error;
  }
}

// ============================================================
// MFA TOGGLE RESPONSE
// ============================================================

export interface MFAToggleResponse {
  success: boolean;
  mfa_enabled: boolean;
  message: string;
}

// ============================================================
// ENABLE MFA
// ============================================================

export async function enableMFA(): Promise<MFAToggleResponse> {
  try {
    const response =
      await api.post<MFAToggleResponse>(
        `/api/auth/mfa/enable`,
        {}
      );

    return response.data;
  } catch (error) {
    throw error;
  }
}

// ============================================================
// DISABLE MFA
// ============================================================

export async function disableMFA(): Promise<MFAToggleResponse> {
  try {
    const response =
      await api.post<MFAToggleResponse>(
        `/api/auth/mfa/disable`,
        {}
      );

    return response.data;
  } catch (error) {
    throw error;
  }
}

// ============================================================
// GET PROFILE
// ============================================================

export interface GetProfileResponse {
  success: boolean;
  message: string;
  user?: AuthUser;
}

export async function getProfile(): Promise<GetProfileResponse> {
  try {
    const response =
      await api.get<GetProfileResponse>(
        `/api/auth/profile`
      );

    return response.data;
  } catch (error) {
    throw error;
  }
}

// ============================================================
// UPDATE PROFILE
// ============================================================

export interface UpdateProfileRequest {
  first_name?: string;
  last_name?: string;
  email?: string;
  job_title?: string;
  organization?: string;
}

export interface UpdateProfileResponse {
  success: boolean;
  message: string;
  user?: AuthUser;
}

export async function updateProfile(
  data: UpdateProfileRequest
): Promise<UpdateProfileResponse> {
  try {
    const response =
      await api.put<UpdateProfileResponse>(
        `/api/auth/profile`,
        data
      );

    return response.data;
  } catch (error) {
    throw error;
  }
}