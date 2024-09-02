import express from "express";

// import {login} from "../admin/controller"
import {
  isAuthenticatedAdmin,
} from "../../middleware/auth";
import {
  getPayment,
  patchPaymentStatus,
} from "../../validations/admin.validation";
import {
  getMembershipAmount,
    getPayments,
    updateMembershipAmount,
    UpdatePaymentStatus,
    validatingPaymentInfo
} from "../../controller/member/payment.controller";

const router = express.Router();


router.route("/").get(getPayment,isAuthenticatedAdmin, getPayments);


router.route("/status/:id").patch(patchPaymentStatus,isAuthenticatedAdmin,validatingPaymentInfo, UpdatePaymentStatus);
router.route("/membership-amount").put(isAuthenticatedAdmin, updateMembershipAmount);
router.route("/membership-amount").get(isAuthenticatedAdmin, getMembershipAmount);

export default router;
