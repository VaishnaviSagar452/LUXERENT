import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";

import { addToCart, getCart, removeFromCart } from "../controllers/cart.controller.js";

const router = Router();

router.route("/").get(verifyJWT, getCart);

router.route("/add/:dressId").post(verifyJWT, addToCart);

router.route("/remove/:dressId").delete(verifyJWT, removeFromCart);

export default router;

