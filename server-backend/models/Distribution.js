const mongoose = require('mongoose');

const proofMetadataSchema = new mongoose.Schema(
  {
    originalName: { type: String, trim: true, minlength: 1, maxlength: 255 },
    mimeType: { type: String, enum: ['application/pdf', 'image/jpeg', 'image/png'] },
    extension: { type: String, enum: ['.pdf', '.jpg', '.jpeg', '.png'] },
    size: { type: Number, min: 1, max: 10 * 1024 * 1024 },
    storageStatus: { type: String, enum: ['not_uploaded'], default: 'not_uploaded' },
  },
  { _id: false }
);

const distributionSchema = new mongoose.Schema(
  {
    driveId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DonationDrive',
      required: true,
      index: true,
      immutable: true,
    },
    donationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Donation',
      required: true,
      index: true,
      immutable: true,
    },
    quantityDistributed: {
      type: Number,
      required: true,
      min: 1,
      max: 100000000,
      validate: {
        validator: Number.isInteger,
        message: 'quantityDistributed must be a positive integer.',
      },
    },
    beneficiariesAssisted: {
      type: Number,
      required: true,
      min: 1,
      max: 100000000,
      validate: {
        validator: Number.isInteger,
        message: 'beneficiariesAssisted must be a positive integer.',
      },
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    proofMetadata: {
      type: proofMetadataSchema,
      default: undefined,
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      immutable: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Distribution', distributionSchema);
