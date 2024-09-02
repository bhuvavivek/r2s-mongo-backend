import express from "express";
import {
  isAuthenticatedMember,
} from "../../../middleware/auth";
import {
    addToCart,
    deleteCartItem,
    updateCartItem,
    getMyCart,
} from "../../../controller/member/ShoppingCart.controller";


const router = express.Router();

router.route("/add").post(isAuthenticatedMember, addToCart);

router.route("/:id").put(isAuthenticatedMember, updateCartItem).delete(isAuthenticatedMember, deleteCartItem);

router.route("/").get(isAuthenticatedMember, getMyCart);


export default router;
