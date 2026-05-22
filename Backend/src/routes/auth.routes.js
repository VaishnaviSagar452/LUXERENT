import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";

import {
  registerUser,
  loginUser
} from "../controllers/auth.controller.js";

const router = Router();

router.route("/register").post(registerUser);

router.route("/login").post(loginUser);

router.route("/profile").get(
  verifyJWT,
  (req, res) => {

    return res.status(200).json({
      message: "Protected route accessed",
      user: req.user
    });
  }
);

export default router;