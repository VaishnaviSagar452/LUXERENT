import { CartItem } from "../models/cart.model.js";
import { Dress } from "../models/dress.model.js";

const addToCart = async (req, res) => {
  try {
    const { dressId } = req.params;

    const dress = await Dress.findById(dressId);
    if (!dress) {
      return res.status(404).json({ message: "Dress not found" });
    }

    const userId = req.user?._id;

    const existing = await CartItem.findOne({ user: userId, dress: dressId });

    if (existing) {
      const qty = (existing.qty || 1) + 1;
      existing.qty = qty;
      await existing.save();

      return res.status(200).json({ message: "Updated cart item", item: existing });
    }

    const item = await CartItem.create({ user: userId, dress: dressId, qty: 1 });
    return res.status(201).json({ message: "Added to cart", item });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getCart = async (req, res) => {
  try {
    const items = await CartItem.find({ user: req.user?._id })
      .populate("dress")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      message: "Cart fetched successfully",
      items,
      dresses: items.map((i) => i.dress),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const removeFromCart = async (req, res) => {
  try {
    const { dressId } = req.params;

    const userId = req.user?._id;

    const deleted = await CartItem.findOneAndDelete({ user: userId, dress: dressId });

    if (!deleted) {
      return res.status(404).json({ message: "Item not found in cart" });
    }

    return res.status(200).json({ message: "Removed from cart", item: deleted });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export { addToCart, getCart, removeFromCart };

