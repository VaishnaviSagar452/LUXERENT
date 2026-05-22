import { Router } from "express";

import {

  createPaymentOrder,

  verifyPayment

}

from "../controllers/payment.controller.js";

import { verifyJWT }

from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/create-order").post(
  verifyJWT,
  createPaymentOrder
);

router.route("/verify").post(
  verifyJWT,
  verifyPayment
);

export default router;