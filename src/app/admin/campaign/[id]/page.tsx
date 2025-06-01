"use client";

import { db } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, setDoc } from 'firebase/firestore';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
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

  // Section refs for navigation
  const detailsRef = useRef<HTMLDivElement>(null);
  const votersRef = useRef<HTMLDivElement>(null);
  const registeredRef = useRef<HTMLDivElement>(null);
  const verifiedRef = useRef<HTMLDivElement>(null);

  const [activeSection, setActiveSection] = useState<'details' | 'voters' | 'registered' | 'verified' | 'candidates'>('details');

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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex flex-col items-center px-0 py-0">
      {/* Absolute top left app name */}
      <div className="fixed top-0 left-0 z-30 px-6 py-4">
        <span className="font-extrabold text-2xl text-indigo-700 select-none">Suivote</span>
      </div>
      {/* Full-width Top Navigation Bar */}
      <nav className="w-full border-b border-indigo-200 bg-white sticky top-0 z-20">
        <div className="max-w-2xl mx-auto flex items-center">
          {/* Tabs (no app name here, only navigation) */}
          <div className="flex flex-1 w-full">
            <button
              className={`flex-1 py-4 px-2 text-center font-semibold transition border-b-2
                ${activeSection === 'details'
                  ? 'text-indigo-700 border-indigo-700'
                  : 'text-gray-500 border-transparent hover:text-indigo-700'}`}
              onClick={() => setActiveSection('details')}
            >
              Campaign Details
            </button>
            <button
              className={`flex-1 py-4 px-2 text-center font-semibold transition border-b-2
                ${activeSection === 'voters'
                  ? 'text-indigo-700 border-indigo-700'
                  : 'text-gray-500 border-transparent hover:text-indigo-700'}`}
              onClick={() => setActiveSection('voters')}
            >
              Voters
            </button>
            <button
              className={`flex-1 py-4 px-2 text-center font-semibold transition border-b-2
                ${activeSection === 'registered'
                  ? 'text-green-700 border-green-700'
                  : 'text-gray-500 border-transparent hover:text-green-700'}`}
              onClick={() => setActiveSection('registered')}
            >
              Registered Voters
            </button>
            <button
              className={`flex-1 py-4 px-2 text-center font-semibold transition border-b-2
                ${activeSection === 'verified'
                  ? 'text-blue-700 border-blue-700'
                  : 'text-gray-500 border-transparent hover:text-blue-700'}`}
              onClick={() => setActiveSection('verified')}
            >
              Verified Voters
            </button>
            <button
              className={`flex-1 py-4 px-2 text-center font-semibold transition border-b-2
                ${activeSection === 'candidates'
                  ? 'text-purple-700 border-purple-700'
                  : 'text-gray-500 border-transparent hover:text-purple-700'}`}
              onClick={() => setActiveSection('candidates')}
            >
              Candidates
            </button>
          </div>
        </div>
      </nav>
      {/* Add space on top */}
      <div className="h-8" />
      <div className="flex flex-row justify-center w-full">
        {/* Main content */}
        <div className="flex flex-col items-center w-full max-w-2xl">
          <div className="w-full p-0 md:p-0 mt-8 space-y-12">
            {/* Only show the selected section */}
            {activeSection === 'details' && (
              <section ref={detailsRef} className="pb-8 border-b border-gray-200">
                <h1 className="text-4xl font-extrabold text-indigo-700 mb-2">{campaign.title}</h1>
                <p className="text-gray-700 mb-4">{campaign.description}</p>
                <div className="flex flex-col space-y-2 text-gray-600 mb-2">
                    <span>
                      <span className="font-semibold">Start:</span> {formatDate(campaign.start)}
                    </span>
                    <span>
                      <span className="font-semibold">End:</span> {formatDate(campaign.end)}
                    </span>
                    <span>
                      <span className="font-semibold">Number of Voters:</span> {campaign.num_voters}
                    </span>
                </div>
                <button
                  className="mt-4 w-full bg-green-600 text-white py-3 rounded-lg text-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                  onClick={() => router.push(`/admin/campaign/${id}/add-voter`)}
                >
                  Add Voter
                </button>
                <button
                  className="mt-2 w-full bg-indigo-600 text-white py-3 rounded-lg text-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  onClick={() => router.push(`/admin/campaign/${id}/add-candidate`)}
                >
                  Add Candidate
                </button>
              </section>
            )}
            {activeSection === 'voters' && (
              <section ref={votersRef} className="pb-8 border-b border-gray-200">
                <h2 className="text-3xl font-extrabold text-indigo-700 mb-6 flex items-center justify-between">
                  <span>Voters</span>
                  <span className="text-base font-semibold text-indigo-500">Total: {voters.length}</span>
                </h2>
                {voters.length === 0 ? (
                  <div className="text-gray-500">No voters yet.</div>
                ) : (
                  <table className="min-w-[700px] w-full text-base border border-gray-200 rounded-xl bg-white">
                    <thead>
                      <tr className="bg-gradient-to-r from-indigo-100 to-purple-100">
                        <th className="px-6 py-4 border-b text-left text-sm font-bold text-indigo-700">#</th>
                        <th className="px-6 py-4 border-b text-left text-sm font-bold text-indigo-700">Photo</th>
                        <th className="px-6 py-4 border-b text-left text-sm font-bold text-indigo-700">Name</th>
                      </tr>
                    </thead>
                    <tbody>
                      {voters.map((voter, idx) => (
                        <tr key={voter.id} className="hover:bg-indigo-50 transition">
                          <td className="px-6 py-4">{idx + 1}</td>
                          <td className="px-6 py-4">
                            <Image
                              src={voter.photo_url || '/placeholder-avatar.png'}
                              alt={voter.full_name}
                              width={56}
                              height={56}
                              className="w-14 h-14 rounded-lg object-cover border-2 border-indigo-400 shadow"
                            />
                          </td>
                          <td className="px-6 py-4">{voter.full_name}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </section>
            )}
            {activeSection === 'registered' && (
              <section ref={registeredRef} className="pb-8 border-b border-gray-200">
                <h2 className="text-3xl font-extrabold text-green-700 mb-6 flex items-center justify-between">
                  <span>Registered Voters</span>
                  <span className="text-base font-semibold text-green-600">Total: {registeredvoters.length}</span>
                </h2>
                {registeredvoters.length === 0 ? (
                  <div className="text-gray-500">No registered voters yet.</div>
                ) : (
                  <table className="min-w-[700px] w-full text-base border border-gray-200 rounded-xl bg-white">
                    <thead>
                      <tr className="bg-gradient-to-r from-green-100 to-blue-100">
                        <th className="px-6 py-4 border-b text-left text-sm font-bold text-green-700">#</th>
                        <th className="px-6 py-4 border-b text-left text-sm font-bold text-green-700">Photo</th>
                        <th className="px-6 py-4 border-b text-left text-sm font-bold text-green-700">Name</th>
                        <th className="px-6 py-4 border-b text-left text-sm font-bold text-green-700">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {registeredvoters.map((voter, idx) => {
                        const isVerified = verifiedvoters.some(vc => vc.id === voter.id);
                        return (
                          <tr
                            key={voter.id}
                            className={`hover:bg-green-50 transition ${isVerified ? 'opacity-60 cursor-default' : 'cursor-pointer'}`}
                            onClick={() => {
                              if (!isVerified) {
                                setModalvoter(voter);
                                setModalOpen(true);
                              }
                            }}
                          >
                            <td className="px-6 py-4">{idx + 1}</td>
                            <td className="px-6 py-4">
                              <Image
                                src={voter.photo_url || '/placeholder-avatar.png'}
                                alt={voter.full_name}
                                width={56}
                                height={56}
                                className="w-14 h-14 rounded-lg object-cover border-2 border-green-400 shadow"
                              />
                            </td>
                            <td className="px-6 py-4">{voter.full_name}</td>
                            <td className="px-6 py-4">
                              {isVerified ? (
                                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">Verified</span>
                              ) : (
                                <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold">Pending</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </section>
            )}
            {activeSection === 'verified' && (
              <section ref={verifiedRef}>
                <h2 className="text-3xl font-extrabold text-blue-700 mb-6 flex items-center justify-between">
                  <span>Verified Voters</span>
                  <span className="text-base font-semibold text-blue-600">Total: {verifiedvoters.length}</span>
                </h2>
                {verifiedvoters.length === 0 ? (
                  <div className="text-gray-500">No verified voters yet.</div>
                ) : (
                  <table className="min-w-[700px] w-full text-base border border-gray-200 rounded-xl bg-white">
                    <thead>
                      <tr className="bg-gradient-to-r from-blue-100 to-indigo-100">
                        <th className="px-6 py-4 border-b text-left text-sm font-bold text-blue-700">#</th>
                        <th className="px-6 py-4 border-b text-left text-sm font-bold text-blue-700">Photo</th>
                        <th className="px-6 py-4 border-b text-left text-sm font-bold text-blue-700">Name</th>
                      </tr>
                    </thead>
                    <tbody>
                      {verifiedvoters.map((voter, idx) => (
                        <tr key={voter.id} className="hover:bg-blue-50">
                          <td className="px-6 py-4">{idx + 1}</td>
                          <td className="px-6 py-4">
                            <Image
                              src={voter.photo_url || '/placeholder-avatar.png'}
                              alt={voter.full_name}
                              width={56}
                              height={56}
                              className="w-14 h-14 rounded-lg object-cover border-2 border-blue-400 shadow"
                            />
                          </td>
                          <td className="px-6 py-4">{voter.full_name}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </section>
            )}
            {activeSection === 'candidates' && (
              <section className="pb-8 border-b border-gray-200">
                <h2 className="text-3xl font-extrabold text-purple-700 mb-6 flex items-center justify-between">
                  <span>Candidates</span>
                  <span className="text-base font-semibold text-purple-600">Total: {candidates.length}</span>
                </h2>
                {candidates.length === 0 ? (
                  <div className="text-gray-500">No candidates yet.</div>
                ) : (
                  <div className="overflow-x-auto w-full">
                    <table className="min-w-[3200px] w-full text-base border border-gray-200 rounded-xl bg-white">
                      <thead>
                        <tr className="bg-gradient-to-r from-indigo-100 to-purple-100">
                          <th className="px-4 py-3 border-b text-left text-sm font-bold text-indigo-700">#</th>
                          <th className="px-4 py-3 border-b text-left textsm font-bold text-indigo-700">Photo</th>
                          <th className="px-4 py-3 border-b text-left textsm font-bold text-indigo-700">Full Name</th>
                          <th className="px-4 py-3 border-b text-left textsm font-bold text-indigo-700">Age</th>
                          <th className="px-4 py-3 border-b text-left textsm font-bold text-indigo-700">Gender</th>
                          <th className="px-4 py-3 border-b text-left textsm font-bold text-indigo-700">Government ID</th>
                          <th className="px-4 py-3 border-b text-left textsm font-bold text-indigo-700">ID Proof</th>
                          <th className="px-4 py-3 border-b text-left textsm font-bold text-indigo-700">Party Name</th>
                          <th className="px-4 py-3 border-b text-left textsm font-bold text-indigo-700">Party Symbol</th>
                            <th className="px-4 py-3 border-b text-left textsm font-bold text-indigo-700">Ward/Constituency/Division</th>
                          <th className="px-4 py-3 border-b text-left textsm font-bold text-indigo-700">District/State/Region</th>
                        </tr>
                      </thead>
                      <tbody>
                        {candidates.map((candidate, idx) => (
                          <tr key={candidate.id} className="hover:bg-indigo-50 transition">
                            <td className="px-4 py-3">{idx + 1}</td>
                            <td className="px-4 py-3">
                              <Image
                                src={candidate.profile_photo_url || '/placeholder-avatar.png'}
                                alt={candidate.full_name}
                                width={56}
                                height={56}
                                className="w-14 h-14 rounded-lg object-cover border-2 border-indigo-400 shadow"
                              />
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap max-w-[180px] overflow-hidden text-ellipsis">{candidate.full_name}</td>
                            <td className="px-4 py-3 whitespace-nowrap">{candidate.age}</td>
                            <td className="px-4 py-3 whitespace-nowrap">{candidate.gender}</td>
                            <td className="px-4 py-3 whitespace-nowrap">{candidate.gov_id}</td>
                            <td className="px-4 py-3">
                              {candidate.id_proof_url ? (
                                <a href={candidate.id_proof_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">View</a>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap max-w-[120px] overflow-hidden text-ellipsis">{candidate.party_name}</td>
                            <td className="px-4 py-3">
                              {candidate.party_symbol_url ? (
                                <Image
                                  src={candidate.party_symbol_url}
                                  alt="Symbol"
                                  width={40}
                                  height={40}
                                  className="w-10 h-10 object-contain border border-gray-300 rounded"
                                />
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                           
                             <td className="px-4 py-3 whitespace-nowrap max-w-[120px] overflow-hidden text-ellipsis">{candidate.ward}</td>
                            <td className="px-4 py-3 whitespace-nowrap max-w-[120px] overflow-hidden text-ellipsis">{candidate.district}</td>
                            </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            )}
            {/* Voter Modal */}
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
                    Mark as Verified
                  </button>
                </div>
              )}
            </SimpleModal>
          </div>
        </div>
      </div>
    </div>
  );
}
