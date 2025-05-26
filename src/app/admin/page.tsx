'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { SuiClient } from "@mysten/sui/client";
import { generateNonce, generateRandomness } from "@mysten/sui/zklogin";

declare global {
  interface Window {
    recaptchaVerifier: RecaptchaVerifier;
  }
}

export default function AdminVerify() {
  const [zkp, setZkp] = useState('');
  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loginGoogle, setLoginGoogle] = useState(false);
  const [otp, setOtp] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  const router = useRouter();

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
        setLoginGoogle(true);
      } catch (error) {
        console.error("Google login error:", error);
      }
    }

  useEffect(() => {
    if (typeof window !== 'undefined' && !window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(
        auth,
        'recaptcha-container',
        { size: 'invisible' },
      );
    }
  }, []);


  const sendOTP = async () => {
    if (zkp !== 'admin') {
      alert('Invalid Admin ZKP');
      return;
    }

    try {
      const result = await signInWithPhoneNumber(
        auth,
        "+91" + phone,
        window.recaptchaVerifier!
      );
      console.log("OTP sent confirmation result:", result);
      setConfirmationResult(result);
      setOtpSent(true);
      alert('OTP sent');
    } catch (error: unknown) {
      console.error("Error during signInWithPhoneNumber:", error);
      alert((error as Error).message || 'Failed to send OTP. Try again.');
    }
  };

  const verifyOTP = async () => {
    if (!confirmationResult) {
      alert('OTP confirmation is not available. Please request a new OTP.');
      return;
    }
    try {
      await confirmationResult.confirm(otp);
      router.push('/admin/dashboard');
    } catch (error) {
      console.error(error);
      alert('Invalid OTP. Try again.');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen space-y-4 px-4">
      <h1 className="text-2xl font-bold">Admin ZKP Verification</h1>
      <button
        onClick={handleGoogleLogin}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >Login with Google</button>

      {!otpSent && !loginGoogle && (
        <>
          <input
            type="text"
            placeholder="Enter Admin ZKP"
            value={zkp}
            onChange={(e) => setZkp(e.target.value)}
            className="border p-2 rounded w-64"
          />
          <input
            type="tel"
            placeholder="+91XXXXXXXXXX"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="border p-2 rounded w-64"
          />
          <button
            onClick={sendOTP}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Send OTP
          </button>
        </>
      )}

      {otpSent && (
        <>
          <input
            type="text"
            placeholder="Enter OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            className="border p-2 rounded w-64"
          />
          <button
            onClick={verifyOTP}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Verify OTP
          </button>
        </>
      )}



      <div id="recaptcha-container"></div>
    </div>
  );
}
