"use client";
import { useRouter } from "next/navigation";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { SuiClient } from "@mysten/sui/client";
import { generateNonce, generateRandomness } from "@mysten/sui/zklogin";
// import { toB64 } from "@mysten/bcs";


export default function HomePage() {
  const router = useRouter();

  //   const handleReset = () => {
  //   // Your provided reset function
  //   const resetLocalState = () => {
  //     sessionStorage.clear();
  //     localStorage.clear();
  //     router.push("/"); // ensure router is defined or use useRouter from next/router
  //   };

  //   resetLocalState();
  // };

  async function handleGoogleLogin() {
    try {
      // 1. Get current epoch info from Sui
      const suiClient = new SuiClient({ url: "https://fullnode.devnet.sui.io" });
      const { epoch } = await suiClient.getLatestSuiSystemState();
      const maxEpoch = Number(epoch) + 2;

      // 2. Generate ephemeral key and randomness
      const ephemeralKeyPair = new Ed25519Keypair();
      const privateKeyBase64 = ephemeralKeyPair.getSecretKey();

      // const privateKeyBase64 = toB64(Uint8Array.from(ephemeralKeyPair.getSecretKey()));
      console.log("Ephemeral Private Key (Base64):", privateKeyBase64);
      const randomness = generateRandomness();

      // if(!window.sessionStorage.getItem("randomness") || !window.sessionStorage.getItem("ephemeralPrivateKey") || !window.localStorage.getItem("epoch")) {
      //         window.sessionStorage.setItem("randomness", randomness);
      //         window.sessionStorage.setItem("ephemeralPrivateKey", privateKeyBase64);
      //         window.localStorage.setItem("epoch", maxEpoch.toString());
      // }

      window.sessionStorage.setItem("randomness", randomness);
      window.sessionStorage.setItem("ephemeralPrivateKey", privateKeyBase64);
      window.localStorage.setItem("epoch", maxEpoch.toString());

      // 3. Create nonce using the ephemeral public key
      const nonce = generateNonce(ephemeralKeyPair.getPublicKey(), maxEpoch, randomness);

      // 4. Redirect to Google OAuth with nonce as the "state"
      const clientId = "858676690672-ovpth6ambmpu19kl1rhj00l56dgp8kut.apps.googleusercontent.com";
      const redirectUri = window.location.origin + "/login-callback";
      const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=id_token&client_id=${clientId}&redirect_uri=${redirectUri}&scope=openid%20email&nonce=${nonce}&state=${nonce}`;

      window.location.href = googleAuthUrl;
    } catch (error) {
      console.error("Google login error:", error);
    }
  }

  return (
    <main className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md text-center">
        <h1 className="text-3xl font-bold text-blue-600 mb-6">SuiVote</h1>
        <p className="mb-6 text-gray-700">Welcome! Please choose an option:</p>

        <div className="space-y-4">
          {/* <button
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
          </button> */}

          <button
            onClick={() => router.push("/admin")}
            className="w-full bg-gray-800 text-white py-2 rounded-md hover:bg-gray-900 transition"
          >
            Admin Login
          </button>

          <div className="border-t pt-4">
            <button
              onClick={handleGoogleLogin}
              className="w-full bg-red-500 text-white py-2 rounded-md hover:bg-red-600 transition"
            >
              Login with Google (ZK)
            </button>
          </div>
          <p></p>
              {/* <button onClick={handleReset} style={{ padding: '8px 16px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                Reset Login State
              </button> */}
        </div>
      </div>
    </main>
  );
}

// "use client";
// import { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";
// import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
// import { SuiClient } from "@mysten/sui/client";
// import {
//   generateNonce,
//   generateRandomness,
//   jwtToAddress,
//   getExtendedEphemeralPublicKey,
// } from "@mysten/sui/zklogin";
// import { fromB64, toB64 } from "@mysten/bcs";
// import { JwtPayload, jwtDecode } from "jwt-decode";
// import axios from "axios";

// export type PartialZkLoginSignature = Omit<
//   Parameters<typeof getExtendedEphemeralPublicKey>["0"],
//   "addressSeed"
// >;

// export default function HomePage() {
//   const router = useRouter();
//   const [status, setStatus] = useState("");

//   const handleReset = () => {
//     sessionStorage.clear();
//     localStorage.clear();
//     router.push("/");
//   };

//   const handleGoogleLogin = async () => {
//     try {
//       const suiClient = new SuiClient({ url: "https://fullnode.devnet.sui.io" });
//       const { epoch } = await suiClient.getLatestSuiSystemState();
//       const maxEpoch = Number(epoch) + 2;

//       const ephemeralKeyPair = new Ed25519Keypair();
//       const privateKeyBase64 = toB64(
//         Uint8Array.from(ephemeralKeyPair.getSecretKey().slice(0, 32))
//       );
//       const randomness = generateRandomness();

//       sessionStorage.setItem("randomness", randomness);
//       sessionStorage.setItem("ephemeralPrivateKey", privateKeyBase64);
//       localStorage.setItem("epoch", maxEpoch.toString());

//       const nonce = generateNonce(ephemeralKeyPair.getPublicKey(), maxEpoch, randomness);

//       const clientId =
//         "858676690672-ovpth6ambmpu19kl1rhj00l56dgp8kut.apps.googleusercontent.com";
//       const redirectUri = "http://localhost:3000"; // Redirects to same page
//       const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=id_token&client_id=${clientId}&redirect_uri=${redirectUri}&scope=openid%20email&nonce=${nonce}&state=${nonce}`;

//       window.location.href = googleAuthUrl;
//     } catch (error) {
//       console.error("Google login error:", error);
//     }
//   };

//   // ZK Login callback handling (moved here from separate file)
//   useEffect(() => {
//     const hashParams = new URLSearchParams(window.location.hash.substring(1));
//     const idToken = hashParams.get("id_token");
//     if (!idToken) return;

//     const processLogin = async () => {
//       try {
//         setStatus("Processing login...");
//         const decodedJwt = jwtDecode<JwtPayload>(idToken);
//         console.log("JWT decoded:", decodedJwt);

//         const randomness = window.sessionStorage.getItem("randomness");
//         const keyExport = window.sessionStorage.getItem("ephemeralPrivateKey");

//         if (!randomness || !keyExport) {
//           setStatus("Missing ephemeral key or randomness.");
//           return;
//         }

//         let salt = window.localStorage.getItem("salt");
//         if (!salt) {
//           salt = generateRandomness();
//           window.localStorage.setItem("salt", salt);
//         }

//         const zkLoginUserAddress = jwtToAddress(idToken, salt);
//         console.log("ZkLogin User Address:", zkLoginUserAddress);

//         const randomnessBigInt = BigInt(randomness);
//         const saltBigInt = BigInt(salt);
//         const randomnessBytes = new Uint8Array(16);
//         const saltBytes = new Uint8Array(16);
//         for (let i = 15; i >= 0; i--) {
//           randomnessBytes[i] = Number((randomnessBigInt >> BigInt((15 - i) * 8)) & BigInt(0xff));
//           saltBytes[i] = Number((saltBigInt >> BigInt((15 - i) * 8)) & BigInt(0xff));
//         }

//         const randomnessBase64 = toB64(randomnessBytes);
//         const saltBase64 = toB64(saltBytes);
//         const ephemeralKeyPair = Ed25519Keypair.fromSecretKey(fromB64(keyExport));
//         const extendedEphemeralPublicKey = getExtendedEphemeralPublicKey(
//           ephemeralKeyPair.getPublicKey()
//         );

//         const epoch = window.localStorage.getItem("epoch");
//         const zkProofResult = await axios.post(
//           "https://prover-dev.mystenlabs.com/v1",
//           {
//             jwt: idToken,
//             extendedEphemeralPublicKey,
//             maxEpoch: epoch,
//             jwtRandomness: randomnessBase64,
//             salt: saltBase64,
//             keyClaimName: "sub",
//           },
//           {
//             headers: {
//               "Content-Type": "application/json",
//             },
//           }
//         );

//         const partialZkLoginSignature = zkProofResult.data as PartialZkLoginSignature;
//         console.log("Partial ZK Login Signature:", partialZkLoginSignature);

//         setStatus("Redirecting...");
//         router.push("/vote");
//       } catch (err) {
//         console.error("Login processing error:", err);
//         setStatus("Login failed.");
//       }
//     };

//     processLogin();
//   }, [router]);

//   return (
//     <main className="flex items-center justify-center min-h-screen bg-gray-100">
//       <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md text-center">
//         <h1 className="text-3xl font-bold text-blue-600 mb-6">SuiVote</h1>
//         <p className="mb-6 text-gray-700">Welcome! Please choose an option:</p>

//         <div className="space-y-4">
//           <button
//             onClick={() => router.push("/register")}
//             className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 transition"
//           >
//             Register / Get ZKP
//           </button>

//           <button
//             onClick={() => router.push("/verify")}
//             className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
//           >
//             Vote (Verify ZKP)
//           </button>

//           <button
//             onClick={() => router.push("/admin")}
//             className="w-full bg-gray-800 text-white py-2 rounded-md hover:bg-gray-900 transition"
//           >
//             Admin Login
//           </button>

//           <div className="border-t pt-4">
//             <button
//               onClick={handleGoogleLogin}
//               className="w-full bg-red-500 text-white py-2 rounded-md hover:bg-red-600 transition"
//             >
//               Login with Google (ZK)
//             </button>
//           </div>

//           <button
//             onClick={handleReset}
//             style={{
//               padding: "8px 16px",
//               background: "#ef4444",
//               color: "white",
//               border: "none",
//               borderRadius: "8px",
//               cursor: "pointer",
//             }}
//           >
//             Reset Login State
//           </button>

//           {status && (
//             <div className="mt-4 text-sm text-gray-600">
//               <strong>Status:</strong> {status}
//             </div>
//           )}
//         </div>
//       </div>
//     </main>
//   );
// }

