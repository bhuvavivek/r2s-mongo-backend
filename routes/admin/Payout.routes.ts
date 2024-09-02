import express from "express";
import {
  isAuthenticatedAdmin,
} from "../../middleware/auth";
import {getPayout, patchPayoutStatus}  from "../../validations/admin.validation"
import {
  getPayouts,
  UpdatePayoutStatus,
} from "../../controller/member/payout.controller";



const router = express.Router();


router.route("/").get(getPayout,isAuthenticatedAdmin, getPayouts);

router.route("/status/:id").patch(patchPayoutStatus,isAuthenticatedAdmin, UpdatePayoutStatus);

export default router;
