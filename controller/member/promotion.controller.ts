// admin.ts

import { NextFunction, Response } from "express";
import { CustomRequest, CustomadminRequest } from "../../middleware/auth";
// import { Decimal } from 'decimal.js';

import {
  PayoutStatus,
  Prisma,
  PrismaClient,
} from "@prisma/client"; // Import the PrismaClient
import catchAsyncError from "../../middleware/catchAsyncError";
import ErrorHandler from "../../utils/errorhandler"; // Import your custom error handler if available

const prisma = new PrismaClient(); // Initialize PrismaClient



export const addPromotionRequest = catchAsyncError(
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    try {
      const { poster, poster_key } = req.body;

     

      if (!poster || !poster_key) {
        throw new ErrorHandler("Poster and poster key are required", 400);
      }

      const businessId = req.business_id;
      const memberId = req.member_id;

      // Check member's balance
      const memberInfo = await prisma.memberInfo.findFirst({
        where: {
          member_id: memberId,
        },
      });

      if (!memberInfo) {
        throw new ErrorHandler("Member information not found", 404);
      }

   
      // Fetch promotion amount from promotionAmount model
      const promotionAmountData = await prisma.promotionAndMembershipAmount.findFirst({
        orderBy: { id: 'desc' }, // Assuming there's only one record or you want the first one
      });

      const currentWalletBalance = memberInfo.balance;
      const withdrawAmount = memberInfo.withdrawl
      const promotionAmountByAdmin = promotionAmountData?.promotionAmount;
      const currentWalletBalanceNumber = Number(currentWalletBalance);
      const currentWithdrawlNumber = Number(withdrawAmount);

      // Check if there are any existing promotion requests associated with the business ID
      const existingPendingRequests = await prisma.promotionRequest.findFirst({
        where: {
          business_id: businessId,
          status: 'pending'
        }
      });

      if (existingPendingRequests) {
        return res.status(203).json({ Message: "Your previous promotion request is pending. Please wait for it to be approved or rejected." });
      }

      let promotionAmount: number = 0; // Default promotion amount

      // Check if there are existing promotion requests with an approved status
      const existingPromotionRequests = await prisma.promotionRequest.findMany({
        where: {
          business_id: businessId,
          status: 'approved' // Check for approved status
        }
      });

      if (existingPromotionRequests.length > 0) {
        // If there are existing promotion requests, use the promotion amount from the admin
        if (promotionAmountByAdmin) {
          promotionAmount = Number(promotionAmountByAdmin);
        } else {
          throw new ErrorHandler("Promotion amount data not found", 500); // Throw an error if promotion amount data is missing
        }

        // Check if member has sufficient balance
        if (currentWalletBalanceNumber < promotionAmount) {
          return res.status(400).json({ Message: "Insufficient balance" });
        }
      }

      // Calculate updated balance
      const updateBalance = currentWalletBalanceNumber - promotionAmount;
      const updateWithdrawAmount = currentWithdrawlNumber + promotionAmount;

      // Create promotion request with calculated promotion amount
      const promotionRequest = await prisma.promotionRequest.create({
        data: {
          business_id: businessId,
          poster: poster,
          poster_key: poster_key,
          amount: promotionAmount,
        },
      });

      // Update member's balance
      const updatedMemberBalance = await prisma.memberInfo.update({
        where: {
          member_id: memberId
        },
        data: {
          balance: updateBalance,
          withdrawl: updateWithdrawAmount
        }
      });

      res.status(200).json({
        success: true,
        message: "Promotion Request Added Successfully",
        data: promotionRequest,
        updatedMemberBalance,
      });
    } catch (error) {
      next(error);
    }
  }
);

enum SortBy {
  CREATED_AT = "created_at",
  UPDATED_AT = "updated_at",
}

enum SortOrder {
  ASC = "asc",
  DESC = "desc",
}

