import express from "express";
import {
  fetchMemberProfile,
  getMembersProfiles,
  searchMember,
  updateMemberStatus,
} from "../../controller/admin/member.controller";
import { updatePersonalDetail, updatingAddressDetail, updatingBankDetail, updatingBusinessDetail, updatingBussinessAddressDetail, updatingMemeberDetail, verifyingBussinessUpdateData, verifyingUpdateData } from "../../controller/member/business.controller";
import { getMyproducts } from "../../controller/member/Product.controller";
import { getMyService } from "../../controller/member/Services.controller";
import { updateSocialLinks } from "../../controller/member/socialLinks.controller";
import { isAuthenticatedAdmin } from "../../middleware/auth";
import { getAllMemberProfile, getSingleMember, putSingleMember } from "../../validations/admin.validation";

const router = express.Router();


router.route("/search").get(getAllMemberProfile,isAuthenticatedAdmin, searchMember);

router
  .route("/:memberId")
  .get(getSingleMember,isAuthenticatedAdmin, fetchMemberProfile)
  .patch(putSingleMember,isAuthenticatedAdmin, updateMemberStatus);

router.route("/").get(getAllMemberProfile,isAuthenticatedAdmin, getMembersProfiles);

router.route('/business/:memberId').put(isAuthenticatedAdmin,verifyingBussinessUpdateData,updatingBusinessDetail,updatingBussinessAddressDetail);
router.route('/update-profile/:memberId').put(isAuthenticatedAdmin,verifyingUpdateData,updatingMemeberDetail,updatingBankDetail , updatingAddressDetail)
router.route('/social/:memberId').put(isAuthenticatedAdmin,updateSocialLinks)
router.route('/personal/:memberId').put(isAuthenticatedAdmin,updatePersonalDetail)
router.route('/product/:memberId').get(isAuthenticatedAdmin,getMyproducts)
router.route('/service/:memberId').get(isAuthenticatedAdmin,getMyService)

// router.route("/delete-member-account/:id").delete(isAuthenticatedAdmin, deleteMemberAccount);


export default router;