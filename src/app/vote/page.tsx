// app/vote/page.tsx
"use client";
import { useState } from "react";

export default function VotePage() {
  const [selectedCandidate, setSelectedCandidate] = useState("");
  const [hasVoted, setHasVoted] = useState(false);

  const candidates = [
    { id: "cand1", name: "Alice Johnson" },
    { id: "cand2", name: "Bob Smith" },
    { id: "cand3", name: "Charlie Lee" },
  ];

  const handleVote = () => {
    if (!selectedCandidate) return alert("Please select a candidate to vote.");

    const userZkp = localStorage.getItem("zkp");

    if (!userZkp) {
    alert("ZKP not found. Please verify your ZKP before voting.");
    return;
    }

    const votes = JSON.parse(localStorage.getItem("votes") || "{}");
    votes[userZkp] = selectedCandidate;
    localStorage.setItem("votes", JSON.stringify(votes));

    setHasVoted(true);
  };

  return (
    <main className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-lg text-center">
        <h1 className="text-2xl font-bold text-blue-600 mb-4">Cast Your Vote</h1>

        {hasVoted ? (
          <div className="text-green-600 text-lg font-semibold">
        Your vote has been recorded! Thank you for voting.
          </div>
        ) : (
          <>
            <p className="mb-4 text-gray-600">Choose your candidate:</p>
            <div className="flex flex-col gap-3 mb-6">
              {candidates.map((candidate) => (
                <label
                  key={candidate.id}
                  className={`p-3 border rounded-md cursor-pointer ${
                    selectedCandidate === candidate.id ? "border-blue-600 bg-blue-50" : ""
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
      </div>
    </main>
  );
}
