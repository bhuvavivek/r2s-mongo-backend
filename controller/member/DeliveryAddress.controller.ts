// admin.ts

import { Request, Response, NextFunction } from "express";
import { CustomRequest, } from "../../middleware/auth";

import {
  PrismaClient,
  
} from "@prisma/client"; 
import ErrorHandler from "../../utils/errorhandler"; 
import catchAsyncError from "../../middleware/catchAsyncError";

const prisma = new PrismaClient(); 

export const addDeliveryAddress = catchAsyncError(
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    try {
      const { address_line_1, address_line_2, city,country, state, pincode, type ,name,phone} =
        req.body;

      if (!address_line_1 || !city || !state ||!country || !pincode || !type || !phone || !name) {
        throw new ErrorHandler("All Field Are required", 400);
      }

      if (type != "HOME" && type != "OFFICE") {
        throw new ErrorHandler("All Field Are required", 400);
      }

      const address_type =
        type === "HOME" ? "home_delivery" : "office_delivery";

      const member_id = req.member_id;
      console.log("this is business", member_id);

      const memberExist = await prisma.member.findFirst({
        where: { id: member_id },
      });
      console.log(memberExist)

      const phoneInt = parseInt(phone)

      if (!memberExist) {
        throw next(new ErrorHandler("Member  not found", 400));
      } else {
        const AddressData = await prisma.memberAddress.create({
          data: {
            member_id: member_id,
            address_line_1: address_line_1,
            address_line_2: address_line_2 || null,
            city: city,
            state: state,
            pincode: pincode,
            country: country,
            type: address_type,
            order_reciver_mobile_number:phone,
            order_reciver_name:name

          },
        });

        console.log("Address Data:", AddressData);

        res.status(200).json({
          success: true,
          message: "Services Picture Added Successfully",
          data: AddressData,
        });
      }
    } catch (error) {
      next(error);
    }
  }
);

export const updateDeliveryAddress = catchAsyncError(
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    try {
      const { address_line_1, address_line_2, city, state, pincode, type,phone ,name } =
        req.body;

      const addressId = req.params.id;

      if (!address_line_1 || !city || !state || !pincode || !type || !phone || !name) {
        throw new ErrorHandler("All Field Are required", 400);
      }

      if (type != "HOME" && type != "OFFICE") {
        throw new ErrorHandler("All Field Are required", 400);
      }

      const address_type =
        type === "HOME" ? "home_delivery" : "office_delivery";

      const addressExist = await prisma.memberAddress.findUnique({
        where: { id: addressId },
      });

     

      if (!addressExist) {
        throw next(new ErrorHandler("Address not found", 400));
      } else {

        const  phoneInt = parseInt(phone)
        console.log(phoneInt)
        const productData = await prisma.memberAddress.update({
          where: {
            id: addressId,
          },
          data: {
            address_line_1: address_line_1,
            address_line_2: address_line_2 || null,
            city: city,
            state: state,
            pincode: pincode,
            type: address_type,
            order_reciver_mobile_number:phone,
            order_reciver_name:name
          },
        });

        console.log("Product Data:", productData);

        res.status(200).json({
          success: true,
          message: "Services Picture Added Successfully",
          data: productData,
        });
      }
    } catch (error) {
      next(error);
    }
  }
);

// export const handleProductPictureUpload = catchAsyncError(
//   async (req: CustomRequest, res: Response, next: NextFunction) => {
//     const productId = req.params.id;
//     const { images } = req.body;

//     if (images.length === 0) {
//       throw next(new ErrorHandler("Minimum one image is Required", 400));
//     }
//     try {

//       for (const image of images) {
//         const productExists = await prisma.pictures.create({
//           data: {
//             productKey: req.service_id,
//             image_url: image.link,
//             image_key:image.key
//           },
//         });
//       }
//       res.status(200).json({
//         success: true,
//         message: "Product Updated Successfully",
//       });
//     } catch (error) {
//       console.error("Payment details fetch failed:", error);
//       res.status(500).json({
//         success: false,
//         message: "Payment details fetch failed",
//         error: error,
//       });
//     }
//   }
// );

export const deleteDeliveryAddress = catchAsyncError(
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    const addressId = req.params.id;
    const memberId = req.member_id;
    try {
      const AddressExists = await prisma.memberAddress.findFirst({
        where: { id: addressId,member_id:memberId}
      });

      if (!AddressExists) {
        throw next(new ErrorHandler("Address not found", 400));
      }
      const AddressData = await prisma.memberAddress.update({
        where: {
          id: addressId,
        },
        data:{
            is_delete:true
        }
      });
      res.status(200).json({
        success: true,
        message: "Address deleted Successfully",
      });
    } catch (error) {
      console.error("Address details fetch failed:", error);
      res.status(500).json({
        success: false,
        message: "Address details fetch failed",
        error: error,
      });
    }
  }
);

export const getDeliveryAddress = catchAsyncError(
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    const member_id = req.member_id;

    try {
      const myAddressData = await prisma.memberAddress.findMany({
        where: {
          member_id: member_id,
          type: {
            in: ["home_delivery", "office_delivery"],
          },
          is_delete:false
        },
      });

      res.status(200).json({
        success: true,
        message: "Address details Fetched Successfully",
        data: myAddressData,
      });
    } catch (error) {
      console.error("Payment details fetch failed:", error);
      res.status(500).json({
        success: false,
        message: "Payment details fetch failed",
        error: error,
      });
    }
  }
);

export default prisma;
