import axios from "axios";

const server = "http://localhost:5000";

const api = axios.create({
  baseURL: server,
  withCredentials: true,
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error) => {
  failedQueue.forEach((prom) => {
    error ? prom.reject(error) : prom.resolve();
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    const status = error.response?.status;
    const url = originalRequest?.url;

    // ❌ Do NOT refresh for these endpoints
    const excludedRoutes = [
      "/api/v1/login",
      "/api/v1/register",
      "/api/v1/refresh",
    ];

    const isExcluded = excludedRoutes.some((route) => url?.includes(route));

    // ❌ No refresh if user was never logged in
    const wasLoggedIn = localStorage.getItem("wasLoggedIn");

    if (
      status === 401 &&
      !originalRequest._retry &&
      !isExcluded &&
      wasLoggedIn
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => api(originalRequest));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await api.post("/api/v1/refresh");
        processQueue(null);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);

        // Hard logout – refresh token is invalid
        localStorage.removeItem("wasLoggedIn");

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
