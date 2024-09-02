import express from "express";

import {
  isAuthenticatedMember,
} from "../../../middleware/auth";

import {
  addProduct,
  updateProduct,
  getMyproducts,
  deleteProduct,
  getTopRatedProducts,
  getBusinessProducts,
  SearchProduct,
  getSingleProduct,
  updateShippinfFee,
} from "../../../controller/member/Product.controller";


const router = express.Router();


router
  .route("/top-rated")
  .get(isAuthenticatedMember, getTopRatedProducts);
router.route("/add").post(isAuthenticatedMember, addProduct);


router.route("/search").get(isAuthenticatedMember, SearchProduct);

router
  .route("/:id")
  .get(isAuthenticatedMember, getSingleProduct)
  .delete(isAuthenticatedMember, deleteProduct)
  .put(isAuthenticatedMember, updateProduct);

router.route("/").get(isAuthenticatedMember, getMyproducts);

router
  .route("/business/:id")
  .get(isAuthenticatedMember, getBusinessProducts);
 





export default router;
