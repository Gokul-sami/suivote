"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import {
  signInWithPhoneNumber,
  RecaptchaVerifier,
  ConfirmationResult,
} from "firebase/auth";

export default function RegisterPage() {
  const router = useRouter();

  const [step, setStep] = useState(1);

  // Step 1 state
  const [fullName, setFullName] = useState("");
  const [voterId, setVoterId] = useState("");
  const [fatherName, setFatherName] = useState("");
  const [motherName, setMotherName] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [address, setAddress] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [idProof, setIdProof] = useState<File | null>(null);

  // Step 2 state
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");

  const [error, setError] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [info, setInfo] = useState("");

  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
  const confirmationResultRef = useRef<ConfirmationResult | null>(null);

  useEffect(() => {
    if (!recaptchaVerifierRef.current) {
      recaptchaVerifierRef.current = new RecaptchaVerifier(
        auth,
        "recaptcha-container",
        {
          size: "invisible",
          callback: () => console.log("reCAPTCHA solved"),
          "expired-callback": () => {
            setError("reCAPTCHA expired. Please refresh.");
            setStep(1);
          },
        }
      );
    }

    return () => {
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
      }
    };
  }, []);

  const validateStep1 = () => {
    if (!/^[A-Z]{3}[0-9]{7}$/.test(voterId)) {
      setError(
        "Voter ID must be 3 uppercase letters followed by 7 digits (total 10 characters)."
      );
      return false;
    }

    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(dob)) {
      setError("Date of Birth must be in format dd/mm/yyyy.");
      return false;
    }

    if (address.trim().length < 20) {
      setError("Address must be at least 20 characters long.");
      return false;
    }

    if (!photo || !idProof) {
      setError("Please upload both Photo and Identity Proof.");
      return false;
    }

    return true;
  };

  const handleNext = () => {
    setError("");
    if (validateStep1()) {
      setStep(2);
    }
  };

  const createDID = (phone: string) => {
    // Example: create a simple DID using phone number and random string
    // In a real app, you might want to use a proper DID method
    return `did:example:${phone}-${Math.random().toString(36).substring(2, 10)}`;
  };

  const handleSendOtp = async () => {
    setError("");
    setInfo("");
    setOtpSent(false);
    setSendingOtp(true);

    if (!/^\d{10}$/.test(phone.trim())) {
      setError("Phone number must be exactly 10 digits.");
      setSendingOtp(false);
      return;
    }

    try {
      const appVerifier = recaptchaVerifierRef.current;
      const formattedPhone = "+91" + phone.trim();

      if (!appVerifier) throw new Error("reCAPTCHA not ready");

      const result = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      confirmationResultRef.current = result;
      setOtpSent(true);
      setInfo("OTP sent successfully. Please check your phone.");
    } catch (err: unknown) {
      const messages: { [key: string]: string } = {
        "auth/invalid-phone-number": "Invalid phone number.",
        "auth/too-many-requests": "Too many attempts. Try later.",
        "auth/quota-exceeded": "SMS quota exceeded. Try later.",
      };
      if (typeof err === "object" && err !== null && "code" in err) {
        setError(messages[(err as { code: string }).code] || "Failed to send OTP.");
      } else {
        setError("Failed to send OTP.");
      }
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    setVerifyingOtp(true);
    setError("");
    setInfo("");

    try {
      const confirmationResult = confirmationResultRef.current;
      if (!confirmationResult) throw new Error("No OTP request found");

      await confirmationResult.confirm(otp);

      // Create and store DID (not shown to user)
      const did = createDID(phone);
      localStorage.setItem("did", did);
      
      // Redirect to home after successful verification
      router.push("/dashboard");
      
    } catch {
      setError("Invalid OTP or verification failed.");
    } finally {
      setVerifyingOtp(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white shadow-lg rounded-xl p-6 w-full max-w-lg">
        <h1 className="text-2xl font-bold text-center mb-4 text-blue-600">
          Register
        </h1>
        <div id="recaptcha-container" />

        {step === 1 ? (
          <>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Full Name"
              className="w-full p-2 mb-3 border rounded-md"
            />
            <input
              type="text"
              value={voterId}
              onChange={(e) => setVoterId(e.target.value.toUpperCase())}
              placeholder="Voter ID (e.g., ABC1234567)"
              className="w-full p-2 mb-3 border rounded-md"
            />
            <input
              type="text"
              value={fatherName}
              onChange={(e) => setFatherName(e.target.value)}
              placeholder="Father's Name"
              className="w-full p-2 mb-3 border rounded-md"
            />
            <input
              type="text"
              value={motherName}
              onChange={(e) => setMotherName(e.target.value)}
              placeholder="Mother's Name"
              className="w-full p-2 mb-3 border rounded-md"
            />
            <input
              type="text"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              placeholder="Date of Birth (dd/mm/yyyy)"
              className="w-full p-2 mb-3 border rounded-md"
            />
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full p-2 mb-3 border rounded-md"
            >
              <option value="">Select Gender</option>
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
            </select>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Residential Address (as per ID)"
              className="w-full p-2 mb-3 border rounded-md"
            />

            <label className="block mb-3">
              <span className="text-sm text-gray-600">Photograph</span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setPhoto(e.target.files?.[0] || null)}
                className="w-full p-2 mt-1 border rounded-md cursor-pointer hover:border-blue-500"
              />
            </label>
            <label className="block mb-3">
              <span className="text-sm text-gray-600">
                Identity Proof (Aadhaar/Voter ID)
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setIdProof(e.target.files?.[0] || null)}
                className="w-full p-2 mt-1 border rounded-md cursor-pointer hover:border-blue-500"
              />
            </label>

            {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

            <button
              onClick={handleNext}
              className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
            >
              Next: Phone Verification
            </button>
          </>
        ) : (
          <>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
              placeholder="Enter 10-digit Phone Number"
              maxLength={10}
              className="w-full p-2 mb-3 border rounded-md"
            />

            <button
              onClick={handleSendOtp}
              className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 transition mb-3"
              disabled={sendingOtp}
            >
              {sendingOtp ? "Sending OTP..." : "Send OTP"}
            </button>

            {otpSent && (
              <>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder="Enter OTP"
                  maxLength={6}
                  className="w-full p-2 mb-3 border rounded-md"
                />

                <button
                  onClick={handleVerifyOtp}
                  className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
                  disabled={verifyingOtp}
                >
                  {verifyingOtp ? "Verifying..." : "Verify OTP"}
                </button>
              </>
            )}

            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            {info && <p className="text-green-600 text-sm mt-2">{info}</p>}

            <button
              onClick={() => setStep(1)}
              className="w-full mt-2 text-blue-600 hover:underline text-sm"
            >
              ← Back to Info Form
            </button>
          </>
        )}
      </div>
    </main>
  );
}
