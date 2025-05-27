'use client';

import { db } from '@/lib/firebase';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function CreateVotingSection() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [numCandidates, setNumCandidates] = useState(2);
  const router = useRouter();

  const handleCreate = async () => {
    try {
      // Ensure dates are selected
      if (!startDate || !endDate) {
        alert('Please select both start and end dates.');
        return;
      }

      const start = new Date(startDate);
      const end = new Date(endDate);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        alert('Invalid date format.');
        return;
      }

      // Create a slug from the title to use as the document ID
      const campaignId = title
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '-')      // Replace spaces with hyphens
        .replace(/[^a-z0-9-]/g, ''); // Remove special characters

      const votingDetails = {
        title,
        description,
        start_date: Timestamp.fromDate(start),
        end_date: Timestamp.fromDate(end),
        num_candidates: numCandidates,
        created_at: Timestamp.now(),
      };

      // Save document with custom ID
      await setDoc(doc(db, 'campaigns', campaignId), votingDetails);
      router.push('/admin/dashboard');
    } catch (error: unknown) {
      if (error instanceof Error) {
        alert('Failed to create voting section: ' + error.message);
      } else {
        alert('Failed to create voting section: An unknown error occurred.');
      }
    }
  };
  
  return (
    <div className="min-h-screen w-full bg-gradient-to-r from-indigo-500 to-purple-600 flex flex-col items-center justify-center px-6 py-12 space-y-8">
      <div className="flex flex-col flex-1 items-center justify-center w-full px-4 py-8">
        <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl p-10 space-y-6 border border-gray-200">
          <h1 className="text-4xl font-bold mb-2 text-indigo-700 text-center">Create New Voting Section</h1>
          <p className="text-lg mb-8 text-gray-700 text-center">Set up a new voting section for upcoming elections.</p>
          {/* Voting Title */}
          <div>
            <label className="block mb-1 text-gray-700 font-bold" htmlFor="voting-title">
              Voting Title
            </label>
            <input
              id="voting-title"
              type="text"
              placeholder="Enter Voting Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="border border-gray-300 p-3 rounded-lg w-full text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 shadow-sm"
            />
          </div>
          {/* Voting Description */}
          <div>
            <label className="block mb-1 text-gray-700 font-bold" htmlFor="voting-description">
              Voting Description
            </label>
            <textarea
              id="voting-description"
              placeholder="Enter Voting Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="border border-gray-300 p-3 rounded-lg w-full h-24 text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 shadow-sm"
            />
          </div>
          {/* Dates */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="w-full md:w-1/2">
              <label className="block mb-1 text-gray-700 font-bold" htmlFor="start-date">
                Start Date
              </label>
              <input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border border-gray-300 p-3 rounded-lg w-full text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 shadow-sm"
              />
            </div>
            <div className="w-full md:w-1/2">
              <label className="block mb-1 text-gray-700 font-bold" htmlFor="end-date">
                End Date
              </label>
              <input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border border-gray-300 p-3 rounded-lg w-full text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 shadow-sm"
              />
            </div>
          </div>
          {/* Number of Candidates */}
          <div>
            <label className="block mb-1 text-gray-700 font-bold" htmlFor="num-candidates">
              Number of Candidates
            </label>
            <input
              id="num-candidates"
              type="number"
              min={2}
              value={numCandidates}
              onChange={(e) => setNumCandidates(Number(e.target.value))}
              className="border border-gray-300 p-3 rounded-lg w-full text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 shadow-sm"
              placeholder="Number of Candidates"
            />
          </div>
          {/* Centered Button */}
          <div className="flex justify-center pt-4">
            <button
              onClick={handleCreate}
              className="bg-gradient-to-r from-green-500 to-green-700 text-white px-8 py-3 rounded-xl text-lg font-semibold shadow-lg hover:scale-105 hover:from-green-600 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200"
            >
              Create Voting
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
