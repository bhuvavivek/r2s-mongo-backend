import express from "express";
import { isAuthenticatedAdmin } from "../../middleware/auth";
import { addSupportTitle, deleteSupportTitle, getSingleSupportTitle, getSupport, getSupportTitle, searchSupportByTicketNumber, updateSupportStatus, updateSupportTitle } from "../../controller/admin/support.controller";

const router = express.Router();


router.route("/")
    .get(isAuthenticatedAdmin, getSupportTitle)
    .post(isAuthenticatedAdmin, addSupportTitle);

router.route("/getSupport").get(isAuthenticatedAdmin, getSupport)
router.route("/updateSupport").put(isAuthenticatedAdmin, updateSupportStatus)
router.route("/search").get(isAuthenticatedAdmin, searchSupportByTicketNumber)


router.route("/:id")
    .delete(isAuthenticatedAdmin, deleteSupportTitle)
    .put(isAuthenticatedAdmin, updateSupportTitle);

router.route("/single-title/:id").get(isAuthenticatedAdmin, getSingleSupportTitle)










export default router