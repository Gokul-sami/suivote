"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";

export default function Dashboard() {
  const router = useRouter();
  const [zkLoginAddress, setZkLoginAddress] = useState<string | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const address = window.sessionStorage.getItem("zkLoginUserAddress");
    setZkLoginAddress(address);
  }, []);

  // Close dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setShowProfile(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <main className="relative flex items-center justify-center min-h-screen bg-gray-100">
      {/* Profile section in the top right corner */}
      <div className="absolute top-4 right-6" ref={profileRef}>
        <button
          onClick={() => setShowProfile(!showProfile)}
          className="bg-white border border-gray-300 px-4 py-2 rounded-md shadow hover:shadow-md transition"
        >
          Profile
        </button>

        {showProfile && (
          <div className="mt-2 bg-white border border-gray-200 rounded-md shadow-md p-4 text-sm w-64">
            <strong>zkLoginAddress:</strong>
            <p className="break-words text-gray-800 mt-1">
              {zkLoginAddress || "Not available"}
            </p>
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md text-center">
        <h1 className="text-3xl font-bold text-blue-600 mb-6">SuiVote</h1>
        <p className="mb-6 text-gray-700">Welcome! Please choose an option:</p>

        <div className="space-y-4">
          <button
            onClick={() => router.push("/register")}
            className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 transition"
          >
            Register
          </button>

          <button
            onClick={() => router.push("/verify")}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
          >
            Vote (Verify ZKP)
          </button>
        </div>
      </div>
    </main>
  );
}
