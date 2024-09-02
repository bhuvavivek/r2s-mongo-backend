import express from "express";
import {
  addDefaultPromotion,
  addPromotionAmount,
  deleteDefaultPromotion,
  getDefaultPromotion,
  getPromotion,
  getPromotionAmount,
  updatePromotionAmount,
  updatePromotionRequest,
} from "../../controller/member/promotion.controller";
import {
  isAuthenticatedAdmin
} from "../../middleware/auth";
import { getPromotions, putPromotion } from "../../validations/admin.validation";



const router = express.Router();



router.route("/").get(getPromotions,isAuthenticatedAdmin,getPromotion);

router.route("/add/amount").post(getPromotions,isAuthenticatedAdmin,addPromotionAmount);

router.route("/get/amount").get(getPromotions,isAuthenticatedAdmin,getPromotionAmount);

router.route("/update/amount").put(getPromotions,isAuthenticatedAdmin,updatePromotionAmount);


router.route("/DefaultPromotion").post(isAuthenticatedAdmin,addDefaultPromotion);
router.route("/DefaultPromotion").get(isAuthenticatedAdmin,getDefaultPromotion);
router.route("/DefaultPromotion/:id").delete(isAuthenticatedAdmin,deleteDefaultPromotion);



router.route("/:id").put(putPromotion,isAuthenticatedAdmin, updatePromotionRequest);




export default router;
