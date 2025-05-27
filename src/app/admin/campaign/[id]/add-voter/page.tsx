'use client';

import { db, storage } from '@/lib/firebase';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';

export default function AddvoterPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params as { id: string };

  const [fullName, setFullName] = useState('');
  const [voterId, setVoterId] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [motherName, setMotherName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [address, setAddress] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [idProof, setIdProof] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!photo || !idProof) {
      alert('Please upload both photo and ID proof.');
      return;
    }

    setLoading(true);
    try {
      const safeName = fullName.trim().toLowerCase().replace(/\s+/g, '_');
      const photoRef = ref(storage, `voters/${id}/photos/${safeName}.jpg`);
      const idProofRef = ref(storage, `voters/${id}/idproofs/${safeName}_id.jpg`);

      // Upload files
      const photoSnap = await uploadBytes(photoRef, photo);
      const idProofSnap = await uploadBytes(idProofRef, idProof);

      // Get download URLs
      const photoURL = await getDownloadURL(photoSnap.ref);
      const idProofURL = await getDownloadURL(idProofSnap.ref);

      // Prepare data
      const voterId = fullName
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/[^a-z0-9-]/g, ''); // Remove special characters

      const voterData = {
        full_name: fullName,
        voter_id: voterId,
        father_name: fatherName,
        mother_name: motherName,
        dob,
        gender,
        address,
        photo_url: photoURL,
        id_proof_url: idProofURL,
        created_at: Timestamp.now(),
      };

      // Add to Firestore with voter name as document ID
      await setDoc(
        doc(db, 'campaigns', id, 'voters', voterId),
        voterData
      );

      alert('voter added successfully!');
      router.push(`/admin/campaign/${id}`);
        } catch (error: unknown) {
      console.error('Error adding voter:', error);
      alert('Failed to add voter: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-400 flex items-center justify-center px-2 py-8">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl shadow-2xl p-10 w-full max-w-2xl space-y-8"
        style={{ boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)' }}
      >
        <h2 className="text-3xl font-extrabold text-center text-indigo-700 mb-6 tracking-tight">
          Add Voter
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-gray-700 font-semibold mb-1">Full Name</label>
            <input
              type="text"
              placeholder="Full Name"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              className="border border-gray-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-indigo-400"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 font-semibold mb-1">Voter ID</label>
            <input
              type="text"
              placeholder="Voter ID"
              value={voterId}
              onChange={e => setVoterId(e.target.value)}
              className="border border-gray-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-indigo-400"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 font-semibold mb-1">Father&#39;s Name</label>
            <input
              type="text"
              placeholder="Father&#39;s Name"
              value={fatherName}
              onChange={e => setFatherName(e.target.value)}
              className="border border-gray-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-indigo-400"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 font-semibold mb-1">Mother&#39;s Name</label>
            <input
              type="text"
              placeholder="Mother&#39;s Name"
              value={motherName}
              onChange={e => setMotherName(e.target.value)}
              className="border border-gray-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-indigo-400"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 font-semibold mb-1">Date of Birth</label>
            <input
              type="date"
              value={dob}
              onChange={e => setDob(e.target.value)}
              className="border border-gray-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-indigo-400"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 font-semibold mb-1">Gender</label>
            <select
              value={gender}
              onChange={e => setGender(e.target.value)}
              className="border border-gray-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-indigo-400"
              required
            >
              <option value="">Select Gender</option>
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-gray-700 font-semibold mb-1">Address</label>
            <textarea
              placeholder="Address"
              value={address}
              onChange={e => setAddress(e.target.value)}
              className="border border-gray-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-indigo-400"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 font-semibold mb-1">Photo</label>
            <input
              type="file"
              accept="image/*"
              onChange={e => setPhoto(e.target.files?.[0] || null)}
              className="block mt-1 w-full text-gray-700"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 font-semibold mb-1">ID Proof Photo</label>
            <input
              type="file"
              accept="image/*"
              onChange={e => setIdProof(e.target.files?.[0] || null)}
              className="block mt-1 w-full text-gray-700"
              required
            />
          </div>
        </div>
        <div className="flex justify-between mt-8">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 rounded-lg bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 transition"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 transition shadow-lg"
            disabled={loading}
          >
            {loading ? 'Adding...' : 'Add voter'}
          </button>
        </div>
      </form>
    </div>
  );
}
