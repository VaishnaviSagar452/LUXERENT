import mongoose from "mongoose";

const dressSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },

    description: {
      type: String,
      required: true
    },

    category: {
      type: String,
      required: true
    },

    size: {
      type: String,
      required: true
    },

    color: {
      type: String,
      required: true
    },

    brand: {
      type: String
    },

    rentPrice: {
      type: Number,
      required: true
    },

    securityDeposit: {
      type: Number,
      default: 0
    },

    images: [
      {
        type: String
      }
    ],

    availability: {
      type: Boolean,
      default: true
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }

  },
  {
    timestamps: true
  }
);

export const Dress = mongoose.model("Dress", dressSchema);