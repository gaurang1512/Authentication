import api from "../apiInterceptor";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";

const DashBoard = () => {
  const [content, setContent] = useState("");

  async function fetchAdminData() {
    try {
      const { data } = await api.get(`/api/v1/admin`, {
        withCredentials: true,
      });
      setContent(data.message);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to fetch admin data"
      );
    }
  }

  useEffect(() => {
    fetchAdminData();
  }, []);

  return (
    <div className="flex flex-col items-center mt-20">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
      {content && <div className="bg-green-100 p-4 rounded">{content}</div>}
      <Link to="/" className="mt-4 text-blue-500 hover:underline">
        Back to Home
      </Link>
    </div>
  );
};

export default DashBoard;
