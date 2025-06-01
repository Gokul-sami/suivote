"use client";

import { db, storage } from '@/lib/firebase';
import { collection } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

export default function AddCandidatePage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params as { id: string };

  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [govId, setGovId] = useState("");
  const [idProof, setIdProof] = useState<File | null>(null);
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [partyName, setPartyName] = useState("");
  const [partySymbol, setPartySymbol] = useState<File | null>(null);

  const [campaign, setCampaign] = useState(id || "");
  const [ward, setWard] = useState("");
  const [district, setDistrict] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let idProofUrl = '';
      let profilePhotoUrl = '';
      let partySymbolUrl = '';
      const safeName = fullName.trim().toLowerCase().replace(/\s+/g, '_');
      if (idProof) {
        const idProofRef = ref(storage, `candidates/${id}/idproofs/${safeName}_id`);
        await uploadBytes(idProofRef, idProof);
        idProofUrl = await getDownloadURL(idProofRef);
      }
      if (profilePhoto) {
        const profilePhotoRef = ref(storage, `candidates/${id}/photos/${safeName}.jpg`);
        await uploadBytes(profilePhotoRef, profilePhoto);
        profilePhotoUrl = await getDownloadURL(profilePhotoRef);
      }
      if (partySymbol) {
        const partySymbolRef = ref(storage, `candidates/${id}/symbols/${safeName}_symbol`);
        await uploadBytes(partySymbolRef, partySymbol);
        partySymbolUrl = await getDownloadURL(partySymbolRef);
      }
     
      const candidateData = {
        full_name: fullName,
        age,
        gender,
        gov_id: govId,
        ward,
        district,
        id_proof_url: idProofUrl,
        profile_photo_url: profilePhotoUrl,
        party_name: partyName,
        party_symbol_url: partySymbolUrl,
   
        created_at: new Date().toISOString(),
      };
      // Use setDoc with the candidate's safe name as the document ID
      const { setDoc, doc } = await import('firebase/firestore');
      const candidatesCol = collection(db, 'campaigns', id, 'candidates');
      await setDoc(doc(candidatesCol, safeName), candidateData);
      alert('Candidate added successfully!');
      router.push(`/admin/campaign/${id}`);
    } catch (error) {
      alert('Failed to add candidate.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-white flex items-center justify-center px-2 py-8">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-3xl shadow-2xl p-10 w-full max-w-2xl space-y-10 border border-indigo-100"
        style={{ boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.12)' }}
      >
        <h2 className="text-4xl font-extrabold text-center text-indigo-700 mb-2 tracking-tight drop-shadow-sm">
          Add Candidate
        </h2>
        <p className="text-center text-gray-500 mb-6 text-lg">.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Full Name */}
          <div>
            <label className="block text-gray-700 font-semibold mb-2">Full Name</label>
            <input
              type="text"
              placeholder="Full Name"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              className="border border-indigo-200 p-3 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-gray-50 text-gray-800 shadow-sm"
              required
            />
          </div>
          {/* Age */}
          <div>
            <label className="block text-gray-700 font-semibold mb-2">Age</label>
            <input
              type="number"
              placeholder="Age"
              value={age}
              onChange={e => setAge(e.target.value)}
              className="border border-indigo-200 p-3 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-gray-50 text-gray-800 shadow-sm"
              required
            />
          </div>
          {/* Gender */}
          <div>
            <label className="block text-gray-700 font-semibold mb-2">Gender</label>
            <select
              value={gender}
              onChange={e => setGender(e.target.value)}
              className="border border-indigo-200 p-3 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-gray-50 text-gray-800 shadow-sm"
              required
            >
              <option value="">Select Gender</option>
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
            </select>
          </div>
          {/* Government ID Number */}
          <div>
            <label className="block text-gray-700 font-semibold mb-2">Government ID Number</label>
            <input
              type="text"
              placeholder="Aadhaar, PAN, etc."
              value={govId}
              onChange={e => setGovId(e.target.value)}
              className="border border-indigo-200 p-3 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-gray-50 text-gray-800 shadow-sm"
              required
            />
          </div>
          {/* ID Proof */}
          <div>
            <label className="block text-gray-700 font-semibold mb-2">Upload ID Proof (PDF/Image)</label>
            <input
              type="file"
              accept=".pdf,image/*"
              onChange={e => setIdProof(e.target.files?.[0] || null)}
              className="block mt-1 w-full text-gray-800 file:rounded-lg file:bg-indigo-50 file:border file:border-indigo-200 file:py-2 file:px-4 file:text-indigo-700 file:font-semibold hover:file:bg-indigo-100"
              required
            />
          </div>
          {/* Profile Photo */}
          <div>
            <label className="block text-gray-700 font-semibold mb-2">Upload Profile Photo</label>
            <input
              type="file"
              accept="image/*"
              onChange={e => setProfilePhoto(e.target.files?.[0] || null)}
              className="block mt-1 w-full text-gray-800 file:rounded-lg file:bg-indigo-50 file:border file:border-indigo-200 file:py-2 file:px-4 file:text-indigo-700 file:font-semibold hover:file:bg-indigo-100"
              required
            />
          </div>
          {/* Party Name */}
          <div>
            <label className="block text-gray-700 font-semibold mb-2">Party Name</label>
            <input
              type="text"
              placeholder="Party Name"
              value={partyName}
              onChange={e => setPartyName(e.target.value)}
              className="border border-indigo-200 p-3 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-gray-50 text-gray-800 shadow-sm"
              required
            />
          </div>
          {/* Party/Independent Symbol */}
          <div>
            <label className="block text-gray-700 font-semibold mb-2">Upload Party Symbol</label>
            <input
              type="file"
              accept="image/*"
              onChange={e => setPartySymbol(e.target.files?.[0] || null)}
              className="block mt-1 w-full text-gray-800 file:rounded-lg file:bg-indigo-50 file:border file:border-indigo-200 file:py-2 file:px-4 file:text-indigo-700 file:font-semibold hover:file:bg-indigo-100"
              required
            />
          </div>
          {/* Ward/Constituency/Division Number */}
          <div className="md:col-span-2">
            <label className="block text-gray-700 font-semibold mb-2">Ward Number / Constituency / Division Number</label>
            <input
              type="text"
              placeholder="Ward/Constituency/Division Number"
              value={ward}
              onChange={e => setWard(e.target.value)}
              className="border border-indigo-200 p-3 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-gray-50 text-gray-800 shadow-sm"
              required
            />
          </div>
          {/* District / State / Region */}
          <div className="md:col-span-2">
            <label className="block text-gray-700 font-semibold mb-2">District / State / Region</label>
            <input
              type="text"
              placeholder="District / State / Region"
              value={district}
              onChange={e => setDistrict(e.target.value)}
              className="border border-indigo-200 p-3 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-gray-50 text-gray-800 shadow-sm"
              required
            />
          </div>
          
          {/* Campaign/Election */}
          <div className="md:col-span-2">
            <label className="block text-gray-700 font-semibold mb-2">Campaign/Election</label>
            <input
              type="text"
              value={campaign}
              readOnly
              className="border border-indigo-200 p-3 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-gray-100 text-gray-800 shadow-sm"
            />
          </div>
        </div>
        <div className="flex justify-between mt-10">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-8 py-3 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 border border-gray-300 shadow-sm transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-8 py-3 rounded-xl bg-gradient-to-r from-green-500 to-green-700 text-white font-semibold hover:from-green-600 hover:to-green-800 shadow-lg transition-all text-lg"
            disabled={loading}
          >
            {loading ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </form>
    </div>
  );
}
