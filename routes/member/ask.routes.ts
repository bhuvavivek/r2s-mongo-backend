import express from "express";
import { isAuthenticatedMember } from "../../middleware/auth";

import { addAsk, addResponse, getPersonalSingleAskById, getPrivateAsk, getPublicAsk, getPublicSingleAskById, getSingleMemberAsks, updateAskStatus } from "../../controller/admin/ask.controller";







const router = express.Router();


router.route("/add")
    .post(isAuthenticatedMember, addAsk)


// router.route("/single-title/:id").get(isAuthenticatedMember, getSingleSupportTitle)
// router.route("/").post(isAuthenticatedMember, addSupport)
// router.route("/").get(isAuthenticatedMember, getSupport)
router.route("/publicask").get(isAuthenticatedMember, getPublicAsk)
router.route("/privateask").get(isAuthenticatedMember, getPrivateAsk)
router.route("/memberask").get(isAuthenticatedMember, getSingleMemberAsks)
router.route("/private/:id").get(isAuthenticatedMember, getPersonalSingleAskById)
router.route("/:id").get(isAuthenticatedMember, getPublicSingleAskById)
router.route("/:id").put(isAuthenticatedMember, updateAskStatus)
router.route("/reponse/add").post(isAuthenticatedMember, addResponse)






export default router