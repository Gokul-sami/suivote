'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function AdminDashboard() {
  const router = useRouter();
  // State to hold campaigns
  const [campaigns, setCampaigns] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch campaigns from localStorage
    const stored = typeof window !== 'undefined'
      ? JSON.parse(localStorage.getItem('campaigns') || '[]')
      : [];
    setCampaigns(stored);
    setLoading(false);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-12 space-y-8">
      <h1 className="text-4xl font-bold">Welcome, Admin</h1>
      <p className="text-lg">Manage voting sections below and monitor the progress of elections.</p>

      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-8">
        <h2 className="text-2xl font-semibold text-gray-900">Create a New Voting Section</h2>
        <p className="text-gray-600 mt-2 mb-6">Start a new voting section for upcoming elections.</p>
        
        <button
          onClick={() => router.push('/admin/create')}
          className="w-full bg-green-600 text-white py-3 rounded-md text-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          Create Voting Section
        </button>
      </div>

      {/* List of existing polls */}
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-8 mt-6">
        <h2 className="text-2xl font-semibold text-gray-900">Existing Polls</h2>
        <p className="text-gray-600 mt-2 mb-6">Current ongoing voting sections.</p>
        {loading ? (
          <div className="text-gray-500">Loading...</div>
        ) : campaigns.length === 0 ? (
          <div className="text-gray-500">No campaigns found.</div>
        ) : (
          <ul className="space-y-4">
            {campaigns.map((campaign: any) => (
              <li
                key={campaign.id}
                className="cursor-pointer bg-gradient-to-r from-indigo-100 to-purple-100 rounded-lg px-4 py-3 shadow hover:scale-105 hover:shadow-lg transition-all border border-indigo-200"
                onClick={() => router.push(`/admin/campaign/${campaign.id}`)}
              >
                <div className="flex flex-col">
                  <span className="text-xl font-semibold text-indigo-700">{campaign.title}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
