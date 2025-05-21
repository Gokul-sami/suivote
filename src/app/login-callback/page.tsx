"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { JwtPayload, jwtDecode } from "jwt-decode";
import { generateRandomness, jwtToAddress, getExtendedEphemeralPublicKey, getZkLoginSignature, } from "@mysten/sui/zklogin";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { toB64 } from "@mysten/bcs";
import axios from "axios";

export type PartialZkLoginSignature = Omit<
  Parameters<typeof getZkLoginSignature>["0"]["inputs"],
  "addressSeed"
>;

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
        //const jwtRandomness = toB64(randomness);

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
        const newsalt=salt;
        const zkLoginUserAddress = jwtToAddress(idToken, newsalt);
        console.log("ZkLogin User Address:", zkLoginUserAddress);
        
        const randomnessBigInt = BigInt(randomness);
        const saltBigInt = BigInt(newsalt);    

        const randomnessBytes = new Uint8Array(16);
        const saltBytes = new Uint8Array(16);
        for (let i = 15; i >= 0; i--) {
          randomnessBytes[i] = Number(randomnessBigInt >> BigInt((15 - i) * 8) & BigInt(0xff));
          saltBytes[i] = Number(saltBigInt >> BigInt((15 - i) * 8) & BigInt(0xff));
        }

        // Encode to Base64
        const randomnessBase64 = toB64(randomnessBytes);
        const saltBase64 = toB64(saltBytes);

        const ephemeralKeyPair = Ed25519Keypair.fromSecretKey(keyExport);
        console.log("Ephemeral Key Pair:", ephemeralKeyPair);
        const extendedEphemeralPublicKey = getExtendedEphemeralPublicKey(ephemeralKeyPair.getPublicKey());

        const epoch = window.localStorage.getItem("epoch");
        console.log("Epoch from localStorage:", epoch);
        console.log("ZK Prover payload:", {
                  jwt: idToken,
                  extendedEphemeralPublicKey,
                  maxEpoch: epoch,
                  jwtRandomness: randomnessBase64,
                  saltBase64,
                  keyClaimName: "sub",
                });


        const zkProofResult = await axios.post(
          "https://prover-dev.mystenlabs.com/v1",
          {
            jwt: idToken,
            extendedEphemeralPublicKey: extendedEphemeralPublicKey,
            maxEpoch: epoch,
            jwtRandomness: randomnessBase64,
            salt: saltBase64,
            keyClaimName: "sub",
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );


        const partialZkLoginSignature = zkProofResult.data as PartialZkLoginSignature;
        
        console.log("Partial ZK Login Signature:", partialZkLoginSignature);

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

