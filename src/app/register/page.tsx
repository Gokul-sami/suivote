"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import {
  signInWithPhoneNumber,
  ConfirmationResult,
  RecaptchaVerifier,
} from "firebase/auth";

declare global {
  interface Window {
    recaptchaVerifier: RecaptchaVerifier;
  }
}

export default function RegisterPage() {
  const router = useRouter();
  const [voterId, setVoterId] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [confirmationResult, setConfirmationResult] =
    useState<ConfirmationResult | null>(null);
  const [zkp, setZkp] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined" && !window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(
        auth,
        "recaptcha-container",
        {
          size: "invisible",
          callback: (response: unknown) => {
            console.log("reCAPTCHA solved:", response);
          },
        },
      );

      window.recaptchaVerifier.render().catch((err) => {
        console.error("reCAPTCHA render error:", err);
      });
    }
  }, []);

  const generateZKP = () => {
    return "ZKP-" + Math.random().toString(36).substring(2, 10).toUpperCase();
  };

  const handleSendOtp = async () => {
    if (voterId.trim().length < 5 || phone.trim().length !== 10) {
      setError("Enter a valid Voter ID and 10-digit Phone Number");
      return;
    }

    try {
      const formattedPhone = "+91" + phone.trim();
      const appVerifier = window.recaptchaVerifier;

      if (!appVerifier) {
        setError("reCAPTCHA not ready. Please try again.");
        return;
      }

      const result = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      setConfirmationResult(result);
      setOtpSent(true);
      setError("");
      alert("OTP sent successfully!");
    } catch (err) {
      console.error(err);
      setError("Failed to send OTP. Please try again.");
    }
  };

  const handleVerifyOtp = async () => {
    try {
      if (!confirmationResult) {
        setError("OTP confirmation is not available. Please request OTP again.");
        return;
      }

      await confirmationResult.confirm(otp);
      const newZkp = generateZKP();
      setZkp(newZkp);
      localStorage.setItem("zkp", newZkp);
      setError("");
    } catch (err) {
      console.error(err);
      setError("Invalid OTP. Please try again.");
    }
  };

  const handleGoHome = () => {
    router.push("/");
  };

  return (
    <main className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md text-center">
        <h1 className="text-2xl font-bold text-blue-600 mb-4">Register & Get Your ZKP</h1>

        {!zkp ? (
          <>
            {!otpSent ? (
              <>
                <input
                  type="text"
                  value={voterId}
                  onChange={(e) => setVoterId(e.target.value)}
                  placeholder="Enter your Voter ID"
                  className="w-full p-2 border rounded-md mb-4"
                />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter your Phone Number"
                  className="w-full p-2 border rounded-md mb-4"
                />
                {error && <p className="text-red-500 mb-4">{error}</p>}

                <button
                  onClick={handleSendOtp}
                  className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 transition"
                >
                  Send OTP
                </button>
              </>
            ) : (
              <>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter OTP"
                  className="w-full p-2 border rounded-md mb-4"
                />
                {error && <p className="text-red-500 mb-4">{error}</p>}

                <button
                  onClick={handleVerifyOtp}
                  className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
                >
                  Verify OTP
                </button>
              </>
            )}
          </>
        ) : (
          <>
            <p className="text-gray-700 mb-4">✅ Verified Successfully!</p>
            <p className="text-lg font-semibold mb-2">Your ZKP:</p>
            <p className="bg-gray-200 text-blue-800 p-2 rounded-md mb-6 break-words">{zkp}</p>

            <button
              onClick={handleGoHome}
              className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
            >
              Go to Home
            </button>
          </>
        )}

        {/* reCAPTCHA must be rendered here */}
        <div id="recaptcha-container"></div>
      </div>
    </main>
  );
}
