import fs from 'fs';
import path from 'path';
import { generateKeyPair } from '@stablelib/ed25519';
import { encode } from 'base58-universal';

async function main() {
  const keysDir = path.join(process.cwd(), 'keys');
  if (!fs.existsSync(keysDir)) {
    fs.mkdirSync(keysDir, { recursive: true });
  }

  // Generate Ed25519 key pair (publicKey: 32 bytes, secretKey: 64 bytes)
  const { publicKey, secretKey } = generateKeyPair();

  // Encode keys in base58btc
  const publicKeyBase58 = encode(publicKey);
  const privateKeyBase58 = encode(secretKey.subarray(0, 32)); // first 32 bytes = private key seed

  // Build did:key DID using multicodec prefix 0xed01 + publicKey bytes
  // 0xed01 is the multicodec for Ed25519 pubkey
  const prefix = new Uint8Array([0xed, 0x01]);
  const prefixedPubKey = new Uint8Array(prefix.length + publicKey.length);
  prefixedPubKey.set(prefix, 0);
  prefixedPubKey.set(publicKey, prefix.length);

  // Multibase encode with base58btc (prefix 'z')
  const did = 'did:key:z' + encode(prefixedPubKey);

  // Add multibase prefix 'z' to public key base58
  const publicKeyMultibase = 'z' + publicKeyBase58;

  // Save keys and did to JSON
  const keyData = {
    did,
    privateKeyBase58,
    publicKeyMultibase,  // <--- save this with 'z' prefix
  };

  fs.writeFileSync(path.join(keysDir, 'issuer-key.json'), JSON.stringify(keyData, null, 2));

  console.log(`✅ DID created: ${did}`);
  console.log(`🔐 Private key saved to keys/issuer-key.json`);
}

main().catch((e) => {
  console.error('❌ Error generating issuer key:', e);
  process.exit(1);
});
