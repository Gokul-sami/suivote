'use client';

import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

// Candidate type
interface Candidate {
  id: string;
  full_name: string;
  voter_id: string;
  father_name: string;
  mother_name: string;
  dob: string;
  gender: string;
  address: string;
  photo_url: string;
  id_proof_url: string;
  created_at: unknown; // or Timestamp
}

// Campaign type
interface Campaign {
  id: string;
  title: string;
  description: string;
  start: Date;
  end: Date;
  num_candidates?: number;
  [key: string]: unknown;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [ongoing, setOngoing] = useState<Campaign[]>([]);
  const [scheduled, setScheduled] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCampaigns() {
      setLoading(true);
      const snapshot = await getDocs(collection(db, 'campaigns'));
      const now = new Date();
      const ongoingList: Campaign[] = [];
      const scheduledList: Campaign[] = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        const start = data.start_date?.toDate?.() || new Date(data.start_date);
        const end = data.end_date?.toDate?.() || new Date(data.end_date);
        const campaign = {
          id: docSnap.id,
          title: data.title,
          description: data.description,
          start,
          end,
        };
        if (start <= now && end >= now) {
          ongoingList.push(campaign);
        } else if (start > now) {
          scheduledList.push(campaign);
        }
      });
      setOngoing(ongoingList);
      setScheduled(scheduledList);
      setLoading(false);
    }
    fetchCampaigns();
  }, []);

  // Helper to format date as dd-mm-yyyy
  function formatDate(date: Date) {
    if (!(date instanceof Date) || isNaN(date.getTime())) return '';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-r from-indigo-500 to-purple-600 flex flex-col items-center justify-center px-6 py-12 space-y-8">
      <h2 className="text-4xl font-bold text-white">Welcome, Admin</h2>
      <p className="text-lg text-white">Manage voting sections below and monitor the progress of elections.</p>

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

      {/* Ongoing Campaigns */}
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-8 mt-6">
        <h2 className="text-2xl font-semibold text-indigo-700">Ongoing Campaigns</h2>
        <p className="text-gray-600 mt-2 mb-6">Currently active voting sections.</p>
        {loading ? (
          <div className="text-gray-500">Loading...</div>
        ) : ongoing.length === 0 ? (
          <div className="text-gray-500">No ongoing campaigns.</div>
        ) : (
          <ul className="space-y-4">
            {ongoing.map((campaign) => (
              <li
                key={campaign.id}
                className="cursor-pointer bg-gradient-to-r from-indigo-100 to-purple-100 rounded-lg px-4 py-3 shadow hover:scale-105 hover:shadow-lg transition-all border border-indigo-200"
                onClick={() => router.push(`/admin/campaign/${campaign.id}`)}
              >
                <div className="flex flex-col">
                  <span className="text-xl font-semibold text-indigo-700">{campaign.title}</span>
                  <span className="text-sm text-gray-700">
                    {formatDate(campaign.start)} to {formatDate(campaign.end)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Scheduled Campaigns */}
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-8 mt-6">
        <h2 className="text-2xl font-semibold text-indigo-700">Scheduled Campaigns</h2>
        <p className="text-gray-600 mt-2 mb-6">Upcoming voting sections.</p>
        {loading ? (
          <div className="text-gray-500">Loading...</div>
        ) : scheduled.length === 0 ? (
          <div className="text-gray-500">No scheduled campaigns.</div>
        ) : (
          <ul className="space-y-4">
            {scheduled.map((campaign) => (
              <li
                key={campaign.id}
                className="cursor-pointer bg-gradient-to-r from-indigo-100 to-purple-100 rounded-lg px-4 py-3 shadow hover:scale-105 hover:shadow-lg transition-all border border-indigo-200"
                onClick={() => router.push(`/admin/campaign/${campaign.id}`)}
              >
                <div className="flex flex-col">
                  <span className="text-xl font-semibold text-indigo-700">{campaign.title}</span>
                  <span className="text-sm text-gray-700">
                    {formatDate(campaign.start)} to {formatDate(campaign.end)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
