import { createContext, useContext, useEffect, useState } from "react";
import api from "../apiInterceptor";
import { toast } from "react-toastify";

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuth, setIsAuth] = useState(false);
  const [loading, setLoading] = useState(true);

  // 🔑 Detect current auth state
  const fetchUser = async () => {
    try {
      const { data } = await api.get("/api/v1/me");

      setUser(data.user);
      setIsAuth(true);

      // Inform interceptor that user has a valid session
      localStorage.setItem("wasLoggedIn", "true");
    } catch (error) {
      // 401 here is NORMAL → user is not logged in
      setUser(null);
      setIsAuth(false);

      localStorage.removeItem("wasLoggedIn");
    } finally {
      setLoading(false);
    }
  };

  // 🔄 Manual re-check (after login / refresh)
  const refetchUser = async () => {
    setLoading(true);
    await fetchUser();
  };

  // 🚪 Logout flow
  const logoutUser = async () => {
    try {
      const { data } = await api.post("/api/v1/logout");

      toast.success(data.message);

      setUser(null);
      setIsAuth(false);
      localStorage.removeItem("wasLoggedIn");
    } catch {
      toast.error("Error logging out user");
    }
  };

  // 🔁 Runs once on app load
  useEffect(() => {
    fetchUser();
  }, []);

  // ⛔ Block UI until auth state is known
  if (loading) return null; // or a spinner

  return (
    <AppContext.Provider
      value={{
        user,
        isAuth,
        loading,
        setUser,
        setIsAuth,
        logoutUser,
        refetchUser,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const AppData = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("AppContext must be used within AppProvider");
  }
  return context;
};

export default AppContext;
