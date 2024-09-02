import express from "express";


// import {login} from "../admin/controller"
import {
  isAuthenticatedAdmin,
  verifyOtp,
  isAuthenticatedMember,
} from "../../../middleware/auth";

import {
    addDeliveryAddress,
    updateDeliveryAddress,
    deleteDeliveryAddress,
    getDeliveryAddress,

} from "../../../controller/member/DeliveryAddress.controller";


const router = express.Router();

router.route("/add").post(isAuthenticatedMember, addDeliveryAddress);
router
  .route("/:id")
  .delete(isAuthenticatedMember, deleteDeliveryAddress).put(isAuthenticatedMember, updateDeliveryAddress);

router.route("/").get(isAuthenticatedMember, getDeliveryAddress);

export default router;
