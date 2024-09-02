import express from "express";
import {
  createPayoutRequest,
  createSalesPayoutRequest,
  getPayoutHistory
} from "../../controller/member/payout.controller";
import {
  isAuthenticatedMember
} from "../../middleware/auth";


const router = express.Router();

router.route("/").get(isAuthenticatedMember,getPayoutHistory);

router.route("/request").post(isAuthenticatedMember,createPayoutRequest);
router.route('/sales-request').post(isAuthenticatedMember,createSalesPayoutRequest)

export default router;
