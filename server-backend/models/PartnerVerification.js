const mongoose = require('mongoose');

const documentMetadataSchema = new mongoose.Schema(
  {
    originalName: { type: String, required: true, trim: true, maxlength: 255 },
    mimeType: { type: String, required: true, enum: ['application/pdf', 'image/jpeg', 'image/png'] },
    extension: { type: String, required: true, enum: ['.pdf', '.jpg', '.jpeg', '.png'] },
    size: { type: Number, required: true, min: 1, max: 10 * 1024 * 1024 },
    storageStatus: { type: String, enum: ['not_uploaded'], default: 'not_uploaded' },
  },
  { _id: false }
);

const partnerVerificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    organizationName: { type: String, required: true, trim: true, minlength: 2, maxlength: 150 },
    organizationType: {
      type: String,
      required: true,
      enum: ['NGO/non-profit', 'school', 'barangay/community organization', 'other'],
    },
    address: { type: String, required: true, trim: true, minlength: 5, maxlength: 300 },
    officialEmail: { type: String, required: true, trim: true, lowercase: true, match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid official email.'] },
    contactNumber: { type: String, required: true, trim: true },
    authorizedRepresentativeName: { type: String, required: true, trim: true, minlength: 2, maxlength: 150 },
    representativePosition: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    registrationCertificate: { type: documentMetadataSchema, required: true },
    supportingOrganizationDocument: { type: documentMetadataSchema, required: true },
    representativeGovernmentId: { type: documentMetadataSchema, required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    rejectionReason: { type: String, trim: true, maxlength: 500 },
    submittedAt: { type: Date, default: Date.now },
    reviewedAt: { type: Date, default: null },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

partnerVerificationSchema.pre('validate', function validateRejectionReason() {
  if (this.status === 'rejected' && (!this.rejectionReason || !this.rejectionReason.trim())) {
    this.invalidate('rejectionReason', 'A rejection reason is required.');
  }
});

module.exports = mongoose.model('PartnerVerification', partnerVerificationSchema);