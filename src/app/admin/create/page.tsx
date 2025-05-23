'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function CreateVotingSection() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [numCandidates, setNumCandidates] = useState(2);
  const router = useRouter();

  const handleCreate = () => {
    // Get existing campaigns
    const existing = typeof window !== 'undefined'
      ? JSON.parse(localStorage.getItem('campaigns') || '[]')
      : [];
    // Assign next numeric id
    const nextId = existing.length > 0
      ? (Math.max(...existing.map((c: any) => Number(c.id) || 0)) + 1).toString()
      : '1';

    // Collect all details
    const votingDetails = {
      id: nextId,
      title,
      description,
      startDate,
      endDate,
      numCandidates,
    };

    // Save to localStorage
    localStorage.setItem('campaigns', JSON.stringify([...existing, votingDetails]));

    // Redirect to the admin dashboard after creation
    router.push('/admin/dashboard');
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-12 space-y-8">
      <h1 className="text-4xl font-bold">Create New Voting Section</h1>
      <p className="text-lg">Set up a new voting section for upcoming elections.</p>

      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-8 space-y-6">
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Enter Voting Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="border border-gray-300 p-3 rounded-lg w-full text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <textarea
            placeholder="Enter Voting Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="border border-gray-300 p-3 rounded-lg w-full h-24 text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <input
            type="date"
            placeholder="Start Date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border border-gray-300 p-3 rounded-lg w-full text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <input
            type="date"
            placeholder="End Date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border border-gray-300 p-3 rounded-lg w-full text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <input
            type="number"
            min={2}
            placeholder="Number of Candidates"
            value={numCandidates}
            onChange={(e) => setNumCandidates(Number(e.target.value))}
            className="border border-gray-300 p-3 rounded-lg w-full text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <button
          onClick={handleCreate}
          className="w-full bg-green-600 text-white py-3 rounded-lg text-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          Create Voting
        </button>
      </div>
    </div>
  );
}