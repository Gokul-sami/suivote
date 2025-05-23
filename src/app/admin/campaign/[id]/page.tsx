'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function CampaignDetails() {
  const router = useRouter();
  const params = useParams();
  const { id } = params as { id: string };
  const [campaign, setCampaign] = useState<any>(null);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [candidateName, setCandidateName] = useState('');
  const [candidateDesc, setCandidateDesc] = useState('');
  const [candidateVoterId, setCandidateVoterId] = useState('');
  const [candidateFullName, setCandidateFullName] = useState('');
  const [candidateAge, setCandidateAge] = useState('');
  const [candidateGender, setCandidateGender] = useState('');
  const [candidateRegion, setCandidateRegion] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = JSON.parse(localStorage.getItem('campaigns') || '[]');
      const found = stored.find((c: any) => c.id === id);
      setCampaign(found);

      // Load candidates for this campaign
      const allCandidates = JSON.parse(localStorage.getItem('candidates') || '{}');
      setCandidates(allCandidates[id] || []);
    }
  }, [id]);

  // Helper to format date as dd-mm-yyyy
  function formatDate(dateStr: string) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  }

  // Add candidate handler
  function handleAddCandidate() {
    if (
      !candidateVoterId.trim() ||
      !candidateFullName.trim() ||
      !candidateAge.trim() ||
      !candidateGender.trim() ||
      !candidateRegion.trim()
    ) return;
    const newCandidate = {
      id: Date.now().toString(),
      name: candidateFullName, // Displayed as candidate name
      voterId: candidateVoterId,
      fullName: candidateFullName,
      age: candidateAge,
      gender: candidateGender,
      region: candidateRegion,
    };
    const allCandidates = JSON.parse(localStorage.getItem('candidates') || '{}');
    const updated = {
      ...allCandidates,
      [id]: [...(allCandidates[id] || []), newCandidate],
    };
    localStorage.setItem('candidates', JSON.stringify(updated));
    setCandidates(updated[id]); // This will update the candidates list and display the new candidate
    setCandidateName('');
    setCandidateDesc('');
    setCandidateVoterId('');
    setCandidateFullName('');
    setCandidateAge('');
    setCandidateGender('');
    setCandidateRegion('');
    setShowModal(false);
  }

  if (!campaign) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
        <div className="text-2xl">Campaign not found.</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-12">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-10 space-y-6">
        <h1 className="text-3xl font-bold text-indigo-700">{campaign.title}</h1>
        <p className="text-gray-700">{campaign.description}</p>
        <div className="flex justify-between text-gray-600">
          <span>
            <span className="font-semibold">Start:</span> {formatDate(campaign.startDate)}
          </span>
          <span>
            <span className="font-semibold">End:</span> {formatDate(campaign.endDate)}
          </span>
        </div>
        <div className="text-gray-700">
          <span className="font-semibold">Number of Candidates:</span> {campaign.numCandidates}
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="w-full bg-gradient-to-r from-green-500 to-green-700 text-white py-3 rounded-lg text-lg font-semibold hover:from-green-600 hover:to-green-800 transition-all shadow-lg"
        >
          Add Candidates
        </button>
        {/* Candidates List */}
        <div>
          <h2 className="text-xl font-semibold text-indigo-700 mt-6 mb-2">Candidates</h2>
          {candidates.length === 0 ? (
            <div className="text-gray-400">No candidates added yet.</div>
          ) : (
            <ul className="space-y-2">
              {candidates.map((cand) => (
                <li key={cand.id} className="bg-indigo-50 rounded p-3 text-gray-800 shadow">
                  <div className="font-semibold">{cand.name}</div>
                  <div className="text-sm text-gray-700">
                    <div><span className="font-semibold">Voter ID:</span> {cand.voterId}</div>
                    <div><span className="font-semibold">Age:</span> {cand.age}</div>
                    <div><span className="font-semibold">Gender:</span> {cand.gender}</div>
                    <div><span className="font-semibold">Region:</span> {cand.region}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <button
          onClick={() => {
            localStorage.removeItem('campaigns');
            localStorage.removeItem('candidates');
            window.location.reload();
          }}
          className="mt-4 px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
        >
          Clear Campaign & Candidate Data
        </button>
      </div>
      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-r from-indigo-500 to-purple-600 bg-opacity-95">
          <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md space-y-4">
            <h2 className="text-2xl font-bold text-indigo-700 mb-2">Add Candidate</h2>
            <input
              type="text"
              placeholder="Voter ID"
              value={candidateVoterId}
              onChange={e => setCandidateVoterId(e.target.value)}
              className="border border-gray-300 p-3 rounded w-full text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <input
              type="text"
              placeholder="Full Name"
              value={candidateFullName}
              onChange={e => setCandidateFullName(e.target.value)}
              className="border border-gray-300 p-3 rounded w-full text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <input
              type="number"
              placeholder="Age"
              value={candidateAge}
              onChange={e => setCandidateAge(e.target.value)}
              className="border border-gray-300 p-3 rounded w-full text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <input
              type="text"
              placeholder="Gender"
              value={candidateGender}
              onChange={e => setCandidateGender(e.target.value)}
              className="border border-gray-300 p-3 rounded w-full text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <input
              type="text"
              placeholder="Region"
              value={candidateRegion}
              onChange={e => setCandidateRegion(e.target.value)}
              className="border border-gray-300 p-3 rounded w-full text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCandidate}
                className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
