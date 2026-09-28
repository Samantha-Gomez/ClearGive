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

    /*
     * Required registered donor account.
     *
     * Every donation recorded by a partner must be
     * connected to an existing ClearGive donor account.
     */
    donorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
      immutable: true,
    },

    /*
     * Automatically copied from the registered
     * donor's User.fullName.
     *
     * Partners cannot create an anonymous donation
     * or manually enter a different donor name.
     */
    contributorName: {
      type: String,
      required: true,
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

module.exports = mongoose.model(
  'Donation',
  donationSchema,
);