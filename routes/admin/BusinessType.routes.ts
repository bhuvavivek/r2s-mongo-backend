import express from "express";
import {
    addBusinesstypeController,
    getBusinesstypecontroller,
    updateBusinesstypeController
} from "../../controller/admin/businessType.controller";
import { isAuthenticatedAdmin } from "../../middleware/auth";



const router = express.Router();


router.route("/").get(isAuthenticatedAdmin,getBusinesstypecontroller).post(isAuthenticatedAdmin,addBusinesstypeController);
router.put('/:id',isAuthenticatedAdmin,updateBusinesstypeController)

export default router;
