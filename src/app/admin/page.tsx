'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';
import { auth } from '@/lib/firebase';

declare global {
  interface Window {
    recaptchaVerifier: RecaptchaVerifier;
  }
}

export default function AdminVerify() {
  const [zkp, setZkp] = useState('');
  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  const router = useRouter();

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
    } catch (error: any) {
      console.error("Error during signInWithPhoneNumber:", error);
      alert(error.message || 'Failed to send OTP. Try again.');
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

      {!otpSent && (
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
