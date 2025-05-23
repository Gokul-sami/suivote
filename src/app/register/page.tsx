"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import {
  signInWithPhoneNumber,
  RecaptchaVerifier,
  ConfirmationResult,
} from "firebase/auth";

export default function RegisterPage() {
  const router = useRouter();
  const [voterId, setVoterId] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [zkp, setZkp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
  const confirmationResultRef = useRef<ConfirmationResult | null>(null);

  // Initialize and cleanup reCAPTCHA
  useEffect(() => {
    // Initialize reCAPTCHA
    recaptchaVerifierRef.current = new RecaptchaVerifier(
      auth,
      "recaptcha-container",
      {
        size: "invisible",
        callback: () => {
          console.log("reCAPTCHA resolved");
        },
        "expired-callback": () => {
          setError("reCAPTCHA expired. Please try again.");
          setOtpSent(false);
        },
      },
    );

    return () => {
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
      }
    };
  }, []);

  // Simple ZKP generation (placeholder; use cryptographic library in production)
  const generateZKP = () => {
    return "ZKP-" + Math.random().toString(36).substring(2, 10).toUpperCase();
  };

  const handleSendOtp = async () => {
    setError("");
    setLoading(true);

    // Validate inputs
    if (voterId.trim().length < 5) {
      setError("Voter ID must be at least 5 characters.");
      setLoading(false);
      return;
    }
    if (!/^\d{10}$/.test(phone.trim())) {
      setError("Phone number must be exactly 10 digits.");
      setLoading(false);
      return;
    }

    try {
      const formattedPhone = "+91" + phone.trim();
      const appVerifier = recaptchaVerifierRef.current;
      if (!appVerifier) {
        setError("reCAPTCHA not initialized. Please refresh and try again.");
        setLoading(false);
        return;
      }

      const result = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      confirmationResultRef.current = result; // Store in ref instead of window
      setOtpSent(true);
      alert("OTP sent successfully!");
    } catch (err: unknown) {
      console.error("Error sending OTP:", err);
      const errorMessages: { [key: string]: string } = {
        "auth/invalid-phone-number": "Invalid phone number format.",
        "auth/too-many-requests": "Too many requests. Please try again later.",
        "auth/quota-exceeded": "SMS quota exceeded. Try again later.",
      };
      let code = "";
      if (typeof err === "object" && err !== null && "code" in err) {
        code = (err as { code?: string }).code ?? "";
      }
      setError(errorMessages[code] || "Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setError("");
    setLoading(true);

    try {
      const confirmationResult = confirmationResultRef.current;
      if (!confirmationResult) {
        setError("No OTP request found. Please request OTP again.");
        setLoading(false);
        return;
      }

      await confirmationResult.confirm(otp);
      const newZkp = generateZKP();
      setZkp(newZkp);
      localStorage.setItem("zkp", newZkp);
    } catch (err: unknown) {
      console.error("Error verifying OTP:", err);
      let errorMessage = "Failed to verify OTP. Please try again.";
      if (typeof err === "object" && err !== null && "code" in err) {
        const code = (err as { code?: string }).code;
        if (code === "auth/invalid-verification-code") {
          errorMessage = "Invalid OTP. Please try again.";
        }
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoHome = () => {
    router.push("/");
  };

  return (
    <main className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md text-center relative">
        <h1 className="text-2xl font-bold text-blue-600 mb-4">Register & Get Your ZKP</h1>

        {/* reCAPTCHA container (placed early to ensure availability) */}
        <div id="recaptcha-container" />

        {!zkp ? (
          <>
            {!otpSent ? (
              <>
                <input
                  type="text"
                  value={voterId}
                  onChange={(e) => setVoterId(e.target.value.trim())}
                  placeholder="Enter your Voter ID"
                  className="w-full p-2 border rounded-md mb-4"
                  disabled={loading}
                />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))} // Allow only digits
                  placeholder="Enter 10-digit Phone Number"
                  maxLength={10}
                  className="w-full p-2 border rounded-md mb-4"
                  disabled={loading}
                />
                {error && <p className="text-red-500 mb-4">{error}</p>}

                <button
                  onClick={handleSendOtp}
                  className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 transition disabled:bg-green-400"
                  disabled={loading}
                >
                  {loading ? "Sending OTP..." : "Send OTP"}
                </button>
              </>
            ) : (
              <>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} // Allow only digits
                  placeholder="Enter 6-digit OTP"
                  maxLength={6}
                  className="w-full p-2 border rounded-md mb-4"
                  disabled={loading}
                />
                {error && <p className="text-red-500 mb-4">{error}</p>}

                <button
                  onClick={handleVerifyOtp}
                  className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition disabled:bg-blue-400"
                  disabled={loading}
                >
                  {loading ? "Verifying OTP..." : "Verify OTP"}
                </button>
                <button
                  onClick={() => {
                    setOtpSent(false);
                    setOtp("");
                    setError("");
                  }}
                  className="w-full mt-2 text-blue-600 hover:underline"
                  disabled={loading}
                >
                  Back to Phone Input
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
      </div>
    </main>
  );
}
