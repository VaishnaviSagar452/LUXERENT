import mongoose from "mongoose";

const wishlistSchema = new mongoose.Schema(
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
  },
  { timestamps: true }
);

wishlistSchema.index({ user: 1, dress: 1 }, { unique: true });

export const WishlistItem = mongoose.model(
  "WishlistItem",
  wishlistSchema
);

