import express from "express";
import {
  UpdateAmountDetails,
  getAmountDetails
} from "../../controller/admin/manageAmount.controller";
import { isAuthenticatedAdmin } from "../../middleware/auth";


const router = express.Router();


router.route("/").patch(isAuthenticatedAdmin,UpdateAmountDetails ).get(isAuthenticatedAdmin,getAmountDetails);



export default router;
