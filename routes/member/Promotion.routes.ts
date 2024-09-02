import express from "express";

import {

  isAuthenticatedMember,
} from "../../middleware/auth";
import {
    addPromotionRequest,
    getCurrentPromotion,
    getMyPromotion,
    getPromotionAmount,
} from "../../controller/member/promotion.controller";


const router = express.Router();



router.route("/current").get(isAuthenticatedMember,getCurrentPromotion);

router.route("/request").post(isAuthenticatedMember,addPromotionRequest);

router.route("/promotionAmount").get(isAuthenticatedMember,getPromotionAmount);
router.route("/").get(isAuthenticatedMember,getMyPromotion);


export default router;
