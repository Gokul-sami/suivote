'use client';

import { db } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import { useParams, useRouter } from 'next/navigation';
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
  created_at: any; // or Timestamp
}

// Campaign type
interface Campaign {
  id: string;
  title: string;
  description: string;
  start: Date;
  end: Date;
  num_candidates?: number;
  [key: string]: any;
}

export default function CampaignDetails() {
  const router = useRouter();
  const params = useParams();
  const { id } = params as { id: string };
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCampaign() {
      setLoading(true);
      const docRef = doc(db, 'campaigns', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setCampaign({
          id: docSnap.id,
          title: data.title,
          description: data.description,
          start: data.start_date?.toDate?.() ?? new Date(data.start_date),
          end: data.end_date?.toDate?.() ?? new Date(data.end_date),
          num_candidates: data.num_candidates,
          ...data,
        });
      } else {
        setCampaign(null);
      }
      setLoading(false);
    }

    async function fetchCandidates() {
      const candidatesCol = collection(db, 'campaigns', id, 'candidates');
      const candidatesSnap = await getDocs(candidatesCol);
      const candidatesList = candidatesSnap.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          full_name: data.full_name ?? '',
          voter_id: data.voter_id ?? '',
          father_name: data.father_name ?? '',
          mother_name: data.mother_name ?? '',
          dob: data.dob ?? '',
          gender: data.gender ?? '',
          address: data.address ?? '',
          photo_url: data.photo_url ?? '',
          id_proof_url: data.id_proof_url ?? '',
          created_at: data.created_at ?? null,
        };
      });
      setCandidates(candidatesList);
    }

    fetchCampaign();
    fetchCandidates();
  }, [id]);

  // Helper to format date as dd-mm-yyyy
  function formatDate(date: Date) {
    if (!(date instanceof Date) || isNaN(date.getTime())) return '';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
        <div className="text-2xl">Loading...</div>
      </div>
    );
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
            <span className="font-semibold">Start:</span> {formatDate(campaign.start)}
          </span>
          <span>
            <span className="font-semibold">End:</span> {formatDate(campaign.end)}
          </span>
        </div>
        <div className="text-gray-700">
          <span className="font-semibold">Number of Candidates:</span> {campaign.num_candidates}
        </div>
        <button
          className="w-full bg-green-600 text-white py-3 rounded-lg text-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 mt-4"
          onClick={() => router.push(`/admin/campaign/${id}/add-candidate`)}
        >
          Add Candidate
        </button>
        {/* Candidates List */}
        <div className="mt-8">
          <h2 className="text-xl font-bold text-indigo-700 mb-4">Candidates</h2>
          {candidates.length === 0 ? (
            <div className="text-gray-500">No candidates yet.</div>
          ) : (
            <ul className="space-y-4">
              {candidates.map(candidate => (
                <li key={candidate.id} className="flex items-center space-x-4 bg-gray-100 rounded-lg p-4">
                  <img
                    src={candidate.photo_url || '/placeholder-avatar.png'}
                    alt={candidate.full_name}
                    className="w-16 h-16 rounded-full object-cover border-2 border-indigo-400"
                  />
                  <span className="text-lg font-medium text-gray-800">{candidate.full_name}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
