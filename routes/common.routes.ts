import express from "express";

import {
  verifyUserExistence,
  sendOTP,
  getSharedProfile  
} from "../controller/common";

const router = express.Router();

router.route("/send-otp").post(verifyUserExistence, sendOTP);

  router
  .route("/get-shared-profile")
  .get(
    getSharedProfile
  );

export default router;
