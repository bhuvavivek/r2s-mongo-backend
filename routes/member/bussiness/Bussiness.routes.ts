import express from "express";
import {
  isAuthenticatedMember,
} from "../../../middleware/auth";

import {
  getBusiness,
  getMyBusiness,
  getTopRatedBusiness,
  getTotalProductSales,
  updatingBusinessDetail,
  updatingBussinessAddressDetail,
  updatingPersonalAddressDetail,
  verifyingBussinessUpdateData
} from "../../../controller/member/business.controller";



import {
  configuringSearchLimit,
  handlingSearchRestriction,
  searchBykeywords,
} from "../../../controller/common";
import { updateShippinfFee } from "../../../controller/member/Product.controller";
import { getSingleBusiness, getTopratedBusiness } from "../../../validations/member.validation";

const router = express.Router();

router
  .route("/search")
  .post(
    isAuthenticatedMember,
    configuringSearchLimit,
    handlingSearchRestriction,
    searchBykeywords
  );

router.route("/").get(getSingleBusiness,isAuthenticatedMember, getMyBusiness);

router.route("/top-rated").get(getTopratedBusiness,isAuthenticatedMember, getTopRatedBusiness);

router.route("/update").put(isAuthenticatedMember,verifyingBussinessUpdateData,updatingBusinessDetail,updatingBussinessAddressDetail);
router.route("/update-personal-address").put(isAuthenticatedMember,updatingPersonalAddressDetail)
router.route("/ecommerce-dashboard").get(isAuthenticatedMember,getTotalProductSales)

router.route("/:id").get(isAuthenticatedMember, getBusiness);


  router.route("/shipping").put(isAuthenticatedMember,updateShippinfFee)


export default router;
