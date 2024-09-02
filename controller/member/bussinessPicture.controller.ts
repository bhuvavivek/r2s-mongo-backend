// admin.ts

import { Request, Response, NextFunction } from "express";
import { CustomRequest } from "../../middleware/auth";

import { PrismaClient, PictureType } from "@prisma/client";
import ErrorHandler from "../../utils/errorhandler";
import catchAsyncError from "../../middleware/catchAsyncError";

const prisma = new PrismaClient();

export const addBusinessPicture = catchAsyncError(
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    try {
      const { type, imageUrl, imageKey } = req.body;

      if (!type || !imageUrl || !imageKey) {
        throw new ErrorHandler("All fields are required", 400);
      }
      
      if (!Object.values(PictureType).includes(type as PictureType)) {
        throw new ErrorHandler("Invalid picture type", 400);
      }

      // Assuming business_id is available in req
      const businessId = req.business_id;

      // Check if business exists, you can use your method to find the business
      const businessExists = await prisma.businessProfile.findUnique({
        where: { id: businessId }
      });

      if (!businessExists) {
        throw new ErrorHandler("Business not found", 400);
      } else {
        const totalImages = await prisma.interiorExteriorImages.count({
          where: { business_id: businessId }
        });

        if (totalImages >= 9) {
          throw new ErrorHandler("You can add up to 9 images only", 400);
        }


        const productImageData = await prisma.interiorExteriorImages.create({
          data: {
            business_id: businessId,
            image_url: imageUrl,
            image_key: imageKey,
            type: type as PictureType
          }
        });

        res.status(200).json({
          success: true,
          message: "Bussiness Picture Added Successfully",
          data: productImageData,
        });
      }
    } catch (error) {
      next(error);
    }
  }
);

export const getBusinessPictures = catchAsyncError(
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    try {
      // Get query parameters for pagination and filtering
      const pageParam = req.query.page;
      const type = req.query.type;

      const page = (typeof pageParam === 'string' && parseInt(pageParam)) || 1; // Default to page 1
      const pageSize = 10; // Default page size
      const skip = (page - 1) * pageSize;

      // Ensure that the business_id exists
      const businessId = req.params.id;

      const whereCondition: any = { business_id: businessId };

      // If a valid picture type is specified, add it to the where condition
      if (type && Object.values(PictureType).includes(type as PictureType)) {
        whereCondition.type = type as PictureType;
      }

      // Fetch the total count of pictures for pagination
      const totalPictures = await prisma.interiorExteriorImages.count({
        where: whereCondition,
      });

      // Fetch the pictures with pagination
      const pictures = await prisma.interiorExteriorImages.findMany({
        where: whereCondition,
        skip,
        take: pageSize,
        orderBy: {
          Created_at: 'desc', // Order by Created_at in descending order
        },
      });

      res.status(200).json({
        success: true,
        message: "Business pictures fetched successfully",
        data: pictures,
        pagination: {
          currentPage: page,
          pageSize,
          totalResults: totalPictures,
          totalPages: Math.ceil(totalPictures / pageSize),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

export const updateBusinessPicture = catchAsyncError(
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    try {
      const productImageId = req.params.id;
      const { imageUrl, type } = req.body;

      if (!imageUrl || !type || !productImageId) {
        throw new ErrorHandler("All fields are required", 400);
      }

      if (!Object.values(PictureType).includes(type as PictureType)) {
        throw new ErrorHandler("Invalid picture type", 400);
      }

      const productImageData = await prisma.interiorExteriorImages.findUnique({
        where: { id: productImageId }
      });

      if (!productImageData) {
        throw new ErrorHandler("Product image not found", 400);
      } else {
        const updatedImage = await prisma.interiorExteriorImages.update({
          where: { id: productImageId },
          data: {
            image_url: imageUrl,
            type: type as PictureType
          }
        });

        res.status(200).json({
          success: true,
          message: "Business Picture Updated Successfully",
          data: updatedImage,
        });
      }
    } catch (error) {
      next(error);
    }
  }
);

export const deleteBusinessPicture = catchAsyncError(
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    const productImageId = req.params.id;

    try {
      const productImageData = await prisma.interiorExteriorImages.findUnique({
        where: { id: productImageId }
      });

      if (!productImageData) {
        throw next(new ErrorHandler("Image ID is not valid", 500));
      }
      const deletedImage = await prisma.interiorExteriorImages.delete({
        where: { id: productImageId }
      });

      res.status(200).json({
        success: true,
        message: "Image Deleted Successfully",
      });
    } catch (error) {
      next(error);
    }
  }
);



export default prisma;
