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
    } catch (error: any) {
      alert('Failed to create voting section: ' + error.message);
    }
  };

  return (
    <div className="min-h-screen w-full bg-white flex flex-col">
      <div className="flex justify-end items-center w-full p-6">
        <button
          onClick={handleCreate}
          className="bg-green-600 text-white px-6 py-2 rounded-lg text-lg font-semibold hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition"
        >
          Create Voting
        </button>
      </div>
      <div className="flex flex-col flex-1 items-center justify-center w-full px-4 py-8">
        <h1 className="text-4xl font-bold mb-2 text-indigo-700">Create New Voting Section</h1>
        <p className="text-lg mb-8 text-gray-700">Set up a new voting section for upcoming elections.</p>
        <div className="w-full max-w-2xl space-y-6">
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
          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border border-gray-300 p-3 rounded-lg w-full md:w-1/2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border border-gray-300 p-3 rounded-lg w-full md:w-1/2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <input
            type="number"
            min={2}
            value={numCandidates}
            onChange={(e) => setNumCandidates(Number(e.target.value))}
            className="border border-gray-300 p-3 rounded-lg w-full text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Number of Candidates"
          />
        </div>
      </div>
    </div>
  );
}
