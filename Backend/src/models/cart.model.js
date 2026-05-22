import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    dress: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Dress",
      required: true,
      index: true,
    },

    qty: {
      type: Number,
      default: 1,
      min: 1,
    },
  },
  { timestamps: true }
);

cartItemSchema.index({ user: 1, dress: 1 }, { unique: true });

export const CartItem = mongoose.model("CartItem", cartItemSchema);

