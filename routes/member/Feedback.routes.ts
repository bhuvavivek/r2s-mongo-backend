import express from "express";
import {
  isAuthenticatedMember,
} from "../../middleware/auth";
import {
  
  createFeedback,
  getAverageRating,
  getFeedback,
} from "../../controller/member/feedback.controller";

const router = express.Router();


router.route("/add/:id").post(isAuthenticatedMember, createFeedback);



router.route("/").get(isAuthenticatedMember,getFeedback);
router.route("/avg/:id").get(isAuthenticatedMember,getAverageRating);

export default router;
