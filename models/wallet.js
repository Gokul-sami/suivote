import mongoose from 'mongoose';

const WalletSchema = new mongoose.Schema({
  zkAddress: { type: String, unique: true },
  did: { type: String },
  vc: { type: Object },
  salt: { type: String },
  privateKey: { type: String },
  votingInfo: {
    constituency: String,
    voted: { type: Boolean, default: false }
  }
});

module.exports = mongoose.model('Wallet', WalletSchema);