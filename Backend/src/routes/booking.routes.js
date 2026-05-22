import { Router } from "express";

import {
  createBooking,
  getMyBookings,
  cancelBooking
}
from "../controllers/booking.controller.js";

import { verifyJWT }
from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/create").post(
  verifyJWT,
  createBooking
);

router.route("/my-bookings").get(
  verifyJWT,
  getMyBookings
);

router.route("/cancel/:id").patch(
  verifyJWT,
  cancelBooking
);

export default router;