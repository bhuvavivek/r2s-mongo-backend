import express from "express";
import {
  isAuthenticatedMember,
} from "../../../middleware/auth";
import {
  addBusinessPicture,
  updateBusinessPicture,
  deleteBusinessPicture,
  getBusinessPictures,
} from "../../../controller/member/bussinessPicture.controller";
import { postAddBusinessPicture } from "../../../validations/member.validation";

const router = express.Router();



router.route("/add").post(isAuthenticatedMember, addBusinessPicture);
// router.route("/").get(isAuthenticatedMember, getBusinessPictures);

router.route("/:id").put(isAuthenticatedMember, updateBusinessPicture).delete(isAuthenticatedMember,deleteBusinessPicture).get(isAuthenticatedMember,getBusinessPictures);


export default router;
