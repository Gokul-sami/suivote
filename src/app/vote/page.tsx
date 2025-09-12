"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc, collection, getDocs, updateDoc, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Image from "next/image";

interface Candidate {
  id: string;
  name: string;
  party?: string;
  party_symbol_url?: string;
  photo?: string;
}

interface CampaignInfo {
  id: string;
  title: string;
  description: string;
  start_date: Date;
  end_date: Date;
}

export default function VotingFlow() {
  const router = useRouter();
  const [inputDid, setInputDid] = useState("");
  const [did, setDid] = useState("");
  const [campaignInfo, setCampaignInfo] = useState<CampaignInfo | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState("");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [verificationComplete, setVerificationComplete] = useState(false);

  const checkCampaignStatus = (start: Date, end: Date) => {
    const now = new Date();
    return now >= start && now <= end;
  };

  const handleVerify = async () => {
    setIsLoading(true);
    setError("");
  
    try {
      const searchDid = inputDid.trim();
      if (!searchDid) {
        setError("Please enter your DID");
        return;
      }

      // Search for voter by DID
      const votersQuery = query(collection(db, "voters"), where("did", "==", searchDid));
      const querySnapshot = await getDocs(votersQuery);

      if (querySnapshot.empty) {
        setError("DID not found. Please register first.");
        return;
      }

      const voterDoc = querySnapshot.docs[0];
      const voterData = voterDoc.data();

      if (!voterData.verified) {
        setError("Account not verified. Contact administrator.");
        return;
      }

      if (!voterData.campaignId) {
        setError("No campaign assigned to your account.");
        return;
      }

      // Load campaign details
      const campaignRef = doc(db, "campaigns", voterData.campaignId);
      const campaignSnap = await getDoc(campaignRef);

      if (!campaignSnap.exists()) {
        setError("Campaign not found");
        return;
      }

      const campaignData = campaignSnap.data();
      const startDate = campaignData.start_date.toDate();
      const endDate = campaignData.end_date.toDate();

      if (!checkCampaignStatus(startDate, endDate)) {
        setError("Voting is not currently active for this campaign");
        return;
      }

      setCampaignInfo({
        id: campaignData.id,
        title: campaignData.title || "Untitled Campaign",
        description: campaignData.description || "",
        start_date: startDate,
        end_date: endDate
      });

      // Check if already voted
      if (voterData.voted) {
        setHasVoted(true);
        setSelectedCandidate(voterData.candidate || "");
      }

      // Load candidates from subcollection
      const candidatesCol = collection(db, "campaigns", voterData.campaignId, "candidates");
      const candidatesSnapshot = await getDocs(candidatesCol);
      const candidatesData = candidatesSnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().full_name || "Unknown Candidate",
        party: doc.data().party_name || "",
        party_symbol_url: doc.data().party_symbol_url || "",
        photo: doc.data().profile_photo_url || "",
      }));

      setCandidates(candidatesData);
      setDid(searchDid);
      setVerificationComplete(true);

    } catch (err) {
      console.error("Error:", err);
      setError("Verification failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVote = async () => {
    if (!did || !campaignInfo || !selectedCandidate) return;

    setIsLoading(true);
    setError("");

    try {
      // Verify voter again
      const votersQuery = query(collection(db, "voters"), where("did", "==", did));
      const querySnapshot = await getDocs(votersQuery);

      if (querySnapshot.empty) {
        setError("Voter verification failed");
        return;
      }

      const voterDoc = querySnapshot.docs[0];
      const voterData = voterDoc.data();

      if (voterData.voted) {
        setError("You have already voted");
        return;
      }

      // Submit vote
      await updateDoc(voterDoc.ref, {
        voted: true,
        candidate: selectedCandidate,
        voted_at: new Date().toISOString()
      });

      setHasVoted(true);
    } catch (err) {
      console.error("Voting error:", err);
      setError("Failed to submit vote. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      {!verificationComplete ? (
        <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md text-center">
          <h1 className="text-2xl font-bold text-blue-600 mb-6">Verify Your Identity</h1>
          <div className="mb-6 text-left">
            <label htmlFor="did-input" className="block text-sm font-medium text-gray-700 mb-1">
              Enter your DID
            </label>
            <input
              id="did-input"
              type="text"
              value={inputDid}
              onChange={(e) => setInputDid(e.target.value)}
              placeholder="did:key:1x2y3z..."
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              onKeyDown={(e) => e.key === "Enter" && handleVerify()}
            />
          </div>
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md text-sm">
              {error}
            </div>
          )}
          <button
            onClick={handleVerify}
            disabled={isLoading || !inputDid.trim()}
            className={`w-full py-3 rounded-md transition flex items-center justify-center ${
              isLoading || !inputDid.trim()
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Verifying...
              </>
            ) : "Verify"}
          </button>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-xl shadow-md w-full max-w-2xl">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-blue-600">
              {campaignInfo?.title || "Voting"}
            </h1>
            <p className="text-gray-600">
              {campaignInfo?.description || "Cast your vote"}
            </p>
          </div>
          <div className="mb-6 bg-blue-50 p-4 rounded-md">
            <p className="font-medium">Voting as:</p>
            <p className="text-sm text-gray-700 break-all">{did}</p>
          </div>
          {hasVoted ? (
            <div className="text-center py-8">
              <div className="inline-block bg-green-100 text-green-700 p-4 rounded-full mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-bold mb-2">Thank You for Voting!</h2>
              <p className="mb-4">
                You voted for:{" "}
                <span className="font-semibold">
                  {candidates.find(c => c.id === selectedCandidate)?.name || selectedCandidate}
                </span>
              </p>
              <button
                onClick={() => router.push("/")}
                className="mt-4 bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700 transition"
              >
                Return Home
              </button>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-semibold mb-4">Select Your Candidate</h2>
              {candidates.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No candidates available for this campaign
                </div>
              ) : (
                <div className="flex flex-col gap-4 mb-6">
                  {candidates.map(candidate => (
                    <label
                      key={candidate.id}
                      className={`flex items-center justify-between border rounded-lg p-4 transition cursor-pointer ${
                        selectedCandidate === candidate.id
                          ? "border-blue-500 bg-blue-50"
                          : "hover:border-blue-300"
                      }`}
                    >
                      {/* Profile Photo on the left */}
                      <div className="flex items-center gap-4 flex-1">
                        {candidate.photo ? (
                          <div className="relative w-16 h-16 rounded-full overflow-hidden">
                            <Image
                              src={candidate.photo}
                              alt={candidate.name}
                              fill
                              className="object-cover"
                              sizes="64px"
                            />
                          </div>
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-2xl font-bold text-gray-500">
                            {candidate.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <h3 className="font-medium text-lg">{candidate.name}</h3>
                          {candidate.party && (
                            <p className="text-sm text-gray-500 mt-1">{candidate.party}</p>
                          )}
                        </div>
                      </div>
                      {/* Party Symbol on the right */}
                      <div className="flex flex-col items-center mr-4">
                        <span className="text-xs text-gray-400 mb-1">Party Symbol</span>
                        {candidate.party_symbol_url ? (
                          <div className="relative w-14 h-14 rounded-full overflow-hidden">
                            <Image
                              src={candidate.party_symbol_url}
                              alt={`${candidate.party} symbol`}
                              fill
                              className="object-contain"
                              sizes="50px"
                            />
                          </div>
                        ) : (
                          <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center text-gray-300">
                            <svg width="24" height="24" fill="none"><rect width="24" height="24" rx="12" fill="#e5e7eb"/></svg>
                          </div>
                        )}
                      </div>
                      {/* Custom Checkbox on the far right */}
                      <input
                        type="checkbox"
                        checked={selectedCandidate === candidate.id}
                        onChange={() => setSelectedCandidate(candidate.id)}
                        className="appearance-none w-6 h-6 border-2 border-blue-400 rounded-md checked:bg-blue-600 checked:border-blue-600 transition-all duration-150 focus:outline-none relative cursor-pointer"
                        style={{ boxShadow: selectedCandidate === candidate.id ? "0 0 0 2px #3b82f6" : undefined }}
                      />
                      {/* Removed the tick SVG */}
                    </label>
                  ))}
                </div>
              )}
              {candidates.length > 0 && (
                <button
                  onClick={handleVote}
                  disabled={!selectedCandidate || isLoading}
                  className={`w-full py-3 rounded-md transition ${
                    !selectedCandidate || isLoading
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  {isLoading ? "Submitting Vote..." : "Submit Vote"}
                </button>
              )}
            </>
          )}
        </div>
      )}
    </main>
  );
}
