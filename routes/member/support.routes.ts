import express from "express";
import { isAuthenticatedMember } from "../../middleware/auth";
import { getSingleSupportTitle, getSupportTitle } from "../../controller/admin/support.controller";
import { addSupport, getSupport } from "../../controller/member/support.controller";

const router = express.Router();


router.route("/title")
    .get(isAuthenticatedMember, getSupportTitle)


router.route("/single-title/:id").get(isAuthenticatedMember, getSingleSupportTitle)
router.route("/").post(isAuthenticatedMember, addSupport)
router.route("/").get(isAuthenticatedMember, getSupport)


export default router