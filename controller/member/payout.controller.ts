// admin.ts

import { NextFunction, Request, Response } from "express";
import { CustomRequest } from "../../middleware/auth";

import {
  PayoutStatus,
  Prisma,
  PrismaClient
} from "@prisma/client";
import catchAsyncError from "../../middleware/catchAsyncError";
import ErrorHandler from "../../utils/errorhandler";

enum SortBy {
  CREATED_AT = "created_at",
}

enum SortOrder {
  ASC = "asc",
  DESC = "desc",
}

// enum PayoutStatus {
//   pending,
//   approved,
//   rejected
// }

const prisma = new PrismaClient(); // Initialize PrismaClient

export const getPayouts = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const page = parseInt(req.query.page as string, 10) || 1;
    const itemsPerPage = parseInt(req.query.perpage as string, 10) || 20;
    const status =req.query.status
    const validSortOrderValues = ["asc", "desc"]; // Define valid sortOrder values

    const sortOrderParam = (req.query.sortOrder as string) || "asc"; // Default to "asc" if sortOrder is not provided
    try {
      // if (!validSortOrderValues.includes(sortOrderParam)) {
      //   throw next(new ErrorHandler("Invalid sortOrder parameter", 500));
      // }

      // Assuming you have a valid property name for sorting like 'created_at'
      const sortByParam = (req.query.sortBy as string) || "created_at";

      const orderBy = {
        [sortByParam]: sortOrderParam,
      };

      let filter: Prisma.payoutHistoryWhereInput = {};
    

      if (req.query.status) {
        filter = {
          status: { equals: req.query.status as PayoutStatus },
        };
      }

      const totalCount = await prisma.payoutHistory.count({ where: filter });
      const offset = (page - 1) * itemsPerPage;

      const result = (await prisma.payoutHistory.findMany({
        skip: offset,
        take: itemsPerPage,
        where: filter,
        orderBy,
        include: {
          Member: {
            select: {
              full_name: true,
              profile_picture: true,
              Contact_no:true,
              email_id:true
            },
          },
        },
      })) as any;

      const totalPages = Math.ceil(totalCount / itemsPerPage);

      res.status(200).json({
        success: true,
        message: "Payout details fetched successfully",
        data: {
          values: result,
          totalPages,
        },
      });
    } catch (error) {
      console.error("Payout details fetch failed:", error);
      res.status(500).json({
        success: false,
        message: "Payout details fetch failed",
        error: error,
      });
    }
  }
);



export const UpdatePayoutStatus = catchAsyncError(
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    try {
      const { status, transaction_id } = req.body;
      if (!status) {
        throw next(new ErrorHandler("Please specify status", 500));
      }
      const paymentID = req.params.id;
      if (!paymentID) {
        throw next(new ErrorHandler("Please specify paymentID", 500));
      }

      const payoutData = await prisma.payoutHistory.findUnique({
        where: { id: paymentID }
      });

      if (!payoutData) {
        throw next(new ErrorHandler("Invalid Payment Id", 500));
      }

      if (Object.values(PayoutStatus).includes(status)) {
        if (status === "approved") {
          const currentPayoutRequest: number = parseFloat(payoutData.amount.toString());
          const memberId: string = String(payoutData.member_id); // Convert memberId to string

          // Fetch current ecommerceWithdraw amount associated with the member
          const memberInfo = await prisma.memberInfo.findUnique({
            where: { member_id: memberId },
            select: {
              ecommerceWithdraw: true,
              withdrawl:true,
              balance:true,
              Member: true // Include related member details
            }
          });

          if (!memberInfo) {
            throw next(new ErrorHandler("MemberInfo not found", 500));
          }

      if(!memberInfo?.Member?.is_sales_person){
        let currentEcommerceWithdraw: number = parseFloat(memberInfo.ecommerceWithdraw?.toString() || "0");

        // Calculate new ecommerceWithdraw amount
        const newEcommerceWithdraw = currentEcommerceWithdraw + currentPayoutRequest;

        // Update ecommerceWithdraw in MemberInfo table
        await prisma.memberInfo.update({
          where: { member_id: memberId },
          data: { ecommerceWithdraw: newEcommerceWithdraw } // Convert to string
        });
      }

      if(memberInfo?.Member?.is_sales_person){
        const  currentWalletBalance:number = Number(memberInfo.balance)
        const  newWalletBalance:number = currentWalletBalance - Number(currentPayoutRequest);
        const  updatedWithdrawlBalance:number = Number(memberInfo.withdrawl) + Number(currentPayoutRequest);

        await prisma.memberInfo.update({
          where: { member_id: memberId },
          data: { balance: newWalletBalance, withdrawl: updatedWithdrawlBalance } // Convert to string
        });
        
      }

      }

        const updateData = await prisma.payoutHistory.update({
          where: { id: paymentID },
          data: {
            status: status,
            transction_id: transaction_id || "", // Corrected to transactionId
            paid_at: status === "approved" ? new Date() : null // Set the paidAt field only if status is 'approved'
          },
        });

        if (!updateData) {
          throw new ErrorHandler("Record not found", 404);
        }

        res.status(200).json({
          success: true,
          message: "Updated Successfully",
          data: updateData
        });
      } else {
        throw next(new ErrorHandler("Invalid Status", 500));
      }
    } catch (error) {
      next(error);
    }
  }
);





