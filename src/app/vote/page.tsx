"use client";
import { useState, useEffect } from "react";

export default function VotePage() {
  const [selectedCandidate, setSelectedCandidate] = useState("");
  const [hasVoted, setHasVoted] = useState(false);
  const [voterDid, setVoterDid] = useState<string | null>(null);

  const candidates = [
    { id: "cand1", name: "Alice Johnson" },
    { id: "cand2", name: "Bob Smith" },
    { id: "cand3", name: "Charlie Lee" },
  ];

  useEffect(() => {
    // Check for DID when component mounts
    const did = localStorage.getItem("did");
    setVoterDid(did);
    
    // Check if this DID has already voted
    if (did) {
      const votes = JSON.parse(localStorage.getItem("votes") || "{}");
      if (votes[did]) {
        setHasVoted(true);
        setSelectedCandidate(votes[did]);
      }
    }
  }, []);

  const handleVote = () => {
    if (!selectedCandidate) {
      alert("Please select a candidate to vote.");
      return;
    }

    if (!voterDid) {
      alert("DID not found. Please register and verify your identity before voting.");
      return;
    }

    // Record the vote
    const votes = JSON.parse(localStorage.getItem("votes") || "{}");
    
    // Prevent double voting
    if (votes[voterDid]) {
      alert("You have already voted with this DID.");
      return;
    }

    votes[voterDid] = selectedCandidate;
    localStorage.setItem("votes", JSON.stringify(votes));

    setHasVoted(true);
  };

  return (
    <main className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-lg text-center">
        <h1 className="text-2xl font-bold text-blue-600 mb-4">Cast Your Vote</h1>

        {!voterDid ? (
          <div className="text-red-500 mb-4">
            Please register and verify your identity to vote.
          </div>
        ) : hasVoted ? (
          <div className="space-y-4">
            <div className="text-green-600 text-lg font-semibold">
              Your vote has been recorded! Thank you for voting.
            </div>
            <div className="text-gray-600">
              You voted for: {candidates.find(c => c.id === selectedCandidate)?.name}
            </div>
          </div>
        ) : (
          <>
            <p className="mb-4 text-gray-600">Choose your candidate:</p>
            <div className="flex flex-col gap-3 mb-6">
              {candidates.map((candidate) => (
                <label
                  key={candidate.id}
                  className={`p-3 border rounded-md cursor-pointer ${
                    selectedCandidate === candidate.id 
                      ? "border-blue-600 bg-blue-50" 
                      : "hover:border-blue-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="candidate"
                    value={candidate.id}
                    checked={selectedCandidate === candidate.id}
                    onChange={() => setSelectedCandidate(candidate.id)}
                    className="mr-2"
                  />
                  {candidate.name}
                </label>
              ))}
            </div>

            <button
              onClick={handleVote}
              className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
            >
              Submit Vote
            </button>
          </>
        )}

        {voterDid && (
          <div className="mt-6 p-3 bg-gray-50 rounded-md text-sm text-gray-600">
            <p>Voting as:</p>
            <p className="font-mono break-all">{voterDid}</p>
          </div>
        )}
      </div>
    </main>
  );
}
