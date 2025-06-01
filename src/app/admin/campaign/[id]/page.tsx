"use client";

import { db } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, setDoc } from 'firebase/firestore';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createVerifiableCredentialJwt } from 'did-jwt-vc';
import { EdDSASigner } from 'did-jwt';

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

interface _voter {
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
  num_voters?: number;
}

export default function CampaignDetails() {
  const router = useRouter();
  const params = useParams();
  const { id } = params as { id: string };

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [voters, setvoters] = useState<_voter[]>([]);
  const [registeredvoters, setRegisteredvoters] = useState<_voter[]>([]);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalvoter, setModalvoter] = useState<_voter | null>(null);
  const [verifiedvoters, setVerifiedvoters] = useState<_voter[]>([]);

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
            num_voters: data.num_voters ?? 0,
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

    async function fetchvoters() {
      try {
        const votersCol = collection(db, 'campaigns', id, 'voters');
        const votersSnap = await getDocs(votersCol);
        const votersList = votersSnap.docs.map(doc => {
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
        setvoters(votersList);
      } catch (error) {
        console.error("Error fetching voters:", error);
      }
    }

    async function fetchRegisteredvoters() {
      try {
        const regCol = collection(db, 'campaigns', id, 'registered_voters');
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
        setRegisteredvoters(regList);
      } catch (error) {
        console.error('Error fetching registered voters:', error);
      }
    }

    async function fetchVerifiedvoters() {
      try {
        const verCol = collection(db, 'campaigns', id, 'verified_voters');
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
        setVerifiedvoters(verList);
      } catch (error) {
        console.error('Error fetching verified voters:', error);
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
            ...data,
          };
        });
        setCandidates(candidatesList);
      } catch (error) {
        console.error('Error fetching candidates:', error);
      }
    }

    fetchCampaign();
    fetchvoters();
    fetchRegisteredvoters();
    fetchVerifiedvoters();
    fetchCandidates();
  }, [id]);

  async function handleVerifyvoter(voter: _voter) {
    try {
      
      await setDoc(
        doc(db, 'campaigns', id, 'verified_voters', voter.id),
        voter
      );
      setVerifiedvoters(prev => [...prev, voter]);
      setModalOpen(false);
    } catch (error) {
      alert('Failed to verify voter.');
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
      <div className="flex items-center justify-center h-screen bg-white text-indigo-700">
        <div className="text-2xl">Loading...</div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="flex items-center justify-center h-screen bg-white text-indigo-700">
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
          <span className="font-semibold">Number of Voters:</span> {campaign.num_voters}
        </div>
        <button
          className="w-full bg-green-600 text-white py-3 rounded-lg text-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 mt-4"
          onClick={() => router.push(`/admin/campaign/${id}/add-voter`)}
        >
          Add Voter
        </button>

        {/* voter List */}
        <div className="mt-8">
          <h2 className="text-xl font-bold text-indigo-700 mb-4 flex items-center justify-between">
            <span>Total Voters</span>
            <span className="text-base font-semibold text-indigo-500">Total:{voters.length}</span>
          </h2>
          {voters.length === 0 ? (
            <div className="text-gray-500">No voters yet.</div>
          ) : (
            <ul className="space-y-4">
              {voters.map(voter => (
                <li key={voter.id} className="flex items-center space-x-4 bg-gray-100 rounded-lg p-4">
                  <Image
                    src={voter.photo_url || '/placeholder-avatar.png'}
                    alt={voter.full_name}
                    width={64}
                    height={64}
                    className="w-16 h-16 rounded-full object-cover border-2 border-indigo-400"
                  />
                  <span className="text-lg font-medium text-gray-800">{voter.full_name}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        {/* Registered voters List */}
        <div className="mt-8">
          <h2 className="text-xl font-bold text-green-700 mb-4 flex items-center justify-between">
            <span>Registered Voters</span>
            <span className="text-base font-semibold text-green-600">Total:{registeredvoters.length}</span>
          </h2>
          {registeredvoters.length === 0 ? (
            <div className="text-gray-500">No registered voters yet.</div>
          ) : (
            <ul className="space-y-4">
              {registeredvoters.map(voter => {
                const isVerified = verifiedvoters.some(vc => vc.id === voter.id);
                return (
                  <li
                    key={voter.id}
                    className={`flex items-center space-x-4 bg-green-50 rounded-lg p-4 ${isVerified ? 'opacity-60 cursor-default' : 'cursor-pointer'}`}
                    onClick={() => {
                      if (!isVerified) {
                        setModalvoter(voter);
                        setModalOpen(true);
                      }
                    }}
                  >
                    <Image
                      src={voter.photo_url || '/placeholder-avatar.png'}
                      alt={voter.full_name}
                      width={64}
                      height={64}
                      className="w-16 h-16 rounded-full object-cover border-2 border-green-400"
                    />
                    <span className="text-lg font-medium text-gray-800">{voter.full_name}</span>
                    {isVerified && (
                      <span className="ml-4 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">Voter is Verified</span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        {/* Verified voters List */}
        <div className="mt-8">
          <h2 className="text-xl font-bold text-blue-700 mb-4 flex items-center justify-between">
            <span>Verified Voters</span>
            <span className="text-base font-semibold text-blue-600">Total:{verifiedvoters.length}</span>
          </h2>
          {verifiedvoters.length === 0 ? (
            <div className="text-gray-500">No verified voters yet.</div>
          ) : (
            <ul className="space-y-4">
              {verifiedvoters.map(voter => (
                <li key={voter.id} className="flex items-center space-x-4 bg-blue-50 rounded-lg p-4">
                  <Image
                    src={voter.photo_url || '/placeholder-avatar.png'}
                    alt={voter.full_name}
                    width={64}
                    height={64}
                    className="w-16 h-16 rounded-full object-cover border-2 border-blue-400"
                  />
                  <span className="text-lg font-medium text-gray-800">{voter.full_name}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        {/* voter Modal */}
        <SimpleModal isOpen={modalOpen} onClose={() => setModalOpen(false)}>
          {modalvoter && (
            <div className="flex flex-col items-center">
              <Image
                src={modalvoter.photo_url || '/placeholder-avatar.png'}
                alt={modalvoter.full_name}
                width={120}
                height={120}
                className="w-28 h-28 rounded-full object-cover border-2 border-indigo-400 mb-4"
              />
              <h3 className="text-2xl font-bold mb-2">{modalvoter.full_name}</h3>
              <p className="mb-1"><b>Voter ID:</b> {modalvoter.voter_id}</p>
              <p className="mb-1"><b>Father's Name:</b> {modalvoter.father_name}</p>
              <p className="mb-1"><b>Mother's Name:</b> {modalvoter.mother_name}</p>
              <p className="mb-1"><b>DOB:</b> {modalvoter.dob}</p>
              <p className="mb-1"><b>Gender:</b> {modalvoter.gender}</p>
              <p className="mb-1"><b>Address:</b> {modalvoter.address}</p>
              <div className="flex gap-4 mt-4">
                <a href={modalvoter.photo_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">View Photo</a>
                <a href={modalvoter.id_proof_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">View ID Proof</a>
              </div>
              <button
                className="mt-6 w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
                onClick={() => handleVerifyvoter(modalvoter)}
              >
                Voter is Verified
              </button>
            </div>
          )}
        </SimpleModal>
      </div>
    </div>
  );
}
