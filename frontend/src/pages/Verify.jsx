import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../apiInterceptor";

const Verify = () => {
  const { token } = useParams(); // Extract the token from the URL
  const navigate = useNavigate();
  const [verificationStatus, setVerificationStatus] = useState("Verifying...");

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setVerificationStatus("Invalid verification link.");
        toast.error("Invalid verification link.");
        return;
      }

      try {
        // Using the new, clearer backend route
        const { data } = await api.get(`/api/v1/verify-email/${token}`);
        setVerificationStatus(data.message || "Verification successful!");
        toast.success(data.message || "Account verified successfully!");
        // Optionally, redirect to login or home page after successful verification
        navigate("/login");
      } catch (error) {
        setVerificationStatus(
          error.response?.data?.message || "Verification failed."
        );
        toast.error(
          error.response?.data?.message || "Failed to verify account."
        );
        // Optionally, redirect to an error page or back to register/login
        navigate("/register");
      }
    };

    verifyToken();
  }, [token, navigate]);

  return (
    <div>
      <h1>Account Verification</h1>
      <p>{verificationStatus}</p>
    </div>
  );
};
export default Verify;
