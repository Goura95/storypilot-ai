import axios, {
  AxiosInstance,
  AxiosError,
} from "axios";

// ============================================================
// API ERROR RESPONSE
// ============================================================

interface ApiErrorResponse {
  detail?: string | {
    code?: string;
    message?: string;
    stage?: string;
    request_id?: string;
  };
  message?: string;
}

// ============================================================
// CUSTOM ERROR TYPES
// ============================================================

export class ApiError extends Error {
  constructor(
    public status: number,
    public detail: string,
    message?: string
  ) {
    super(message || detail);
    this.name = "ApiError";
  }
}

export class RateLimitError extends ApiError {
  constructor(
    message = "API rate limit exceeded. Please try again in a few minutes."
  ) {
    super(429, message, message);
    this.name = "RateLimitError";
  }
}

export class UnauthorizedError extends ApiError {
  constructor(
    message = "Unauthorized. Please login again."
  ) {
    super(401, message, message);
    this.name = "UnauthorizedError";
  }
}

export class NotFoundError extends ApiError {
  constructor(
    message = "Resource not found."
  ) {
    super(404, message, message);
    this.name = "NotFoundError";
  }
}

export class BadRequestError extends ApiError {
  constructor(
    message = "Bad request."
  ) {
    super(400, message, message);
    this.name = "BadRequestError";
  }
}

// ============================================================
// API CLIENT
// ============================================================

const API: AxiosInstance = axios.create({
  // Requests go through Next's same-origin /api rewrite. This prevents the
  // browser from failing a cross-origin request before FastAPI can respond.
  baseURL: "/",
  timeout: 30000,
});

// ============================================================
// REQUEST INTERCEPTOR
// ============================================================

API.interceptors.request.use(
  (config) => {
    // Add JWT token to authorization header
    if (typeof window !== "undefined") {
      const token =
        localStorage.getItem("token") ||
        localStorage.getItem("access_token");

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    console.debug("API Request:", {
      method: config.method?.toUpperCase(),
      url: config.url,
      hasAuth: !!config.headers.Authorization,
    });

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ============================================================
// RESPONSE INTERCEPTOR
// ============================================================

API.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError<ApiErrorResponse>) => {
    const status = error.response?.status || 0;

    const data = error.response?.data;

    const detail =
      typeof data?.detail === "string"
        ? data.detail
        : data?.detail?.message ||
          data?.message ||
          error.message ||
          "An error occurred";

    console.error("API Error:", {
      status,
      detail,
      url: error.config?.url,
      method: error.config?.method,
      message: error.message,
    });

    // ========================================================
    // RATE LIMIT
    // ========================================================

    if (status === 429) {
      return Promise.reject(
        new RateLimitError(detail)
      );
    }

    // ========================================================
    // UNAUTHORIZED
    // ========================================================

    if (status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        localStorage.removeItem("access_token");
        localStorage.removeItem("user");

        window.dispatchEvent(
          new Event("storypilot-auth-change")
        );
      }

      return Promise.reject(
        new UnauthorizedError(detail)
      );
    }

    // ========================================================
    // NOT FOUND
    // ========================================================

    if (status === 404) {
      return Promise.reject(
        new NotFoundError(detail)
      );
    }

    // ========================================================
    // BAD REQUEST
    // ========================================================

    if (status === 400) {
      return Promise.reject(
        new BadRequestError(detail)
      );
    }

    // ========================================================
    // SERVER ERROR
    // ========================================================

    if (status >= 500) {
      return Promise.reject(
        new ApiError(
          status,
          detail
        )
      );
    }

    // ========================================================
    // NETWORK ERROR
    // ========================================================

    if (!error.response) {
      let networkErrorMsg =
        "Network error: Unable to reach the server.";

      if (error.code === "ECONNABORTED") {
        networkErrorMsg =
          "Request timeout. Please check your connection and try again.";
      } else if (error.code === "ENOTFOUND") {
        networkErrorMsg =
          "Server address not found. Please check the API URL configuration.";
      } else if (error.code === "ECONNREFUSED") {
        networkErrorMsg =
          "Connection refused. The API server may not be running.";
      }

      console.error("[Network Error Details]", {
        code: error.code,
        message: error.message,
        url: error.config?.url,
        method: error.config?.method,
        timeout: error.config?.timeout,
      });

      return Promise.reject(
        new ApiError(
          0,
          networkErrorMsg,
          error.message
        )
      );
    }

    // ========================================================
    // GENERIC ERROR
    // ========================================================

    return Promise.reject(
      new ApiError(
        status,
        detail,
        error.message
      )
    );
  }
);

export default API;
