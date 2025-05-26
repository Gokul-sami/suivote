// app/verify/page.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function VerifyPage() {
  const router = useRouter();
  const [inputZkp, setInputZkp] = useState("");
  const [error, setError] = useState("");

  const handleVerify = () => {
    const storedZkp = localStorage.getItem("did");

    if (!storedZkp) {
      setError("No ZKP found. Please register first.");
      return;
    }

    if (inputZkp.trim().toUpperCase() !== storedZkp.toUpperCase()) {
      setError("Invalid ZKP. Please try again.");
      return;
    }

    setError("");
    router.push("/vote");  // Redirect to voting page
  };

  return (
    <main className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md text-center">
        <h1 className="text-2xl font-bold text-blue-600 mb-4">Verify Your DID</h1>

        <input
          type="text"
          value={inputZkp}
          onChange={(e) => setInputZkp(e.target.value)}
          placeholder="Enter your DID"
          className="w-full p-2 border rounded-md mb-4"
        />

        {error && <p className="text-red-500 mb-4">{error}</p>}

        <button
          onClick={handleVerify}
          className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
        >
          Verify & Proceed
        </button>
      </div>
    </main>
  );
}
