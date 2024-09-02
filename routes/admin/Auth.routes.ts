import express from "express";
import { isAuthenticatedAdmin } from "../../middleware/auth";
import { postLogin,putAdminDetail,putUpdatePicture,loggedIn,patchPassword } from "../../validations/admin.validation";
import {
  getAdminprofile,
  login,
  updatingAdminDetail,
  changePassword,
  updateAdminPicture,
} from "../../controller/admin/auth.controller";

const router = express.Router();

router.route("/login").post(postLogin,login);


  router
  .route("/picture")
  .patch(putUpdatePicture,isAuthenticatedAdmin, updateAdminPicture);


router.route("/me").put(putAdminDetail,isAuthenticatedAdmin, updatingAdminDetail).get(loggedIn,isAuthenticatedAdmin, getAdminprofile);

router.route("/password").patch(patchPassword,isAuthenticatedAdmin, changePassword);


export default router;
