import { useState } from "react";
import axios from "axios";
import { Dropdown } from "primereact/dropdown";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import fptLogo from "../../assets/images/LogoFPT.jpg";
import "./Login.css";
import { useGoogleLogin } from "@react-oauth/google";
import { authService } from "../../services/authService";

const Login = () => {
  const [campus, setCampus] = useState<string | null>(null);
  const navigate = useNavigate();

  const cities = [
    { name: "FU-Hòa Lạc", code: "HN" },
    { name: "FU-Hồ Chí Minh", code: "HCM" },
    { name: "FU-Cần Thơ", code: "CT" },
    { name: "FU-Đà Nẵng", code: "DN" },
    { name: "FU-Quy Nhơn", code: "QN" },
  ];

  const showAlert = (
    icon: "success" | "warning" | "error",
    title: string,
    text: string,
  ) => {
    Swal.fire({
      icon: icon,
      title: title,
      text: text,
      confirmButtonColor: "#F26F21", // FPT Orange
      confirmButtonText: "OK",
    });
  };

  const loginGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      console.log("Google login success:", tokenResponse);
      if (!campus) {
        showAlert("warning", "Choose Campus", "Please select a campus first!");
        return;
      }

      try {
        console.log(
          `Attempting login with: idToken=${tokenResponse.access_token}, campus=${campus}`,
        );
        const response = await authService.login(
          tokenResponse.access_token,
          campus,
        );
        console.log("Backend login success:", response);

        // Save token to localStorage
        localStorage.setItem("token", response.token);

        // Success Alert with Timer
        Swal.fire({
          icon: "success",
          title: "Login Successful!",
          text: `Welcome, ${response.userInfo.fullName}`,
          timer: 1500,
          showConfirmButton: false,
        }).then(() => {
          navigate("/home");
        });
      } catch (error) {
        console.error("Backend login failed:", error);
        let errorMessage = "Unknown error";
        if (axios.isAxiosError(error)) {
          errorMessage =
            error.response?.data?.message || error.message || "Unknown error";
        } else if (error instanceof Error) {
          errorMessage = error.message;
        }
        showAlert("error", "Login Failed", errorMessage);
      }
    },
    onError: () => {
      console.log("Google login failed");
      showAlert("error", "Error", "Google login failed");
    },
  });

  const handleCustomLogin = () => {
    if (!campus) {
      showAlert("warning", "Choose Campus", "Please select a campus first!");
      return;
    }
    loginGoogle();
  };

  return (
    <div className="login-container">
      {/* Background Decorations */}
      <div className="blob-1 animate-blob"></div>
      <div className="blob-2 animate-blob animation-delay-2000"></div>
      <div className="blob-3 animate-blob animation-delay-4000"></div>

      {/* LoginMenu Component */}
      {/* <LoginMenu /> */}

      {/* Login Card */}
      <div className="login-card">
        {/* Header */}
        <div className="text-center mb-6">
          <img
            src={fptLogo}
            alt="App Logo"
            className="mx-auto h-14 object-contain"
          />
        </div>

        {/* Login Form */}
        <div>
          <Dropdown
            value={campus}
            onChange={(e) => setCampus(e.value)}
            options={cities}
            optionLabel="name"
            optionValue="name"
            placeholder="Select a campus"
            className="w-full mb-4"
          />
        </div>

        {/* Divider */}
        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-gray-500">
              Login with your powered email
            </span>
          </div>
        </div>

        <button onClick={handleCustomLogin} className="google-button">
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          <span className="text-gray-700">Login with Google</span>
        </button>

        {/* Register Link */}
        <div className="text-center mt-5">
          <p className="text-gray-600 text-sm">Powered by FPT University © </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
