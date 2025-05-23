"use client";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const router = useRouter();

  return (
    <main className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md text-center">
        <h1 className="text-3xl font-bold text-blue-600 mb-6">SuiVote</h1>
        <p className="mb-6 text-gray-700">Welcome! Please choose an option:</p>

        <div className="space-y-4">
          <button
            onClick={() => router.push("/register")}
            className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 transition"
          >
            Register / Get ZKP
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



