'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { Ed25519Provider } from 'key-did-provider-ed25519';
import KeyResolver from 'key-did-resolver';
import { DID } from 'dids';
import { doc, setDoc, getDoc } from 'firebase/firestore';

declare global {
  interface Window {
    recaptchaVerifier: RecaptchaVerifier;
  }
}

export default function AdminVerify() {
  const [zkp, setZkp] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(
          auth,
          'recaptcha-container',
          { size: 'invisible' },
        );
        window.recaptchaVerifier.render().catch(console.error);
      }
    }
  }, []);


  const sendOTP = async () => {
    try {
      const result = await signInWithPhoneNumber(
        auth,
        '+91' + phone,
        window.recaptchaVerifier!
      );
      setConfirmationResult(result);
      setOtpSent(true);
      alert('OTP sent to your phone');
    } catch (error: any) {
      console.error('Error sending OTP:', error);
      alert(error.message || 'Failed to send OTP');
    }
  };

  const verifyOTP = async () => {
    if (!confirmationResult) {
      alert('OTP session expired. Please resend.');
      return;
    }

    try {
      await confirmationResult.confirm(otp);
      const did = await createDID();
      if (!did) {
        alert('Failed to create DID.');
        return;
      }
      await storeDIDInFirestore(did, 'admin');
      alert(`Login successful. Your DID: ${did}`);
      window.sessionStorage.setItem('did', did);
      router.push('/admin/dashboard');
    } catch (error) {
      console.error('OTP Verification Failed:', error);
      alert('Invalid OTP');
    }
  };

  const verifyZKP = async () => {
    const did = await createDID();
    if (!did) {
      alert('Failed to create DID.');
      return;
    }
    const didDoc = await getDoc(doc(db, 'admin', did));
    if (didDoc.exists()) {
      router.push('/admin/dashboard');
    }
    window.sessionStorage.setItem('did', did);
    return;
  };

  const createDID = async (): Promise<string | null> => {
    try {
      const storedKey = window.sessionStorage.getItem('ephemeralPrivateKey');
      if (!storedKey) {
        throw new Error('Ephemeral private key not found in session storage.');
      }

      const fullKey = Uint8Array.from(atob(storedKey), c => c.charCodeAt(0));
      const seed = fullKey.slice(0, 32);

      const provider = new Ed25519Provider(seed);
      const did = new DID({ provider, resolver: KeyResolver.getResolver() });
      await did.authenticate();

      console.log('✅ DID created:', did.id);
      return did.id;
    } catch (error) {
      console.error('❌ DID creation failed:', error);
      return null;
    }
  };

  const storeDIDInFirestore = async (did: string, role: 'admin') => {
    try {
      const collection = role === 'admin' ? 'admin' : 'user';
      const didDoc = await getDoc(doc(db, collection, did));
      if (didDoc.exists()) {
        console.log('DID already exists in Firestore');
        return;
      }

      await setDoc(doc(db, collection, did), {
        did,
        createdAt: new Date().toISOString(),
      });

      console.log(`✅ ${role} DID stored`);
    } catch (error) {
      console.error('Firestore Error:', error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen space-y-6 px-4">
      <h1 className="text-2xl font-bold">Login as Admin or User</h1>

      {/* Admin ZKP Login */}
      <div className="border p-4 rounded w-72 shadow">
        <h2 className="text-lg font-semibold mb-2">Admin Login</h2>
        <input
          type="text"
          placeholder="Enter Admin ZKP"
          value={zkp}
          onChange={(e) => setZkp(e.target.value)}
          className="border p-2 rounded w-full mb-2"
        />
        <button
          onClick={verifyZKP}
          className="bg-purple-600 text-white px-4 py-2 rounded w-full hover:bg-purple-700"
        >
          Login with ZKP
        </button>
      </div>

      {/* Divider */}
      <div className="text-gray-400 text-sm">OR</div>

      {/* Phone OTP Login */}
      <div className="border p-4 rounded w-72 shadow">
        <h2 className="text-lg font-semibold mb-2">User Login</h2>
        {!otpSent ? (
          <>
            <input
              type="tel"
              placeholder="Enter Phone Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="border p-2 rounded w-full mb-2"
            />
            <button
              onClick={sendOTP}
              className="bg-blue-600 text-white px-4 py-2 rounded w-full hover:bg-blue-700"
            >
              Send OTP
            </button>
          </>
        ) : (
          <>
            <input
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="border p-2 rounded w-full mb-2"
            />
            <button
              onClick={verifyOTP}
              className="bg-green-600 text-white px-4 py-2 rounded w-full hover:bg-green-700"
            >
              Verify OTP
            </button>
          </>
        )}
      </div>

      <div id="recaptcha-container"></div>
    </div>
  );
}
