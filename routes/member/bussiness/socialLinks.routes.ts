import express from "express";
import {
  getSocialLinks,
  updateSocialLinks,
} from "../../../controller/member/socialLinks.controller";
import {
  isAuthenticatedMember,
} from "../../../middleware/auth";
import { putUpdateSocialLinks } from "../../../validations/member.validation";

const router = express.Router();

router.route("/update").put(putUpdateSocialLinks,isAuthenticatedMember, updateSocialLinks);
router.route("/").get(putUpdateSocialLinks,isAuthenticatedMember, getSocialLinks);

export default router;
