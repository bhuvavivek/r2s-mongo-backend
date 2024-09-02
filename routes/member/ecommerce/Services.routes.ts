import express from "express";


// import {login} from "../admin/controller"
import {
  isAuthenticatedMember,
} from "../../../middleware/auth";

import {
  addServices,
  bookedByUser,
  bookService,
  deleteService,
  getBusinessService,
  getMyService,
  getSingleService,
  getTopRatedService,
  myBookedService,
  SearchServices,
  updateService,
  updateServiceStatus
} from "../../../controller/member/Services.controller";


const router = express.Router();

router.route("/add").post(isAuthenticatedMember, addServices);
router.route("/book/:id").post(isAuthenticatedMember, bookService);
router.route("/booking").get(isAuthenticatedMember, myBookedService);
router.route("/me").get(isAuthenticatedMember, bookedByUser);
router.route("/search").get(isAuthenticatedMember, SearchServices);
router.patch('/booking/:bookingId/status',updateServiceStatus)


router.route("/").get(isAuthenticatedMember, getMyService);

router.route("/business/:id").get(isAuthenticatedMember, getBusinessService);

router
  .route("/top/rated")
  .get(isAuthenticatedMember, getTopRatedService);


router.route("/:id").get(isAuthenticatedMember, getSingleService).delete(isAuthenticatedMember, deleteService).put(isAuthenticatedMember, updateService);

export default router;
