// admin.ts

import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import { CustomadminRequest } from "../../middleware/auth";
import { PrismaClient } from "@prisma/client";
import ErrorHandler from "../../utils/errorhandler";
import SuccessHandler from "../../utils/sucessReply";
import catchAsyncError from "../../middleware/catchAsyncError";
import AdminService from "../../services/admin/Admin.services.";
import { GenerateSignature } from "../../utils/index";

const prisma = new PrismaClient();
const adminApiServices = new AdminService();

export const login = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;
    try {
      let user;
      user = await adminApiServices.read({ email: email });
      if (!user) {
        throw new ErrorHandler("Email or password is not valid", 400);
      }
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        throw new ErrorHandler("Email or password is not valid", 400);
      }
      const token = await GenerateSignature({ userID: user.id });

      SuccessHandler.sendSuccessResponse(res, "Login Successful", { token });

    } catch (error) {
      next(error);
    }
  }
);



export const updatingAdminDetail = catchAsyncError(
  async (req: CustomadminRequest, res: Response, next: NextFunction) => {
    const { name, contact } = req.body;
    try {
      const adminId = req.admin_id;
      const updateAdminDetail = await adminApiServices.update(adminId, {
        name: name,
        phone: contact,
      })
      SuccessHandler.sendSuccessResponse(res, "Admin details Update Successfully", { updateAdminDetail });

    } catch (error) {
      next(error);
    }
  }
);

export const updateAdminPicture = catchAsyncError(
  async (req: CustomadminRequest, res: Response, next: NextFunction) => {
    const adminId = req.admin_id;
    try {
      const {image, image_key } = req.body;
       const updateProfilePicture = await prisma.admin.update({
          where: { id: adminId },
          data: {
            profile_photo: image,
            profile_image_key: image_key,
          },
        });
      
      console.log(adminId);

      SuccessHandler.sendSuccessResponse(res, "Profile Picture update Successfully",updateProfilePicture);

    } catch (error) {
      next(error);
    }
  }
);

export const changePassword = catchAsyncError(
  async (req: CustomadminRequest, res: Response, next: NextFunction) => {
    const { password, current_password } = req.body;

    if (password.length < 6) {
      throw next(new ErrorHandler("Password Length Should be greater 6 ", 500));
    }

    const hashPassword = await bcrypt.hash(password, 10);
    const isSame = await bcrypt.compare(password, req.admin.password);

    if (isSame) {
      throw next(
        new ErrorHandler("New Password Should be different that older  ", 500)
      );
    }

    try {
      const isMatch = await bcrypt.compare(
        current_password,
        req.admin.password
      );

      if (!isMatch) {
        throw next(new ErrorHandler("Invalid current password ", 500));
      }

      const adminData = await prisma.admin.update({
        where: { id: req.admin_id },
        data: {
          password: hashPassword,
        },
      });
      res.status(200).json({
        success: true,
        message: "Password changed Successfully ",
      });
    } catch (error) {
      next(error);
    }
  }
);

export const getAdminprofile = catchAsyncError(
  async (req: CustomadminRequest, res: Response, next: NextFunction) => {
    const adminId = req.admin_id;
    console.log(adminId);
    try {
      const myProfiledata = await adminApiServices.read({ id: adminId });
      SuccessHandler.sendSuccessResponse(res, "Profile detail Fetched SucessFully", { myProfiledata });
    } catch (error) {
      next(error);
    }
  }
);
