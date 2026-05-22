import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";

import { toggleWishlist, getWishlist } from "../controllers/wishlist.controller.js";

const router = Router();

router.route("/").get(verifyJWT, getWishlist);

router.route("/toggle/:dressId").post(verifyJWT, toggleWishlist);

export default router;

