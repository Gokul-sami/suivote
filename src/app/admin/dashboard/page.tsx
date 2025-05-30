'use client';

import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Campaign {
  id: string;
  title: string;
  description: string;
  start: Date;
  end: Date;
  num_voters?: number;
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
      snapshot.forEach((docSnap) => {
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

  function formatDate(date: Date) {
    if (!(date instanceof Date) || isNaN(date.getTime())) return '';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 px-0 py-0">
      {/* White top bar with app name centered */}
      <div className="w-full bg-white border-b border-indigo-200 sticky top-0 z-30 flex items-center h-16">
        <span className="font-extrabold text-2xl text-indigo-700 px-8 select-none">
          Suivote
        </span>
      </div>
      <div className="flex flex-row justify-center w-full">
        {/* Dashboard details always on the left */}
        <div className="hidden md:block min-w-[320px] max-w-xs w-full mr-8 mt-8">
          <div className="bg-gradient-to-br from-indigo-200 via-purple-100 to-pink-100 rounded-2xl shadow-xl p-8 border border-indigo-100">
            <h2 className="text-3xl font-extrabold text-indigo-700 mb-2">Welcome, Admin</h2>
            <p className="text-gray-700 mb-4">Manage voting sections below and monitor the progress of elections.</p>
            <button
              onClick={() => router.push('/admin/create')}
              className="mt-4 w-full bg-gradient-to-r from-green-400 to-green-600 text-white py-3 rounded-lg text-lg hover:from-green-500 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-green-400"
            >
              Create Voting Section
            </button>
          </div>
        </div>
        {/* Main content */}
        <div className="flex flex-col items-center w-full max-w-2xl">
          <div className="bg-white/90 rounded-2xl shadow-2xl w-full p-8 md:p-12 mt-8 space-y-12">
            {/* For mobile, show details here */}
            <div className="md:hidden mb-8">
              <h2 className="text-3xl font-extrabold text-indigo-700 mb-2">Welcome, Admin</h2>
              <p className="text-gray-700 mb-4">Manage voting sections below and monitor the progress of elections.</p>
              <button
                onClick={() => router.push('/admin/create')}
                className="mt-4 w-full bg-gradient-to-r from-green-400 to-green-600 text-white py-3 rounded-lg text-lg hover:from-green-500 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-green-400"
              >
                Create Voting Section
              </button>
            </div>
            {/* Ongoing Campaigns */}
            <div>
              <h2 className="text-2xl font-bold text-indigo-700 mb-2">Ongoing Campaigns</h2>
              <p className="text-gray-600 mb-4">Currently active voting sections.</p>
              {loading ? (
                <div className="text-gray-500">Loading...</div>
              ) : ongoing.length === 0 ? (
                <div className="text-gray-500">No ongoing campaigns.</div>
              ) : (
                <ul className="space-y-4">
                  {ongoing.map((campaign, idx) => (
                    <li
                      key={campaign.id}
                      className="cursor-pointer flex items-center bg-gradient-to-r from-indigo-200 via-purple-200 to-pink-200 rounded-lg px-4 py-3 shadow hover:scale-105 hover:shadow-lg transition-all border border-indigo-200"
                      onClick={() => router.push(`/admin/campaign/${campaign.id}`)}
                    >
                      <span className="font-bold text-indigo-500 mr-3">{idx + 1}.</span>
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
            <div>
              <h2 className="text-2xl font-bold text-purple-700 mb-2">Scheduled Campaigns</h2>
              <p className="text-gray-600 mb-4">Upcoming voting sections.</p>
              {loading ? (
                <div className="text-gray-500">Loading...</div>
              ) : scheduled.length === 0 ? (
                <div className="text-gray-500">No scheduled campaigns.</div>
              ) : (
                <ul className="space-y-4">
                  {scheduled.map((campaign, idx) => (
                    <li
                      key={campaign.id}
                      className="cursor-pointer flex items-center bg-gradient-to-r from-indigo-100 via-purple-100 to-pink-100 rounded-lg px-4 py-3 shadow hover:scale-105 hover:shadow-lg transition-all border border-indigo-200"
                      onClick={() => router.push(`/admin/campaign/${campaign.id}`)}
                    >
                      <span className="font-bold text-indigo-500 mr-3">{idx + 1}.</span>
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
        </div>
      </div>
    </div>
  );
}