export const getMyPromotion = catchAsyncError(
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const businessId = req.business_id

    //  console.log(first)
    const itemsPerPage = req.query.perpage
      ? parseInt(req.query.perpage as string)
      : 20;

    const validSortOrderValues = ["asc", "desc"]; // Define valid sortOrder values
    const validSortByValues = ["created_at", "updated_at", "status"]; // Define valid sortBy values

    const sortOrderParam = (req.query.sortOrder as string) || "asc";
    if (!validSortOrderValues.includes(sortOrderParam)) {
      throw new Error("Invalid sortOrder parameter");
    }
    const sortOrder = sortOrderParam as SortOrder;

    const sortByParam = (req.query.sortBy as string) || "created_at";
    if (!validSortByValues.includes(sortByParam)) {
      throw new Error("Invalid sortBy parameter");
    }
    const sortBy = sortByParam as SortBy;

    let filter: Prisma.promotionRequestWhereInput = {};
    if (req.query.status) {
      filter = {
        status: { equals: req.query.status as PayoutStatus },
        business_id: req.business_id,
      };
    }

    try {
      const totalCount = await prisma.promotionRequest.count({
        where: filter,
      });

      const offset = (page - 1) * itemsPerPage;

      const promotionData = await prisma.promotionRequest.findMany({
        skip: offset,
        take: itemsPerPage,
        where: {
          business_id: businessId
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
      });

      const totalPages = Math.ceil(totalCount / itemsPerPage);

      res.status(200).json({
        success: true,
        message: "Promotion detail Fetched Successfully",
        data: { promotionData, totalPages },
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

export const getPromotion = catchAsyncError(
  async (req: CustomadminRequest, res: Response, next: NextFunction) => {
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const itemsPerPage = req.query.perpage
      ? parseInt(req.query.perpage as string)
      : 20;

    const validSortOrderValues = ["asc", "desc"]; // Define valid sortOrder values
    const validSortByValues = ["created_at", "updated_at", "status"]; // Define valid sortBy values

    const sortOrderParam = (req.query.sortOrder as string) || "desc";
    if (!validSortOrderValues.includes(sortOrderParam)) {
      throw new Error("Invalid sortOrder parameter");
    }
    const sortOrder = sortOrderParam as SortOrder;

    const sortByParam = (req.query.sortBy as string) || "created_at";
    // if (!validSortByValues.includes(sortByParam)) {
    //   throw new Error("Invalid sortBy parameter");
    // }
    const sortBy = sortByParam as SortBy;

    let filter: Prisma.promotionRequestWhereInput = {};
    if (req.query.status) {
      filter = {
        status: { equals: req.query.status as PayoutStatus },
      };
    }

    try {
      const totalCount = await prisma.promotionRequest.count({
        where: filter,
      });

      const offset = (page - 1) * itemsPerPage;

      const promotionData = await prisma.promotionRequest.findMany({
        skip: offset,
        take: itemsPerPage,
        where: filter,
        orderBy: {
          [sortBy]: sortOrder,
        },
        include:{
          Business_Profile:{
            select:{
              business_logo:true,
              bussiness_name:true,
              Member:{
                select:{
                  full_name:true,
                  email_id:true,
                  Contact_no:true
                }
              }
            }
          }
        }
      });

      const totalPages = Math.ceil(totalCount / itemsPerPage);

      res.status(200).json({
        success: true,
        message: "Payment details Fetched Successfully",
        data: { promotionData, totalPages },
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

export const addPromotionAmount = catchAsyncError(
  async (req: CustomadminRequest, res: Response, next: NextFunction) => {
    // Extract amount from request body
    const { promotionAmount,membershipAmount, referallAmount } = req.body;

    try {
 
      const firstRecord = await prisma.promotionAndMembershipAmount.findFirst();

      // Create a new promotion amount entry in the database
      const createdPromotion = await prisma.promotionAndMembershipAmount.create({
        data: {
         promotionAmount : promotionAmount,
         membershipAmount:membershipAmount,
         referallAmount:firstRecord?.referallAmount || referallAmount
          // Include any other relevant data for creating a promotion amount
        },
      });

      res.status(201).json({
        success: true,
        message: "Promotion amount added successfully",
        data: createdPromotion,
      });
    } catch (error) {
      console.error("Failed to add promotion amount:", error);
      res.status(500).json({
        success: false,
        message: "Failed to add promotion amount",
        error: error,
      });
    }
  }
);

export const updatePromotionAmount = catchAsyncError(
  async (req: CustomadminRequest, res: Response, next: NextFunction) => {
    const promotionId = "bf546846-6163-40ce-941e-2fe433077c13"; // Assuming promotionId is provided in URL params
    const { amount } = req.body;

    try {
      // Check if the promotion with the given ID exists
      const existingPromotion = await prisma.promotionAndMembershipAmount.findUnique({
        where: { id: promotionId },
      });

      if (!existingPromotion) {
        return res.status(404).json({
          success: false,
          message: "Promotion not found",
        });
      }

      // Update the promotion amount in the database
      const updatedPromotion = await prisma.promotionAndMembershipAmount.update({
        where: { id: promotionId },
        data: { promotionAmount: amount },
      });

      res.status(200).json({
        success: true,
        message: "Promotion amount updated successfully",
        data: updatedPromotion,
      });
    } catch (error) {
      console.error("Failed to update promotion amount:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update promotion amount",
        error: error,
      });
    }
  }
);



export const getPromotionAmount = catchAsyncError(
  async (req: CustomadminRequest, res: Response, next: NextFunction) => {
    try {
      // Fetch all promotion amounts from the database
      const promotionAmounts = await prisma.promotionAndMembershipAmount.findMany({
        select:{
          promotionAmount:true
        }
      });

      res.status(200).json({
        success: true,
        message: "Promotion amounts fetched successfully",
        data: promotionAmounts,
      });
    } catch (error) {
      console.error("Failed to fetch promotion amounts:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch promotion amounts",
        error: error,
      });
    }
  }
);




export const getCurrentPromotion = catchAsyncError(
  async (req: CustomadminRequest, res: Response, next: NextFunction) => {
    try {
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setTime(twentyFourHoursAgo.getTime() - 24 * 60 * 60 * 1000); // 24 hours ago

      // Update promotions that are no longer active
      await prisma.promotion.updateMany({
        where: {
          from: { lte: twentyFourHoursAgo },
          is_active: true,
          is_deleted: false,
        },
        data: {
          is_deleted: true,
        },
      });

      // Also update related promotionRequests
      const updatedPromotionIds = await prisma.promotion.findMany({
        where: {
          is_deleted: true,
        },
        select: {
          promotion_id: true,
        },
      });

      const promotionIds =  updatedPromotionIds.map(promotion => promotion.promotion_id);

      await prisma.promotionRequest.updateMany({
        where: {
          id: { in: promotionIds },
        },
        data: {
        is_deleted: true,
     status:'expired'
        },
      });

      const currentTime = new Date();
      const activePromotion = await prisma.promotion.findFirst({
        where: {
          from: { lte: currentTime },
          to: { gte: currentTime },
          is_active: true,
          is_deleted: false,
        },
      });

      if (activePromotion) {
        // If there is an active promotion, fetch promotion data based on current time
        const page = req.query.page ? parseInt(req.query.page as string) : 1;
        const itemsPerPage = req.query.perpage ? parseInt(req.query.perpage as string) : 10;

        const totalCount = await prisma.promotionRequest.count({
          where: {
            status: "approved",
            is_deleted: false,
          },
        });

        const offset = (page - 1) * itemsPerPage;

        const promotionData = await prisma.promotionRequest.findMany({
          skip: offset,
          take: itemsPerPage,
          where: {
            status: "approved",
            is_deleted: false,
          },
          orderBy: {
            created_at: "desc", // You can adjust the sorting as needed
          },
        });

        const totalPages = Math.ceil(totalCount / itemsPerPage);

        res.status(200).json({
          success: true,
          message: "Promotion details fetched successfully",
          data: { promotionData, totalPages },
        });
      } else {
        // If there's no active promotion, return all previous promotion data
        const defaultPromotion = await prisma.defaultPromotion.findMany({
          orderBy: {
            created_at: "desc", // You can adjust the sorting as needed
          },
        });

        res.status(200).json({
          success: true,
          message: "No active promotions found, returning all default promotion data",
          data: { promotionData: defaultPromotion, totalPages: 0 },
        });
      }
    } catch (error) {
      console.error("Promotion details fetch failed:", error);
      res.status(500).json({
        success: false,
        message: "Promotion details fetch failed",
        error: error,
      });
    }
  }
);




// export const getCurrentPromotion = catchAsyncError(
//   async (req: CustomadminRequest, res: Response, next: NextFunction) => {
//     const page = req.query.page ? parseInt(req.query.page as string) : 1;
//     const itemsPerPage = req.query.perpage
//       ? parseInt(req.query.perpage as string)
//       : 20;

//     const currentTime = new Date();

//     if (req.query.active !== "true" && req.query.active !== "false") {
//         // If type is not a string or value is not "true" or "false", throw an error
//         throw new Error("Invalid active parameter");
//       }

//     let filter: Prisma.promotionWhereInput = {
//       from: {
//         lte: currentTime,
//       },
//       to: {
//         gte: currentTime,
//       },
//       is_active:true,
//     };

// if (req.query.active) {
//     // If req.query.status is present, add a new condition to the filter
//     filter = {
//       ...filter,  // Preserve existing conditions
//       is_active: req.query.active === "true" ? true : false,
//     };
//   }



//     try {
//       const totalCount = await prisma.promotion.count({
//         where: filter,
//       });

//       const offset = (page - 1) * itemsPerPage;

//       const result = await prisma.promotion.findFirst({
//         where: {
//           from: {
//             lte: currentTime,
//           },
//           to: {
//             gte: currentTime,
//           },
//           is_active: true,
//           is_deleted: false,
//         },
//       });

//       const totalPages = Math.ceil(totalCount / itemsPerPage);

//       res.status(200).json({
//         success: true,
//         message: "Payment details Fetched Successfully",
//         data: result,
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

export const updatePromotionRequest = catchAsyncError(
  async (req: CustomadminRequest, res: Response, next: NextFunction) => {
    try {
      const promotionRequestId = req.params.id;
      const { status } = req.body;

      // if (!status || !promotionRequestId) {
      //   throw new ErrorHandler("Image ID and URL are required", 400);
      // }

      const currentDate = new Date();
      const tomorrowDate = new Date(currentDate);
      tomorrowDate.setDate(currentDate.getDate() + 1); // Add 1 day to get tomorrow's date

      if (!Object.values(PayoutStatus).includes(status)) {
        throw new ErrorHandler("Invalid status", 400);
      }

      const promotionRequestData = await prisma.promotionRequest.findUnique({
        where: { id: promotionRequestId },
      });

      if (!promotionRequestData) {
        throw new ErrorHandler("Product image not found", 400);
      } else {
        if (promotionRequestData?.status === "approved") {
          throw new ErrorHandler("Promotion request already approved", 400);

        }

        const updatedStatus = await prisma.$transaction([
          prisma.promotionRequest.update({
            where: { id: promotionRequestId },
            data: {
              status: status,
              approved_by: req.admin_id,
              approved_at: currentDate,
            },
          }),
          // Add your second query here
          prisma.promotion.create({
            data: {
              promotion_id: promotionRequestId,
              from: currentDate.toISOString(), // Convert to ISO string for Datetime format
              to: tomorrowDate.toISOString(), // Convert to ISO string for Datetime format
            },
          }),
        ]);

        res.status(200).json({
          success: true,
          message: "Product Picture Updated Successfully",
          data: updatedStatus,
        });
      }
    } catch (error) {
      next(error);
    }
  }
);

// export const getCurrentPromtion = catchAsyncError(
//   async (req: CustomRequest, res: Response, next: NextFunction) => {
//     const productImageId = req.params.id;

//     try {
//       const productImageData = await prisma.promotion.findUnique({
//         where: { id: productImageId },
//       });

//       if (!productImageData) {
//         throw new ErrorHandler("Product Image ID is not valid", 400);
//       }

//       // const deleteImageRes = deleteImage(productImageData.image_key);


//       const deletedImage = await prisma.promotion.delete({
//         where: { id: productImageId },
//       });

//       if (!deletedImage) {
//         throw new ErrorHandler("Product image not delete", 400);
//       }
//       res.status(200).json({
//         success: true,
//         message: "Product Image Deleted Successfully",
//       });
//     } catch (error) {
//       next(error);
//     }
//   }
// );



export const addDefaultPromotion = catchAsyncError(
  async (req: CustomadminRequest, res: Response, next: NextFunction) => {
    try {

      const { poster_key, poster } = req.body;

      if (!poster || !poster_key) {
        res.status(401).json({ Message: "Please Provide all fields" })
      }


      const promotioData = await prisma.defaultPromotion.create({
        data: {
          poster: poster,
          poster_key: poster_key
        }
      })





      res.status(200).json({
        success: true,
        message: "Product Picture Updated Successfully",
        data: promotioData,
      });
    }
    catch (error) {
      next(error);
    }

  });


export const getDefaultPromotion = catchAsyncError(
  async (req: CustomadminRequest, res: Response, next: NextFunction) => {
    try {






      const promotioData = await prisma.defaultPromotion.findMany()





      res.status(200).json({
        success: true,
        message: "Product Picture fatched Successfully",
        data: promotioData,
      });
    }
    catch (error) {
      next(error);
    }

  });


export const deleteDefaultPromotion = catchAsyncError(
  async (req: CustomadminRequest, res: Response, next: NextFunction) => {
    try {


      const id = req.params.id




      const promotioData = await prisma.defaultPromotion.delete({
        where: {
          id: id
        }
      })





      res.status(200).json({
        success: true,
        message: "Product Picture deleted Successfully",
        data: promotioData,
      });
    }
    catch (error) {
      next(error);
    }

  });



export default prisma;
