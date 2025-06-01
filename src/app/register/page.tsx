"use client";

import { auth, db } from "@/lib/firebase";
import {
  ConfirmationResult,
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from "firebase/auth";
import { collection, doc, getDocs, setDoc, Timestamp } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
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

  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [campaignsLoading, setCampaignsLoading] = useState(false);
  const [showCampaigns, setShowCampaigns] = useState(true); // Show campaigns first
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);

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

  // Fetch campaigns on mount
  useEffect(() => {
    const fetchCampaigns = async () => {
      setCampaignsLoading(true);
      try {
        const snapshot = await getDocs(collection(db, 'campaigns'));
        const now = new Date()
        ;
        const list: any[] = [];
        snapshot.forEach(docSnap => {
          const data = docSnap.data();
          const start = data.start_date?.toDate?.() || new Date(data.start_date);
          const end = data.end_date?.toDate?.() || new Date(data.end_date);
          // Only push available campaigns (ongoing or scheduled)
          if ((start <= now && end >= now) || start > now) {
            list.push({
              id: docSnap.id,
              title: data.title,
              description: data.description,
              start,
              end,
            });
          }
        });
        setCampaigns(list);
      } catch (e) {
        setError('Failed to load campaigns.');
      } finally {
        setCampaignsLoading(false);
      }
    };
    fetchCampaigns();
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
      localStorage.setItem("campaign_id", selectedCampaign?.id || "");

      // Add to registered voters collection
      if (selectedCampaign?.id) {
        // Use fullName as the document ID (replace spaces with hyphens, lowercase, remove special chars)
        const voterId = fullName
          .trim()
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '');

        // Upload photo and id proof to storage and get URLs
        let photoUrl = '';
        let idProofUrl = '';
        // Import storage only once
        const { getStorage } = await import('firebase/storage');
        const storage = getStorage();
        const safeName = fullName.trim().toLowerCase().replace(/\s+/g, '_');
        if (photo) {
          const photoRef = `registered_voters/${selectedCampaign.id}/photos/${safeName}.jpg`;
          const photoUrlRef = ref(storage, photoRef);
          await uploadBytes(photoUrlRef, photo);
          photoUrl = await getDownloadURL(photoUrlRef);
        }
        if (idProof) {
          const idProofRef = `registered_voters/${selectedCampaign.id}/id_proof/${safeName}.jpg`;
          const idProofUrlRef = ref(storage, idProofRef);
          await uploadBytes(idProofUrlRef, idProof);
          idProofUrl = await getDownloadURL(idProofUrlRef);
        }

        await setDoc(
          doc(db, 'campaigns', selectedCampaign.id, 'registered_voters', voterId),
          {
            full_name: fullName,
            voter_id: voterId,
            father_name: fatherName,
            mother_name: motherName,
            dob,
            gender,
            address,
            photo_url: photoUrl,
            id_proof_url: idProofUrl,
            phone,
            did,
            registered_at: Timestamp.now(),
            verified: false,
          }
        );
        //all voters list
        await setDoc(
          doc(db, 'voters', voterId),
          {
            full_name: fullName,
            voter_id: voterId,
            father_name: fatherName,
            mother_name: motherName,
            dob,
            gender,
            address,
            photo_url: photoUrl,
            id_proof_url: idProofUrl,
            phone,
            did,
            registered_at: Timestamp.now(),
            campaignId: selectedCampaign.id,
            verified: false,
          }
        );
      }

      alert(`Your DID: ${did}`);
      
      // Redirect to home after successful verification
      router.push("/dashboard");
      
    } catch {
      setError("Invalid OTP or verification failed.");
    } finally {
      setVerifyingOtp(false);
    }
  };

  // Helper to format date as dd-mm-yyyy
  function formatDate(date: Date) {
    if (!(date instanceof Date) || isNaN(date.getTime())) return '';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  return (
    <main className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white shadow-lg rounded-xl p-6 w-full max-w-lg">
        <h1 className="text-2xl font-bold text-center mb-4 text-blue-600">
          Register
        </h1>
        <div id="recaptcha-container" />

        {showCampaigns ? (
          <div className="mt-6">
            <h2 className="text-xl font-bold text-center mb-4 text-indigo-700">Select a Campaign to Register</h2>
            {campaignsLoading ? (
              <div className="text-center text-gray-500">Loading...</div>
            ) : campaigns.length === 0 ? (
              <div className="text-center text-gray-500">No campaigns found.</div>
            ) : (
              <ul className="space-y-3">
                {campaigns.map(campaign => (
                  <li
                    key={campaign.id}
                    className="cursor-pointer bg-gradient-to-r from-indigo-100 to-purple-100 rounded-lg px-3 py-2 shadow hover:scale-105 hover:shadow-lg transition-all border border-indigo-200"
                    onClick={() => {
                      setShowCampaigns(false);
                      setStep(1);
                      setSelectedCampaign(campaign);
                    }}
                  >
                    <div className="flex flex-col">
                      <span className="text-base font-semibold text-indigo-700">{campaign.title}</span>
                      <span className="text-xs text-gray-700">{formatDate(campaign.start)} to {formatDate(campaign.end)}</span>
                      <span className="text-xs text-gray-600 mt-1">{campaign.description}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {selectedCampaign && (
              <div className="text-green-700 text-sm mt-2 text-center">Selected: {selectedCampaign.title}</div> 
            )}
          </div>
        ) : step === 1 ? (
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
              onClick={() => {
                if (!selectedCampaign) {
                  setError('Please select a campaign to register.');
                  return;
                }
                setError("");
                if (validateStep1()) {
                  setStep(2);
                }
              }}
              className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition mt-4"
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
              onClick={() => {
                setShowCampaigns(true);
                setStep(1);
              }}
              className="w-full mt-2 text-blue-600 hover:underline text-sm"
            >
              ← Back to Campaign Selection
            </button>
          </>
        )
        }
      </div>
    </main>
  );
}