import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import { forceLogout } from "@/lib/auth-utils";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL || "http://localhost:3000",
  withCredentials: true, // Always send cookies for refresh tokens
  timeout: 10000,
});

// Token management
let isRefreshing = false;
let isLoggingOut = false;
let failedQueue: Array<{
  resolve: (value: any) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });

  failedQueue = [];
};

// Helper function to force logout - updated to use auth-utils
const handleAuthFailure = (reason: string) => {
  console.log('Auth failure detected:', reason);
  forceLogout(reason);
};

// Request interceptor to add access token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    // Special handling for logout endpoint - always force logout regardless of response
    if (originalRequest.url?.includes('/auth/logout')) {
      handleAuthFailure('Logout API call');
      return Promise.reject(error);
    }

    // If we're in the process of logging out, don't try to refresh
    if (isLoggingOut) {
      return Promise.reject(error);
    }

    // If error is 401 and we haven't already tried to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If we're already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => {
          const token = localStorage.getItem('accessToken');
          if (token) {
            originalRequest.headers = originalRequest.headers || {};
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return axiosInstance(originalRequest);
        }).catch((err) => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Try to refresh the token - refresh token will be sent automatically via cookies
        const response = await axiosInstance.post('/auth/refresh-token');

        if (response.data.status === 'success') {
          const { accessToken } = response.data;
          localStorage.setItem('accessToken', accessToken);

          // Update the authorization header
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          }

          processQueue(null, accessToken);
          // Retry the original request
          return axiosInstance(originalRequest);
        }
      } catch (refreshError: any) {
        processQueue(refreshError, null);

        // Check if it's "No refresh token found" or any other refresh token error
        if (refreshError.response?.data?.message === 'No refresh token found' ||
          refreshError.response?.status === 401) {
          console.log('Refresh token expired or not found, forcing logout');
          handleAuthFailure('Refresh token expired or not found');
          return Promise.reject(refreshError);
        }

        // Remove tokens and redirect to login for other errors
        handleAuthFailure('Refresh token error');
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Handle other authentication errors
    if (error.response?.status === 401) {
      console.log('401 error received, forcing logout');
      handleAuthFailure('401 error received');
    }

    // Handle forbidden access
    if (error.response?.status === 403) {
      window.dispatchEvent(new CustomEvent('auth:forbidden', {
        detail: { message: error.response.data?.message || 'Access denied' }
      }));
    }

    return Promise.reject(error);
  }
);

// Auth API endpoints
export const authAPI = {
  // Authentication
  login: (credentials: { email: string; password: string }) =>
    axiosInstance.post('/auth/login', credentials),

  register: (data: { username: string; email: string; password: string; role?: string }) =>
    axiosInstance.post('/auth/register', data),

  logout: async () => {
    isLoggingOut = true;
    try {
      const response = await axiosInstance.post('/auth/logout');
      // On successful logout, the interceptor will handle the auth failure.
      return response;
    } catch (error) {
      // If the API call fails, force a logout.
      console.log('Logout API call failed, but proceeding with local logout');
      handleAuthFailure('Logout API call failed');
      throw error;
    } finally {
      isLoggingOut = false;
    }
  },

  logoutAll: () =>
    axiosInstance.post('/auth/logout-all'),

  refreshToken: () =>
    axiosInstance.post('/auth/refresh-token'),

  // Password management
  forgotPassword: (email: string) =>
    axiosInstance.post('/auth/forgot-password', { email }),

  resetPassword: (token: string, password: string) =>
    axiosInstance.patch(`/auth/reset-password/${token}`, { password }),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    axiosInstance.patch('/auth/change-password', data),

  // Email verification
  verifyEmail: (token: string) =>
    axiosInstance.get(`/auth/verify-email/${token}`),

  resendVerification: () =>
    axiosInstance.post('/auth/resend-verification'),

  // Profile management
  getProfile: () =>
    axiosInstance.get('/auth/profile'),

  updateProfile: (data: { username?: string }) =>
    axiosInstance.patch('/auth/profile', data),

  // User management (Admin)
  getUsers: () =>
    axiosInstance.get('/auth/users'),

  createUser: (data: { username: string; email: string; password: string; role: string }) =>
    axiosInstance.post('/auth/create-user', data),

  deleteUser: (id: string) =>
    axiosInstance.delete(`/auth/users/${id}`),

  // Login history and sessions
  getLoginHistory: () =>
    axiosInstance.get('/auth/login-history'),

  getSessions: () =>
    axiosInstance.get('/auth/sessions'),

  deleteSession: (sessionId: string) =>
    axiosInstance.delete(`/auth/sessions/${sessionId}`),
};

export default axiosInstance;