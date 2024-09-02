import express from "express";
import {
  isAuthenticatedMember,
} from "../../../middleware/auth";

import {
  getMyOrder,
  getOrder,
  getSingleOrder,
  postCreateOrder,
  putOrderStatus,
  verifyPayment
} from "../../../controller/member/order.controller";


const router = express.Router();

router.route("/").get(isAuthenticatedMember, getOrder);

router.route("/create").post(isAuthenticatedMember, postCreateOrder)
router.route("/verifyPayment").post( verifyPayment)

router.route("/single/:id").get(isAuthenticatedMember, getSingleOrder);

router.route("/my").get(isAuthenticatedMember, getMyOrder);

router.route("/status/:id").put(isAuthenticatedMember, putOrderStatus);

// router.route("/payment/status").get(isAuthenticatedMember, putPaymentStatus);

export default router;
