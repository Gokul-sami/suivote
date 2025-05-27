"use client";

import { db } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, setDoc } from 'firebase/firestore';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

// Custom Modal component (no external dependency)
function SimpleModal({ isOpen, onClose, children }: { isOpen: boolean, onClose: () => void, children: React.ReactNode }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full text-gray-800 relative">
        <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-700" onClick={onClose}>&times;</button>
        {children}
      </div>
    </div>
  );
}

interface _Candidate {
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
  created_at: unknown | null;
}

interface Campaign {
  id: string;
  title: string;
  description: string;
  start: Date;
  end: Date;
  num_candidates?: number;
}

export default function CampaignDetails() {
  const router = useRouter();
  const params = useParams();
  const { id } = params as { id: string };

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [candidates, setCandidates] = useState<_Candidate[]>([]);
  const [registeredCandidates, setRegisteredCandidates] = useState<_Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalCandidate, setModalCandidate] = useState<_Candidate | null>(null);
  const [verifiedCandidates, setVerifiedCandidates] = useState<_Candidate[]>([]);

  useEffect(() => {
    async function fetchCampaign() {
      setLoading(true);
      try {
        const docRef = doc(db, 'campaigns', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setCampaign({
            id: docSnap.id,
            title: data.title ?? '',
            description: data.description ?? '',
            start: data.start_date?.toDate?.() ?? new Date(data.start_date),
            end: data.end_date?.toDate?.() ?? new Date(data.end_date),
            num_candidates: data.num_candidates ?? 0,
          });
        } else {
          setCampaign(null);
        }
      } catch (error) {
        console.error("Error fetching campaign:", error);
      } finally {
        setLoading(false);
      }
    }

    async function fetchCandidates() {
      try {
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
      } catch (error) {
        console.error("Error fetching candidates:", error);
      }
    }

    async function fetchRegisteredCandidates() {
      try {
        const regCol = collection(db, 'campaigns', id, 'registered_candidates');
        const regSnap = await getDocs(regCol);
        const regList = regSnap.docs.map(doc => {
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
        setRegisteredCandidates(regList);
      } catch (error) {
        console.error('Error fetching registered candidates:', error);
      }
    }

    async function fetchVerifiedCandidates() {
      try {
        const verCol = collection(db, 'campaigns', id, 'verified_candidates');
        const verSnap = await getDocs(verCol);
        const verList = verSnap.docs.map(doc => {
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
        setVerifiedCandidates(verList);
      } catch (error) {
        console.error('Error fetching verified candidates:', error);
      }
    }

    fetchCampaign();
    fetchCandidates();
    fetchRegisteredCandidates();
    fetchVerifiedCandidates();
  }, [id]);

  async function handleVerifyCandidate(candidate: _Candidate) {
    try {
      
      await setDoc(
        doc(db, 'campaigns', id, 'verified_candidates', candidate.id),
        candidate
      );
      setVerifiedCandidates(prev => [...prev, candidate]);
      setModalOpen(false);
    } catch (error) {
      alert('Failed to verify candidate.');
    }
  }

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

        {/* Candidate List */}
        <div className="mt-8">
          <h2 className="text-xl font-bold text-indigo-700 mb-4 flex items-center justify-between">
            <span>Candidates</span>
            <span className="text-base font-semibold text-indigo-500">Total:{candidates.length}</span>
          </h2>
          {candidates.length === 0 ? (
            <div className="text-gray-500">No candidates yet.</div>
          ) : (
            <ul className="space-y-4">
              {candidates.map(candidate => (
                <li key={candidate.id} className="flex items-center space-x-4 bg-gray-100 rounded-lg p-4">
                  <Image
                    src={candidate.photo_url || '/placeholder-avatar.png'}
                    alt={candidate.full_name}
                    width={64}
                    height={64}
                    className="w-16 h-16 rounded-full object-cover border-2 border-indigo-400"
                  />
                  <span className="text-lg font-medium text-gray-800">{candidate.full_name}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        {/* Registered Candidates List */}
        <div className="mt-8">
          <h2 className="text-xl font-bold text-green-700 mb-4 flex items-center justify-between">
            <span>Registered Candidates</span>
            <span className="text-base font-semibold text-green-600">Total:{registeredCandidates.length}</span>
          </h2>
          {registeredCandidates.length === 0 ? (
            <div className="text-gray-500">No registered candidates yet.</div>
          ) : (
            <ul className="space-y-4">
              {registeredCandidates.map(candidate => {
                const isVerified = verifiedCandidates.some(vc => vc.id === candidate.id);
                return (
                  <li
                    key={candidate.id}
                    className={`flex items-center space-x-4 bg-green-50 rounded-lg p-4 ${isVerified ? 'opacity-60 cursor-default' : 'cursor-pointer'}`}
                    onClick={() => {
                      if (!isVerified) {
                        setModalCandidate(candidate);
                        setModalOpen(true);
                      }
                    }}
                  >
                    <Image
                      src={candidate.photo_url || '/placeholder-avatar.png'}
                      alt={candidate.full_name}
                      width={64}
                      height={64}
                      className="w-16 h-16 rounded-full object-cover border-2 border-green-400"
                    />
                    <span className="text-lg font-medium text-gray-800">{candidate.full_name}</span>
                    {isVerified && (
                      <span className="ml-4 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">Candidate is Verified</span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        {/* Verified Candidates List */}
        <div className="mt-8">
          <h2 className="text-xl font-bold text-blue-700 mb-4 flex items-center justify-between">
            <span>Verified Candidates</span>
            <span className="text-base font-semibold text-blue-600">Total:{verifiedCandidates.length}</span>
          </h2>
          {verifiedCandidates.length === 0 ? (
            <div className="text-gray-500">No verified candidates yet.</div>
          ) : (
            <ul className="space-y-4">
              {verifiedCandidates.map(candidate => (
                <li key={candidate.id} className="flex items-center space-x-4 bg-blue-50 rounded-lg p-4">
                  <Image
                    src={candidate.photo_url || '/placeholder-avatar.png'}
                    alt={candidate.full_name}
                    width={64}
                    height={64}
                    className="w-16 h-16 rounded-full object-cover border-2 border-blue-400"
                  />
                  <span className="text-lg font-medium text-gray-800">{candidate.full_name}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        {/* Candidate Modal */}
        <SimpleModal isOpen={modalOpen} onClose={() => setModalOpen(false)}>
          {modalCandidate && (
            <div className="flex flex-col items-center">
              <Image
                src={modalCandidate.photo_url || '/placeholder-avatar.png'}
                alt={modalCandidate.full_name}
                width={120}
                height={120}
                className="w-28 h-28 rounded-full object-cover border-2 border-indigo-400 mb-4"
              />
              <h3 className="text-2xl font-bold mb-2">{modalCandidate.full_name}</h3>
              <p className="mb-1"><b>Voter ID:</b> {modalCandidate.voter_id}</p>
              <p className="mb-1"><b>Father's Name:</b> {modalCandidate.father_name}</p>
              <p className="mb-1"><b>Mother's Name:</b> {modalCandidate.mother_name}</p>
              <p className="mb-1"><b>DOB:</b> {modalCandidate.dob}</p>
              <p className="mb-1"><b>Gender:</b> {modalCandidate.gender}</p>
              <p className="mb-1"><b>Address:</b> {modalCandidate.address}</p>
              <div className="flex gap-4 mt-4">
                <a href={modalCandidate.photo_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">View Photo</a>
                <a href={modalCandidate.id_proof_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">View ID Proof</a>
              </div>
              <button
                className="mt-6 w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
                onClick={() => handleVerifyCandidate(modalCandidate)}
              >
                Candidate is Verified
              </button>
            </div>
          )}
        </SimpleModal>
      </div>
    </div>
  );
}
