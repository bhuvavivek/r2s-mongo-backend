import express, { Request, Response, NextFunction } from "express";
import {
  isAuthenticatedMember,
} from "../../middleware/auth";
import {
  verifyUserExistence,
  sendOTP,
} from "../../controller/common";

import {
  handlingUserIsPremium
} from "../../controller/common";

import { changeMemberPassword, register, getMyProfile, Login, VerifingExistence, validatingMemberDetail, validateRegistrationFields, forgotPassword, resetPassword, whatsappStatus } from "../../controller/member/auth.controller"
import {
  generateUniqueMemberId, verifyingUpdateData, validatingPicture, handlingProfilePicture, updateBusinessLogo, handlingBussinessCover as handlingBusinessCover, updatingBankDetail, updatingAddressDetail, updatingMemeberDetail as updatingMemberDetail,
} from "../../controller/member/business.controller"

import {validateLogin} from "../../validations/member.validation"
import { otpsend, verifyOTP } from "../../controller/admin/additional.controller";


const   router = express.Router();

router.route("/send-otp-mobile").post(verifyUserExistence, sendOTP);
/**
 * @swagger
 * /users:
 *   get:
 *     summary: Retrieve a list of JSONPlaceholder users
 *     description: Retrieve a list of users from JSONPlaceholder. Can be used to populate a list of fake users when prototyping or testing an API.
*/

router.post('/login',validateLogin, handlingUserIsPremium, async (req: Request, res: Response, next: NextFunction) => {
  /**
 * @swagger
 * /users:
 *   get:
 *     summary: Retrieve a list of JSONPlaceholder users
 *     description: Retrieve a list of users from JSONPlaceholder. Can be used to populate a list of fake users when prototyping or testing an API.
*/
  try {
    await Login(req, res, next);
  } catch (err) {
    next(err);
  }
});

router.get('/me',isAuthenticatedMember, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await getMyProfile(req, res, next);
  } catch (err) {
    next(err);
  }
});

// router.route("/me").get(isAuthenticatedMember, getMyProfile);

router.route("/register").post(validateRegistrationFields, VerifingExistence, generateUniqueMemberId, register);

router.route("/change-password").patch(isAuthenticatedMember, changeMemberPassword);

router.route("/validate").post(validatingMemberDetail);
router.route("/sendotp").post(otpsend)
router.route("/verify").post(verifyOTP)
router.route("/forgotPassword").post(forgotPassword)
router.route("/resetpassword").post(resetPassword)
router.route("/whatsappStatus").post(isAuthenticatedMember,whatsappStatus)



router.route("/update-profile").put(isAuthenticatedMember, verifyingUpdateData, updatingMemberDetail, updatingBankDetail, updatingAddressDetail);


router.route("/update-single-picture").put(isAuthenticatedMember, validatingPicture, handlingProfilePicture, handlingBusinessCover, updateBusinessLogo);

export default router;



