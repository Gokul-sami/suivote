"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { auth, db, storage } from "@/lib/firebase";
import {
  signInWithPhoneNumber,
  RecaptchaVerifier,
  ConfirmationResult,
} from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, setDoc } from "firebase/firestore";
import { Ed25519Provider } from 'key-did-provider-ed25519'
import KeyResolver from 'key-did-resolver'
import { DID } from 'dids'

const saveVoterData = async (voterId: string, data: any) => {
  await setDoc(doc(db, "voters", voterId), data);
};

const uploadFile = async (file: File, path: string) => {
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return await getDownloadURL(storageRef);
};

// Country data with name, dial code, and code
const countries = [
  { name: "India", dialCode: "+91", code: "IN" },
  { name: "United States", dialCode: "+1", code: "US" },
  { name: "United Kingdom", dialCode: "+44", code: "GB" },
  { name: "Australia", dialCode: "+61", code: "AU" },
  { name: "Canada", dialCode: "+1", code: "CA" },
  { name: "Germany", dialCode: "+49", code: "DE" },
  { name: "France", dialCode: "+33", code: "FR" },
  { name: "Japan", dialCode: "+81", code: "JP" },
  { name: "China", dialCode: "+86", code: "CN" },
  { name: "Brazil", dialCode: "+55", code: "BR" },
];

// File validation constants
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB in bytes

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
  const [photoError, setPhotoError] = useState("");
  const [idProofError, setIdProofError] = useState("");

  // Step 2 state
  const [selectedCountry, setSelectedCountry] = useState(countries[0]);
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

  const validateFile = (file: File | null, setError: (msg: string) => void) => {
    if (!file) {
      setError("File is required");
      return false;
    }

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      setError("Only JPG, PNG, or PDF files are allowed");
      return false;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("File size must be less than 2MB");
      return false;
    }

    setError("");
    return true;
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (validateFile(file, setPhotoError)) {
      setPhoto(file);
    } else {
      setPhoto(null);
    }
  };

  const handleIdProofChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (validateFile(file, setIdProofError)) {
      setIdProof(file);
    } else {
      setIdProof(null);
    }
  };

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

    if (!validateFile(photo, setPhotoError) || !validateFile(idProof, setIdProofError)) {
      setError("Please upload valid Photo and Identity Proof files.");
      return false;
    }

    return true;
  };

  const handleNext = () => {
    setError("");
    setPhotoError("");
    setIdProofError("");
    if (validateStep1()) {
      setStep(2);
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

  const handleSendOtp = async () => {
    setError("");
    setInfo("");
    setOtpSent(false);
    setSendingOtp(true);

    if (phone.trim().length < 5) {
      setError("Please enter a valid phone number.");
      setSendingOtp(false);
      return;
    }

    try {
      const appVerifier = recaptchaVerifierRef.current;
      const formattedPhone = `${selectedCountry.dialCode}${phone.trim()}`;

      if (!appVerifier) throw new Error("reCAPTCHA not ready");

      const result = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      confirmationResultRef.current = result;
      setOtpSent(true);
      setInfo(`OTP sent successfully to ${formattedPhone}. Please check your phone.`);
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

      const userCredential = await confirmationResult.confirm(otp);
      const user = userCredential.user;

      const did = await createDID();
      if (did) {
        localStorage.setItem("did", did);
      } else {
        setError("Failed to create DID.");
        return;
      }

      const [photoUrl, idProofUrl] = await Promise.all([
        uploadFile(photo!, `voters/${voterId}/photo.jpg`),
        uploadFile(idProof!, `voters/${voterId}/idproof.jpg`)
      ]);

      await saveVoterData(voterId, {
        fullName,
        voterId,
        fatherName,
        motherName,
        dob,
        gender,
        address,
        phone: `${selectedCountry.dialCode}${phone}`,
        photoUrl,
        idProofUrl,
        did,
        uid: user.uid,
        createdAt: new Date().toISOString()
      });

      alert(`Your DID: ${did}`);
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
              required
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
              required
            />
            <input
              type="text"
              value={motherName}
              onChange={(e) => setMotherName(e.target.value)}
              placeholder="Mother's Name"
              className="w-full p-2 mb-3 border rounded-md"
              required
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
              <span className="text-sm text-gray-600">Photograph (JPG/PNG, max 2MB)</span>
              <input
                type="file"
                accept=".jpg,.jpeg,.png"
                onChange={handlePhotoChange}
                className="w-full p-2 mt-1 border rounded-md cursor-pointer hover:border-blue-500"
              />
              {photoError && <p className="text-red-500 text-sm mt-1">{photoError}</p>}
              {photo && (
                <p className="text-green-600 text-sm mt-1">
                  Selected: {photo.name} ({(photo.size / 1024).toFixed(2)} KB)
                </p>
              )}
            </label>
            <label className="block mb-3">
              <span className="text-sm text-gray-600">
                Identity Proof (Voter ID) (JPG/PNG/PDF, max 2MB)
              </span>
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={handleIdProofChange}
                className="w-full p-2 mt-1 border rounded-md cursor-pointer hover:border-blue-500"
              />
              {idProofError && <p className="text-red-500 text-sm mt-1">{idProofError}</p>}
              {idProof && (
                <p className="text-green-600 text-sm mt-1">
                  Selected: {idProof.name} ({(idProof.size / 1024).toFixed(2)} KB)
                </p>
              )}
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
            <div className="flex mb-3">
              <select
                value={selectedCountry.code}
                onChange={(e) => {
                  const country = countries.find(c => c.code === e.target.value) || countries[0];
                  setSelectedCountry(country);
                }}
                className="w-1/3 p-2 border rounded-md mr-2"
              >
                {countries.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.name} {country.dialCode}
                  </option>
                ))}
              </select>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                placeholder="Phone Number"
                className="flex-1 p-2 border rounded-md"
              />
            </div>

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

