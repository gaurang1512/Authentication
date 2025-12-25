import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../apiInterceptor";
import { AppData } from "../context/AppContext";
function VerifyOtp() {
  const [otp, setOtp] = useState("");
  const [btnLoading, setBtnLoading] = useState(false);

  //use to navigate to verify page after login
  const navigate = useNavigate();

  const { setIsAuth, setUser, refetchUser } = AppData();

  const submitHandler = async (e) => {
    e.preventDefault();
    setBtnLoading(true);

    try {
      // Using a more descriptive route for OTP verification
      const { data } = await api.post(`/api/v1/verify`, {
        //sending email and otp to controller
        email: localStorage.getItem("email"),
        otp,
      });

      toast.success(data.message);
      setIsAuth(true);
      setUser(data.user);
      localStorage.clear("email");

      // Refetch user to ensure context is updated
      await refetchUser();

      navigate("/");
    } catch (error) {
      toast.error(
        error.response ? error.response.data.message : "An error occurred"
      );
    } finally {
      setBtnLoading(false);
    }
  };

  function resendOtp() {
    //logic to resend otp
    setBtnLoading(true);
  }
  return (
    <section className="text-gray-600 body-font">
      <div className="container px-5 py-24 mx-auto flex flex-wrap items-center">
        <div className="lg:w-3/5 md:w-1/2 md:pr-16 lg:pr-0 pr-0">
          <h1 className="title-font font-medium text-3xl text-gray-900">
            Slow-carb next level shoindcgoitch ethical authentic, poko scenester
          </h1>
          <p className="leading-relaxed mt-4">
            Poke slow-carb mixtape knausgaard, typewriter street art gentrify
            hammock starladder roathse. Craies vegan tousled etsy austin.
          </p>
        </div>
        <form
          className="lg:w-2/6 md:w-1/2 bg-gray-100 rounded-lg p-8 flex flex-col md:ml-auto w-full mt-10 md:mt-0"
          onSubmit={submitHandler}
        >
          <h2 className="text-gray-900 text-lg font-medium title-font mb-5">
            Verify using OTP
          </h2>

          <div className="relative mb-4">
            <label htmlFor="otp" className="leading-7 text-sm text-gray-600">
              OTP
            </label>
            <input
              type="number"
              id="otp"
              name="otp"
              className="w-full bg-white rounded border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
            />
          </div>

          <button
            className="text-white bg-indigo-500 border-0 py-2 px-8 focus:outline-none hover:bg-indigo-600 rounded text-lg"
            disabled={btnLoading}
          >
            {btnLoading ? "Submiting..." : "Submit"}
          </button>
          <Link to="/login" className="text-xs text-gray-500 mt-3">
            Go to Login page{" "}
          </Link>
          <button className="text-xs mt-3 text-blue-700" disabled={btnLoading}>
            {btnLoading ? "resending..." : "resend OTP"}
          </button>
        </form>
      </div>
    </section>
  );
}

export default VerifyOtp;
