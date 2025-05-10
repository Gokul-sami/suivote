'use client';

import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const router = useRouter();

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

        <ul className="list-disc pl-5 text-gray-700 space-y-2">
          <li className="text-lg">Presidential Election 2025</li>
          <li className="text-lg">Local Municipality Vote</li>
        </ul>
      </div>
    </div>
  );
}
