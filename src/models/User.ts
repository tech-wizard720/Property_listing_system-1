import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  favorites: [{ type: String }],
  recommendationsReceived: [{
    propertyId: { type: String, required: true },
    recommendedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    recommendedAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

export default mongoose.model('User', userSchema);
