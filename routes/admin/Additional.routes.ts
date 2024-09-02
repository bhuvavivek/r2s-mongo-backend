import express from "express";

import {
  isAuthenticatedAdmin,
} from "../../middleware/auth";
import { putAdditionalData,loggedIn} from "../../validations/admin.validation";
import {
  updateAddtionaldetail,
  getAdditional,
  adminDashboardStatic,
  adminDashboardMonthly,
  otpsend
} from "../../controller/admin/additional.controller";
import { daleteFeedback } from "../../controller/member/feedback.controller";

const router = express.Router();


router.route("/").get(loggedIn,isAuthenticatedAdmin, getAdditional).put(putAdditionalData,isAuthenticatedAdmin, updateAddtionaldetail);

router.route("/delete-feedback/:id").delete(isAuthenticatedAdmin,daleteFeedback)
router.route("/dashboard").get(isAuthenticatedAdmin,adminDashboardStatic)
router.route("/withdrawrevenuegraph").get(isAuthenticatedAdmin,adminDashboardMonthly)



export default router;
