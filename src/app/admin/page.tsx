// /admin/verify.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminZKPVerification() {
  const [zkp, setZkp] = useState('');
  const router = useRouter();

  const handleVerify = () => {
    if (zkp === 'admin') { // Dummy ZKP check for the sake of the demo
      router.push('/admin/dashboard');
    } else {
      alert('Invalid Admin ZKP');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen space-y-4">
      <h1 className="text-2xl font-bold">Admin ZKP Verification</h1>
      <input
        type="text"
        placeholder="Enter Admin ZKP"
        value={zkp}
        onChange={(e) => setZkp(e.target.value)}
        className="border p-2 rounded w-64"
      />
      <button
        onClick={handleVerify}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Verify
      </button>
    </div>
  );
}
