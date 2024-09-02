import express from "express";

import {
  isAuthenticatedMember,
} from "../../middleware/auth";


import {
  getEarning,
} from "../../controller/member/business.controller";

const router = express.Router();

router.route("/").get(isAuthenticatedMember, getEarning); 

export default router;
