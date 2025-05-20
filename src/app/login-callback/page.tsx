"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { JwtPayload, jwtDecode } from "jwt-decode";
import { generateRandomness, jwtToAddress } from "@mysten/sui/zklogin";

export default function LoginCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState("Processing login...");

  useEffect(() => {
    const processLogin = async () => {
      try {
        // Get id_token from the URL fragment (after #)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const idToken = hashParams.get("id_token");
        console.log("ID Token:", idToken);

        if (!idToken) {
          setStatus("Missing ID token.");
          return;
        }

        // Decode the JWT
        const decodedJwt = jwtDecode<JwtPayload>(idToken);
        console.log("JWT decoded:", decodedJwt);

        // Get ephemeral key and randomness
        const randomness = window.sessionStorage.getItem("randomness");
        const keyExport = window.sessionStorage.getItem("ephemeralPrivateKey");

        if (!randomness || !keyExport) {
          setStatus("Missing ephemeral key or randomness.");
          return;
        }

        // ✅ Generate salt only if not already in localStorage
        let salt = window.localStorage.getItem("salt");
        if (!salt) {
          salt = generateRandomness();
          window.localStorage.setItem("salt", salt);
        }

        const zkLoginUserAddress = jwtToAddress(idToken, salt);
        console.log("ZkLogin User Address:", zkLoginUserAddress);

        // Redirect to dashboard or home
        router.push("/vote");
      } catch (err) {
        console.error("Login processing error:", err);
        setStatus("Login failed.");
      }
    };

    processLogin();
  }, [router]);

  return (
    <main className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow text-center">
        <h1 className="text-xl font-semibold text-blue-600 mb-4">SuiVote</h1>
        <p>{status}</p>
      </div>
    </main>
  );
}
