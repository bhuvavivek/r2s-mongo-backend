import express from "express";
import { isAuthenticatedAdmin } from "../../middleware/auth";
import {
  fetchMemberProfile,
  updateMemberStatus,
  getMembersProfiles,
  searchMember,
  addBusinessType,
  getAllBusinessTypes,
  getSingleBusinessType,
  deleteBusinessType,
} from "../../controller/admin/member.controller";
import { getBusinessSearch,getAllMemberProfile } from "../../validations/admin.validation";


const router = express.Router();


router.route("/").get(isAuthenticatedAdmin, getMembersProfiles);
router.route("/type").post(isAuthenticatedAdmin, addBusinessType);
router.route("/type").get( getAllBusinessTypes);
router.route("/type/:id").get( getSingleBusinessType);
router.route("/type/:id").delete( deleteBusinessType);


router.route("/search").get(getBusinessSearch,isAuthenticatedAdmin, searchMember);



export default router;
