"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc, collection, getDocs, updateDoc, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Candidate {
  id: string;
  name: string;
  party?: string;
  description?: string;
}

interface CampaignInfo {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  active: boolean;
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

  // Verify DID and load campaign info
  const handleVerify = async () => {
    setIsLoading(true);
    setError("");
  
    try {
      const searchDid = inputDid.trim().toLowerCase();
      if (!searchDid) {
        setError("Please enter your DID");
        return;
      }

      // Search for voter by DID
      const votersRef = collection(db, "voters");
      const q = query(votersRef, where("did", "==", searchDid));
      const querySnapshot = await getDocs(q);

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

      // Store verification data
      localStorage.setItem("verifiedDid", searchDid);
      localStorage.setItem("campaignId", voterData.campaignId);
      setDid(searchDid);

      // Load campaign details
      const campaignRef = doc(db, "campaigns", voterData.campaignId);
      const campaignSnap = await getDoc(campaignRef);

      if (!campaignSnap.exists()) {
        setError("Campaign not found");
        return;
      }

      const campaignData = campaignSnap.data();
      const now = new Date();
      const startDate = campaignData.start_date?.toDate();
      const endDate = campaignData.end_date?.toDate();

      if (now < startDate) {
        setError(`Voting starts on ${startDate.toLocaleDateString()}`);
        return;
      }

      if (now > endDate) {
        setError("Voting has ended");
        return;
      }

      setCampaignInfo({
        id: campaignData.id,
        title: campaignData.title,
        description: campaignData.description,
        start_date: campaignData.start_date,
        end_date: campaignData.end_date,
        active: campaignData.active
      });

      // Check if already voted
      if (voterData.voted) {
        setHasVoted(true);
        setSelectedCandidate(voterData.candidate || "");
      }

      // Load candidates
      const candidatesSnapshot = await getDocs(
        collection(db, "campaigns", voterData.campaignId, "candidates")
      );
      const candidatesData = candidatesSnapshot.docs
        .map(doc => ({
          id: doc.id,
          name: doc.data().name,
          party: doc.data().party,
          description: doc.data().description
        }))
        .filter(c => c.name);

      setCandidates(candidatesData);
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
      const votersRef = collection(db, "voters");
      const q = query(votersRef, where("did", "==", did));
      const querySnapshot = await getDocs(q);

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

  // Render verification form or voting interface
  return (
    <main className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      {!verificationComplete ? (
        // Verification Form
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
        // Voting Interface
        <div className="bg-white p-6 rounded-xl shadow-md w-full max-w-2xl">
          <div className="mb-6 border-b pb-4">
            <h1 className="text-2xl font-bold text-blue-600">
              {campaignInfo?.title || "Voting"}
            </h1>
            <p className="text-gray-600">
              {campaignInfo?.description || "Cast your vote"}
            </p>
            {/* <div className="mt-2 text-sm text-gray-500">
              {campaignInfo && (
                <>
                  Voting period: {new Date(campaignInfo.start_date).toLocaleDateString()} - {new Date(campaignInfo.end_date).toLocaleDateString()}
                </>
              )}
            </div> */}
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
                  No candidates available
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {candidates.map(candidate => (
                    <div
                      key={candidate.id}
                      className={`p-4 border rounded-lg cursor-pointer transition ${
                        selectedCandidate === candidate.id
                          ? "border-blue-500 bg-blue-50"
                          : "hover:border-blue-300"
                      }`}
                      onClick={() => setSelectedCandidate(candidate.id)}
                    >
                      <div className="flex items-start">
                        <div className={`mr-4 w-10 h-10 rounded-full flex items-center justify-center ${
                          selectedCandidate === candidate.id 
                            ? "bg-blue-100 text-blue-600" 
                            : "bg-gray-100 text-gray-600"
                        }`}>
                          {candidate.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-medium">{candidate.name}</h3>
                          {candidate.party && (
                            <p className="text-sm text-gray-500">{candidate.party}</p>
                          )}
                          {candidate.description && (
                            <p className="text-sm text-gray-600 mt-1">{candidate.description}</p>
                          )}
                        </div>
                      </div>
                    </div>
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
