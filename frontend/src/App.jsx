import Login from "./pages/Login";
import Home from "./pages/Home";
import DashBoard from "./pages/DashBoard";
import { ToastContainer } from "react-toastify";

import { BrowserRouter, Routes, Route } from "react-router-dom";
import VerifyOtp from "./pages/VerifyOtp";
import { AppData } from "./context/AppContext";
import Loading from "./Loading";
import Register from "./pages/Register";
import Verify from "./pages/Verify";
const App = () => {
  const { isAuth, loading, user } = AppData();

  return (
    <>
      {loading ? (
        <Loading />
      ) : (
        <BrowserRouter>
          <Routes>
            <Route path="/" element={isAuth ? <Home /> : <Login />} />
            <Route path="/login" element={isAuth ? <Home /> : <Login />} />
            <Route
              path="/register"
              element={isAuth ? <Home /> : <Register />}
            />
            <Route path="/token/:token" element={<Verify />} />
            <Route
              path="/verifyotp"
              element={isAuth ? <Home /> : <VerifyOtp />}
            />
            <Route
              path="/dashboard"
              element={
                isAuth ? (
                  user?.role === "admin" ? (
                    <DashBoard />
                  ) : (
                    <Home />
                  )
                ) : (
                  <Login />
                )
              }
            />
          </Routes>
          <ToastContainer />
        </BrowserRouter>
      )}
    </>
  );
};

export default App;
