import express from "express";
import {
  isAuthenticatedMember,
} from "../../middleware/auth";
import {
    getPaymentHistory,
    createPayments,
    verifyPaymentMemberShip,
    getMembershipAmount,
} from "../../controller/member/payment.controller"

const router = express.Router();


router.route("/").post(isAuthenticatedMember,getPaymentHistory);

router.route("/request").post(isAuthenticatedMember,createPayments);
router.route("/verifyPayment").post( verifyPaymentMemberShip)
router.route("/membership-amount").post( isAuthenticatedMember,getMembershipAmount)


export default router;
