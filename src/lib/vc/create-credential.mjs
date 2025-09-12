// create-credential.mjs
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { createVerifiableCredentialJwt } from 'did-jwt-vc';
import { EdDSASigner } from 'did-jwt';
import * as u8a from 'uint8arrays';

// Load issuer key
const keyPath = path.join('keys', 'issuer-key.json');
if (!fs.existsSync(keyPath)) {
  console.error('❌ Issuer key not found. Run generate-issuer-key.mjs first.');
  process.exit(1);
}
const { did, privateKeyBase58 } = JSON.parse(fs.readFileSync(keyPath));
const privateKey = u8a.fromString(privateKeyBase58, 'base58btc');

// Setup readline
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const questions = [
  'Enter Voter ID: ',
  'Full Name: ',
  "Father's/Mother's/Husband's Name: ",
  'Date of Birth (YYYY-MM-DD): ',
  'Gender: ',
  'Residential Address: '
];

const answers = [];

function askQuestion(i) {
  rl.question(questions[i], (answer) => {
    answers.push(answer);
    if (i < questions.length - 1) {
      askQuestion(i + 1);
    } else {
      rl.close();
      createVC();
    }
  });
}

async function createVC() {
  const [voterId, fullName, relationName, dateOfBirth, gender, address] = answers;
  const now = Math.floor(Date.now() / 1000);

  const vcPayload = {
    sub: `did:example:${voterId}`,
    nbf: now,
    vc: {
      '@context': ['https://www.w3.org/2018/credentials/v1'],
      type: ['VerifiableCredential', 'VoterCredential'],
      credentialSubject: {
        id: `did:example:${voterId}`,
        voterId,
        fullName,
        relationName,
        dateOfBirth,
        gender,
        address
      }
    }
  };

  const issuer = {
    did,
    signer: EdDSASigner(privateKey),
    alg: 'EdDSA'
  };

  try {
    const jwt = await createVerifiableCredentialJwt(vcPayload, issuer);
    const outputPath = path.join('credentials', `${voterId}.jwt`);
    fs.writeFileSync(outputPath, jwt);
    console.log(`✅ Signed VC saved to ${outputPath}`);
  } catch (error) {
    console.error('❌ Failed to sign VC:', error);
  }
}

askQuestion(0);
