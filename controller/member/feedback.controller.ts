// admin.ts

import { Request, Response, NextFunction } from "express";
import { CustomRequest } from "../../middleware/auth";
import { PrismaClient, JobDetail, bussinessType } from "@prisma/client"; // Import the PrismaClient
import ErrorHandler from "../../utils/errorhandler"; // Import your custom error handler if available
import catchAsyncError from "../../middleware/catchAsyncError";

const prisma = new PrismaClient(); 

export const createFeedback = catchAsyncError(
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    try {
      console.log("Received request to create feedback");

      const { rating, comment, type } = req.body;
      const entityId = req.params.id;

      console.log("Rating:", rating);
      console.log("Comment:", comment);
      console.log("Type:", type);
      console.log("Entity ID:", entityId);

      if (!rating || !comment || !type || !entityId) {
        throw new ErrorHandler("All fields are required", 400);
      }

      const parsedRating = parseInt(rating, 10);

      if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
        throw new ErrorHandler(
          "Rating must be a valid integer between 1 and 5",
          400
        );
      }

      let idFields: { bussiness_id?: string | null, product_id?: string | null, service_id?: string | null } = {};

      switch (type) {
        case 'bussiness':
          idFields = { bussiness_id: entityId, product_id: null, service_id: null };
          break;
        case 'product':
          idFields = { bussiness_id: null, product_id: entityId, service_id: null };
          break;
        case 'service':
          idFields = { bussiness_id: null, product_id: null, service_id: entityId };
          break;
        default:
          throw new ErrorHandler("Invalid feedback type", 400);
      }

      console.log("ID Fields:", idFields);

      const data: any = {
        rating: parsedRating,
        comment: comment || null,
        type:type,
        member_id: req.member_id,
        ...idFields // Merge the ID fields into the main data object
      };

      const feedbackdata = await prisma.businessFeedback.create({
        data,
      });

      console.log("Feedback data:", feedbackdata);

      res.status(200).json({
        success: true,
        message: "Given Feedback Successful",
        data: feedbackdata,
      });
    } catch (error) {
      next(error);
    }
  }
);





export const getFeedback = catchAsyncError(
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    const { type, id } = req.query;

    if (!type || !id) {
      throw new ErrorHandler("All fields are required", 400);
    }

    try {
      const page = parseInt(req.query.page as string, 10) || 1;
      const itemsPerPage = parseInt(req.query.perpage as string, 10) || 10;
      const offset = (page - 1) * itemsPerPage;
      let whereCondition = {}; // Initialize an empty object to build the 'where' condition

      switch (type) {
        case "product":
          // If the type is 'product', filter by product_id
          whereCondition = { product_id: id };
          break;
        case "bussiness":
          // If the type is 'business', filter by bussiness_id
          whereCondition = { bussiness_id: id };
          break;
        case "service":
          // If the type is 'service', filter by service_id
          whereCondition = { service_id: id };
          break;
        default:
          throw new ErrorHandler("Invalid Type", 400);
      }

      const feedbackData = await prisma.businessFeedback.findMany({
        where: whereCondition,
        include: {
          Member: {
            select: {
              id: true,
              full_name: true,
              profile_picture: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
        skip: offset,
        take: itemsPerPage,
      });

      if (feedbackData.length === 0) {
        res.status(200).json({
          success: false,
          message: `No ${type} found associated with the provided id`,
        });
      } else {
        
        res.status(200).json({
          success: true,
          message: "Feedback details fetched successfully",
          data: feedbackData,
        });
      }
    } catch (error) {
      next(error);
    }
  }
);



export const daleteFeedback = catchAsyncError(
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    try {
      const feedbackId = req.params.id;
      

      if ( !feedbackId) {
        throw new ErrorHandler("All fields are required", 400);
      }



      const feedbackData = await prisma.businessFeedback.findUnique({
        where: { id: feedbackId },
      });

      if (!feedbackData) {
        throw new ErrorHandler("Feedback not Found", 400);
      } else {
        // Update the feedback with new values
        const updatedFeedback = await prisma.businessFeedback.delete({
          where: { id: feedbackId },
        
        });

        res.status(200).json({
          success: true,
          message: "Feedback deleted Successfully",
          data: updatedFeedback,
        });
      }
    } catch (error) {
      next(error);
    }
  }
);




export const getAverageRating = catchAsyncError(
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    try {
      const businessId = req.params.id;
  
      const feedbackEntries = await prisma.businessFeedback.findMany({
        where: {
          bussiness_id: businessId // Assuming your field name is 'bussiness_id'
        }
      });
  
      // Check if there are feedback entries
      if (feedbackEntries.length === 0) {
        return res.status(200).json({
          success: true,
          averageRating: 0 // Return 0 if there are no feedback entries
        });
      }
  
      // Calculate the total rating and count valid ratings
      let totalRating = 0;
      let validRatingsCount = 0;
      feedbackEntries.forEach(feedback => {
        const rating = parseFloat(String(feedback.rating)); // Convert rating to a string first
        if (!isNaN(rating)) {
          totalRating += rating;
          validRatingsCount++;
        }
      });
  
      // Check if there are valid ratings
      if (validRatingsCount === 0) {
        return res.status(200).json({
          success: true,
          averageRating: 0 // Return 0 if there are no valid ratings
        });
      }
  
      // Calculate the average rating
      const averageRating = totalRating / validRatingsCount;
  
      // Return the average rating in the API response
      res.status(200).json({
        success: true,
        averageRating: averageRating.toFixed(2) // Round to 2 decimal places
      });
    } catch (error) {
      next(error);
    }
  }
);



export default prisma;
