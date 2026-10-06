const mongoose = require('mongoose');

const requestedItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      minlength: 1,
      maxlength: 150,
    },
    quantity: {
      type: Number,
      min: 1,
      max: 100000000,
      validate: {
        validator: Number.isInteger,
        message: 'Requested item quantity must be a positive integer.',
      },
    },
  },
  { _id: false },
);

const donationDriveSchema = new mongoose.Schema(
  {
    partnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
      immutable: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 150,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 2000,
    },
    category: {
      type: String,
      required: true,
      enum: ['School Supplies', 'Food', 'Hygiene', 'Clothing', 'Water', 'Household Needs'],
    },
    targetQuantity: {
      type: Number,
      required: true,
      min: 1,
      max: 100000000,
      validate: {
        validator: Number.isInteger,
        message: 'targetQuantity must be a positive integer.',
      },
    },
    eventDate: {
      type: Date,
    },
    requestedItems: {
      type: [requestedItemSchema],
      default: undefined,
    },
    location: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 300,
    },
    assistanceReference: {
      type: String,
      trim: true,
      maxlength: 300,
    },
    status: {
      type: String,
      enum: ['active', 'paused', 'completed', 'cancelled'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('DonationDrive', donationDriveSchema);
