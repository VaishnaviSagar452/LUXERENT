import { Router } from "express";

import {
  addDress,
  getAllDresses,
  getSingleDress,
  updateDress,
  deleteDress
  
} from "../controllers/dress.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.route("/").get(getAllDresses);

router.route("/add").post(
  verifyJWT,
  upload.single("image"),
  addDress
);

router.route("/:id").get(getSingleDress);

router.route("/:id").patch(
  verifyJWT,
  updateDress
);

router.route("/:id").delete(
  verifyJWT,
  deleteDress
);



export default router;