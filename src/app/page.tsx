"use client";
import { useRouter } from "next/navigation";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { SuiClient } from "@mysten/sui/client";
import { generateNonce, generateRandomness } from "@mysten/sui/zklogin";
import { toB64 } from "@mysten/bcs";


export default function HomePage() {
  const router = useRouter();

  async function handleGoogleLogin() {
    try {
      // 1. Get current epoch info from Sui
      const suiClient = new SuiClient({ url: "https://fullnode.devnet.sui.io" });
      const { epoch } = await suiClient.getLatestSuiSystemState();
      const maxEpoch = Number(epoch) + 2;

      // 2. Generate ephemeral key and randomness
      const ephemeralKeyPair = new Ed25519Keypair();
      const privateKeyBase64 = toB64(Uint8Array.from(ephemeralKeyPair.getSecretKey()));
      const randomness = generateRandomness();

      window.sessionStorage.setItem("randomness", randomness);
      window.sessionStorage.setItem("ephemeralPrivateKey", privateKeyBase64);

      // 3. Create nonce using the ephemeral public key
      const nonce = generateNonce(ephemeralKeyPair.getPublicKey(), maxEpoch, randomness);

      // 4. Redirect to Google OAuth with nonce as the "state"
      const clientId = "858676690672-ovpth6ambmpu19kl1rhj00l56dgp8kut.apps.googleusercontent.com";
      const redirectUri = "http://localhost:3000/login-callback"; // You need to create this route
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
        </div>
      </div>
    </main>
  );
}