export const getPayoutHistory = catchAsyncError(
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const itemsPerPage = req.query.perpage
      ? parseInt(req.query.perpage as string)
      : 10;
    try {
      const offset = (page - 1) * itemsPerPage;

      const sortByParam = (req.query.sortBy as string) || "created_at";
      const sortOrderParam = (req.query.sortOrder as string) || "asc"; // Default to "asc" if sortOrder is not
      const member_id=req.member_id
      const orderBy = {
        [sortByParam]: sortOrderParam,
      };

      let filter: Prisma.payoutHistoryWhereInput = {member_id:member_id};
      


      if (req.query.status) {
        filter = {
          status: { equals: req.query.status as PayoutStatus },
        };
      }

      const totalCount = await prisma.payoutHistory.count({ where: filter });
      const totalPages = Math.ceil(totalCount / itemsPerPage);

      const data = (await prisma.payoutHistory.findMany({
        where: filter,
        skip: offset,
        take: itemsPerPage,
        include: {
          Member: {
            select: {
              full_name: true,
              profile_picture: true,
            },
          },
        },
      })) as any;
      res.status(200).json({
        success: true,
        message: "Fetched Detailed Sucessfully",
        data: {data,totalPages},
      });
    } catch (error) {
      console.error("fetching data failed:", error);
    }
  }
);

export const createPayoutRequest = catchAsyncError(
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    try {
      const { amount } = req.body;
      if (!amount) {
        throw next(new ErrorHandler("Please provide an amount", 400));
      }

      if (Number(amount) === 0) {
        throw next(
          new ErrorHandler("Cannot create a request for this amount", 400)
        );
      }


      const pendingRequests = await prisma.payoutHistory.findFirst({
        where: {
          AND: [
            { member_id: req.user.id },
            { status: "pending" }
          ]
        }
      });

      if (pendingRequests) {
        return res.status(400).json({
          success: false,
          message: "You have a pending payout request. Please wait for approval."
        });
      }

      // Step 1: Fetch total balance
      const orders = await prisma.order.findMany({
        where: {
          orderHistory: {
            sellerId: req.business_id
          }
        },
        select: {
          amount: true,
          quantity: true
        }
      });

      const totalEarnings = orders.reduce((acc, order) => {
        return acc + (order.amount * order.quantity);
      }, 0);

      const memberInfo = await prisma.memberInfo.findUnique({
        where: {
          member_id: req.member_id
        }
      });
      const ecommerceWithdraw = memberInfo?.ecommerceWithdraw|| 0;

      const totalBalance = totalEarnings - ecommerceWithdraw;

      // Step 2: Check if requested amount is less than or equal to total balance
      if (Number(amount) > totalBalance) {
        throw next(
          new ErrorHandler("Insufficient funds", 200)
        );
      }

      // Step 3: Create payout request
      const payoutData = await prisma.payoutHistory.create({
        data: {
          member_id: req.user.id,
          amount: amount,
          status: "pending",
        },
      });

      res.status(200).json({
        success: true,
        message: "Request submitted successfully",
        data: payoutData,
      });
    } catch (error) {
      next(error);
    }
  }
);

export const createSalesPayoutRequest = catchAsyncError(
  async (req:CustomRequest,res:Response,next:NextFunction)=>{
 try{
  const { amount } = req.body;

  if (!req.is_sales_person) {
    throw next(new ErrorHandler("You are not allowed to withdraw from the wallet because you are not a salesperson", 400));
  }

  if (!amount) {
    throw next(new ErrorHandler("Please provide an amount", 400));
  }

  if (Number(amount) === 0) {
    throw next(
      new ErrorHandler("Cannot create a request for this amount", 400)
    );
  }

  const pendingRequests = await prisma.payoutHistory.findFirst({
    where: {
      AND: [
        { member_id: req.user.id },
        { status: "pending" }
      ]
    }
  });

  if (pendingRequests) {
    return res.status(400).json({
      success: false,
      message: "You have a pending payout request. Please wait for approval."
    });
  }

  // fetch the wallet balance of this user 
  const memberInfo = await prisma.memberInfo.findUnique({
    where: {
      member_id: req.member_id
    }
  });

  if(!memberInfo){
    throw next(
      new ErrorHandler("Member Not Found", 404)
    );
  }

  const wallet_balance = Number(memberInfo.balance || 0);
  if(Number(amount) > wallet_balance){
    throw next(new ErrorHandler("Insufficient funds in your wallet", 400));
  }
  
  const payoutData = await prisma.payoutHistory.create({
    data: {
      member_id: req.user.id,
      amount: amount,
      status: "pending",
    },
  });
    res.status(200).json({
    success: true,
    message: "Request submitted successfully",
    data: payoutData,
  });
 }catch(error){
  next(error);
 }
  }
)


export default prisma;
