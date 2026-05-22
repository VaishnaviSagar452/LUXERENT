import { WishlistItem } from "../models/wishlist.model.js";
import { Dress } from "../models/dress.model.js";

const toggleWishlist = async (req, res) => {
  try {
    const { dressId } = req.params;

    const dress = await Dress.findById(dressId);
    if (!dress) {
      return res.status(404).json({ message: "Dress not found" });
    }

    const userId = req.user?._id;
    const existing = await WishlistItem.findOne({ user: userId, dress: dressId });

    if (existing) {
      await WishlistItem.deleteOne({ _id: existing._id });
      return res.status(200).json({
        message: "Removed from wishlist",
      });
    }

    await WishlistItem.create({ user: userId, dress: dressId });
    return res.status(201).json({
      message: "Added to wishlist",
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getWishlist = async (req, res) => {
  try {
    const items = await WishlistItem.find({ user: req.user?._id })
      .populate("dress")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      message: "Wishlist fetched successfully",
      items,
      dresses: items.map((i) => i.dress),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export { toggleWishlist, getWishlist };

