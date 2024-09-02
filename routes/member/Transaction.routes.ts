import express from "express";
import {
  isAuthenticatedMember,
} from "../../middleware/auth";

import {getRecentTransition} from "../../controller/member/business.controller"

const router = express.Router();

router.route("/recent").get(isAuthenticatedMember,getRecentTransition);
export default router;