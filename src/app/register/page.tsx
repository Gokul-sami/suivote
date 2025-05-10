// app/register/page.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [voterId, setVoterId] = useState("");
  const [phone, setPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [zkp, setZkp] = useState("");

  const DUMMY_OTP = "123456";

  const generateZKP = () => {
    const randomZkp = Math.random().toString(36).substring(2, 10).toUpperCase();
    return randomZkp;
  };

  const handleSendOtp = () => {
    if (voterId.trim().length < 5 || phone.trim().length < 10) {
      setError("Enter a valid Voter ID and Phone Number");
      return;
    }

    // Dummy: simulate sending OTP
    setOtpSent(true);
    setError("");
    alert(`Dummy OTP sent to ${phone}: ${DUMMY_OTP}`);
  };

  const handleVerifyOtp = () => {
    if (otp !== DUMMY_OTP) {
      setError("Invalid OTP. Please try again.");
      return;
    }

    const newZkp = generateZKP();
    localStorage.setItem("zkp", newZkp);
    setZkp(newZkp);
    setError("");
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
            <p className="bg-gray-200 text-blue-800 p-2 rounded-md mb-6 break-words">
              {zkp}
            </p>

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
