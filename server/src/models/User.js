import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// 'viewer' is a read-only account: it can see every screen but cannot change
// any item, sign-off, custom item, or finalise the record.
export const ROLE_VALUES = ['admin', 'hariganga', 'cph', 'viewer'];

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ROLE_VALUES, default: 'cph' },
    designation: { type: String, default: '' },
    active: { type: Boolean, default: true },
    // Names of the areas (sections) this user is allowed to update.
    // Admins ignore this list — they can edit every section.
    assignedAreas: { type: [String], default: [] },
  },
  { timestamps: true }
);

userSchema.methods.setPassword = async function setPassword(plain) {
  this.passwordHash = await bcrypt.hash(plain, 10);
};

userSchema.methods.verifyPassword = function verifyPassword(plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

userSchema.methods.toSafeJSON = function toSafeJSON() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    designation: this.designation,
    active: this.active,
    assignedAreas: this.assignedAreas || [],
  };
};

export const User = mongoose.model('User', userSchema);
