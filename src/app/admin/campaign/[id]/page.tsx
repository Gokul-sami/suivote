'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Ed25519Provider } from 'key-did-provider-ed25519'
import KeyResolver from 'key-did-resolver'
import { DID } from 'dids';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

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
      setConfirmationResult(result);
      setOtpSent(true);
      alert('OTP sent');
    } catch (error: unknown) {
      console.error("Error during signInWithPhoneNumber:", error);
      alert((error as Error).message || 'Failed to send OTP. Try again.');
    }
  };

  const createDID = async (): Promise<string | null> => {
    try {
      const storedKey = window.sessionStorage.getItem("ephemeralPrivateKey");
      console.log("Stored Key:", storedKey);
      if (!storedKey) {
        throw new Error("Ephemeral private key not found in session storage.");
      }
  
      const fullKey = Uint8Array.from(atob(storedKey), c => c.charCodeAt(0));
      const seed = fullKey.slice(0, 32);
  
      const provider = new Ed25519Provider(seed);
      const did = new DID({ provider, resolver: KeyResolver.getResolver() });
      await did.authenticate();
  
      console.log("✅ DID created:", did.id);
      return did.id;
    } catch (error) {
      console.error("❌ Failed to create DID:", error);
      return null;
    }
  };

  const storeDIDInFirestore = async (did: string) => {
    try {
      // Check if DID already exists
      const didDoc = await getDoc(doc(db, 'adminDIDs', did));
      if (didDoc.exists()) {
        console.log('DID already exists in Firestore');
        return;
      }

      // Store new DID
      await setDoc(doc(db, 'adminDIDs', did), {
        did: did,
        createdAt: new Date().toISOString(),
        phone: phone // optional: store the phone number for reference
      });
      console.log('DID stored successfully in Firestore');
    } catch (error) {
      console.error('Error storing DID in Firestore:', error);
      throw error;
    }
  };

  const verifyOTP = async () => {
    if (!confirmationResult) {
      alert('OTP confirmation is not available. Please request a new OTP.');
      return;
    }
    try {
      await confirmationResult.confirm(otp);
      const did = await createDID();
      if (!did) {
        alert('Failed to create DID. Please try again.');
        return;
      } 
      
      // Store the DID in Firestore
      await storeDIDInFirestore(did);
      
      console.log("DID:", did);
      alert(`Your DID: ${did}`);
      window.sessionStorage.setItem("did", did);
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
            Get OTP
          </button>
          <div className="flex items-center w-64 my-2">
            <hr className="flex-grow border-t border-gray-300" />
            <span className="mx-2 text-gray-500 text-sm">or</span>
            <hr className="flex-grow border-t border-gray-300" />
          </div>
          <input
            type="text"
            placeholder="Enter Admin ZKP"
            value={zkp}
            onChange={(e) => setZkp(e.target.value)}
            className="border p-2 rounded w-64"
          />
          <button
            onClick={sendOTP}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Verify
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