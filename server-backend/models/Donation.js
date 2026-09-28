const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema(
  {
    driveId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DonationDrive',
      required: true,
      index: true,
      immutable: true,
    },

    // Optional because physical donors do not need a ClearGive account.
    donorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
      immutable: true,
    },

    // Name recorded by the partner for a physical contributor.
    contributorName: {
      type: String,
      default: 'Anonymous Donor',
      trim: true,
      minlength: 2,
      maxlength: 150,
    },

    item: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 150,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
      max: 100000000,
      validate: {
        validator: Number.isInteger,
        message: 'quantity must be a positive integer.',
      },
    },

    status: {
      type: String,
      enum: ['Recorded', 'Received', 'Distributed'],
      default: 'Recorded',
    },

    recordedAt: {
      type: Date,
      default: Date.now,
      immutable: true,
    },

    receivedAt: {
      type: Date,
      default: null,
    },

    receivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    distributedAt: {
      type: Date,
      default: null,
    },

    distributedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model('Donation', donationSchema);