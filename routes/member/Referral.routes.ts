import express from "express";
import {
    isAuthenticatedMember,
} from "../../middleware/auth";
import {
    getReferral,
} from "../../controller/member/auth.controller";


const router = express.Router();

router.route("/my").get(isAuthenticatedMember, getReferral);

export default router


// the bab=
