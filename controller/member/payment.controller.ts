// admin.ts

import {
  PaymentStatus,
  Prisma,
  PrismaClient
} from "@prisma/client"; // Import the PrismaClient
import crypto from "crypto";
import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import Razorpay from "razorpay";
import { CustomRequest, CustomadminRequest } from "../../middleware/auth";
import catchAsyncError from "../../middleware/catchAsyncError";
import ErrorHandler from "../../utils/errorhandler"; // Import your custom error handler if available
import { updateSingleBalanceWithReferal } from "../common";
// import {  } from "../test";
// import {
//   generateMemberId,
//   generateReferralCode,
//   uploadImageToCloudinary,
// } from "../common/controller";
// import cloudinary from "cloudinary";

interface RegistrationRequest extends Request {
  refereedData: any;
}

enum SortBy {
  CREATED_AT = "created_at",
  UPDATED_AT = "updated_at",
}

enum SortOrder {
  ASC = "asc",
  DESC = "desc",
}

const razorpayApiKey = process.env.RAZORPAY_API_ID;
const razorpayApiSecret = process.env.RAZORPAY_API_SECRECT;

if (!razorpayApiKey || !razorpayApiSecret) {
  throw new Error("Razorpay API credentials are not provided");
}

var instance = new Razorpay({
  key_id: razorpayApiKey,
  key_secret: razorpayApiSecret,
});

const prisma = new PrismaClient(); // Initialize PrismaClient

export const getPayments = catchAsyncError(
  async (req: RegistrationRequest, res: Response, next: NextFunction) => {
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
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

    let filter: Prisma.paymentHistoryWhereInput = {};
    if (req.query.status) {
      filter = {
        status: { equals: req.query.status as PaymentStatus },
      };
    }

    try {
      const totalCount = await prisma.paymentHistory.count({
        where: filter,
      });

      const offset = (page - 1) * itemsPerPage;

      const data = await prisma.paymentHistory.findMany({
        skip: offset,
        take: itemsPerPage,
        where: filter,
        orderBy: {
          [sortBy]: sortOrder,
        },
        include:{
          Member:{
            select:{
              full_name:true,
              email_id:true,
              profile_picture:true,
              Contact_no:true 
            }
          }
        }
      });

            // Convert amount from paisa to INR
            const convertedData = data.map((payment) => ({
              ...payment,
              amount: Number(payment.amount) / 100,
            }));

      const totalPages = Math.ceil(totalCount / itemsPerPage);

      res.status(200).json({
        success: true,
        message: "Payment details Fetched Successfully",
        data: { data:convertedData, totalPages },
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


export const updateMembershipAmount = catchAsyncError(
  async (req: RegistrationRequest, res: Response, next: NextFunction) => {

  
   
    try {

      const id = "bf546846-6163-40ce-941e-2fe433077c13"
      const {membershipAmount} = req.body
      if(!membershipAmount){
        res.status(400).json({message:"please enter membership amount"})
      }
      
      const amount =  await prisma.promotionAndMembershipAmount.update({
        where:{
          id:id
        },
        data:{
          membershipAmount:membershipAmount
        }
      })

     

      res.status(200).json({
        success: true,
        message: "Membership Amount  updated Successfully",
        data: { amount },
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


export const getMembershipAmount = catchAsyncError(
  async (req: CustomadminRequest, res: Response, next: NextFunction) => {
    try {
      // Fetch all promotion amounts from the database
      const membershipAmount = await prisma.promotionAndMembershipAmount.findMany({
        select:{
          membershipAmount:true
        }
      });

      res.status(200).json({
        success: true,
        message: "Membership  amounts fetched successfully",
        data: membershipAmount,
      });
    } catch (error) {
      console.error("Failed to fetch membership amounts:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch promotion amounts",
        error: error,
      });
    }
  }
);




export const UpdatePaymentStatus = catchAsyncError(
  async (req: CustomadminRequest, res: Response, next: NextFunction) => {
    try {
      const { status } = req.body;
      const paymentID = req.params.id;
      const isPremium = req.isPremium;
      const validUpto = req.validUpto;
      const member_id = req.member_id;
      if (status === "pending" || status === "rejected") {
   
        const updateData = await prisma.paymentHistory.update({
          where: { id: paymentID },
          include: {
            Member: {
              select: {
                profile_picture: true,
                full_name: true
              }
            }
          },
          data: {
            status: status,
          },
        });

        res.status(200).json({
          success: true,
          message: "Updated SucessFully",
          data: updateData,
        });
      } else {

        // console.log(referalData,"this is referall Data")

        const updateData = await prisma.paymentHistory.update({
          where: { id: paymentID },
          include: {
            Member: {
              select: {
                profile_picture: true,
                full_name: true
              }
            }
          },
          data: {
            status: status,
          },
        });

       await  UpdateMemberOnPayment(isPremium, validUpto, member_id);
        await UpdateReferOnPayment(member_id)
        await updateSingleBalanceWithReferal(member_id)
        // updateAllBalances()

        res.status(200).json({
          success: true,
          message: "Updated SucessFully",
          data: updateData,
        });
      }
    } catch (error) {
      next(error);
    }
  }
);

async function UpdateMemberOnPayment(
  isPremium: boolean,
  validUpto: Date | null,
  member_id: string
) {
  if (isPremium) {
    console.log(
      "user is Already Premium Now i am updating his Valid Upto to One year Plus"
    );

    if (validUpto) {
     
      const validUptoDate = new Date(validUpto);
      validUptoDate.setFullYear(validUptoDate.getFullYear() + 1);
      await prisma.member.update({
        where: { id: member_id },
        data: {
          Valid_upto: validUptoDate // Assigning the updated date to the Valid_upto field
        }
      });
    } else {
      console.log("ValidUpto date is null or undefined.");
      // Handle the case where the existing date is null or undefined
    }
  }
  else {
    console.log(
      "user is Not Premium Now i am updating his Valid Upto to One year Plus"
    );
    const currentDate = new Date();
    const validUptoDate = new Date(currentDate);
    validUptoDate.setFullYear(validUptoDate.getFullYear() + 1);
    await prisma.member.update({
      where: { id: member_id },
      data: {
        Valid_upto: validUptoDate, // Assigning JavaScript Date object
        is_premium: true,
      }
    });
  }
}

async function UpdateReferOnPayment(
  member_id: string
) {
  console.log("UpdateReferOnPayment completed");
  const data = await prisma.referralTable.updateMany({
    where: { referred_to: member_id },
    data: {
      status: 'approved'
    }
  })
  return data
}

export const validatingPaymentInfo = catchAsyncError(
  async (req: CustomadminRequest, res: Response, next: NextFunction) => {
    try {
      const { status } = req.body;

      if (!status) {
        throw next(new ErrorHandler("Please Specify Status ", 500));
      }
      const paymentID = req.params.id;
      if (!paymentID) {
        throw next(new ErrorHandler("Please Specify paymentID ", 500));
      }
      if (!Object.values(PaymentStatus).includes(status)) {
        throw next(new ErrorHandler("Invalid Status", 500));
      }
      const paymentData = await prisma.paymentHistory.findUnique({
        include: {
          Member: true,
        },
        where: { id: paymentID },
      });
      if (!paymentData) {
        throw next(new ErrorHandler("Invalid Payment Id ", 500));
      }
      if (paymentData.status === "approved") {
        throw next(new ErrorHandler("Status Is already Approved and Can Not be Edited Now", 500));
      }
      req.isPremium = paymentData.Member.is_premium;
      req.validUpto = paymentData.Member.Valid_upto;
      req.member_id = paymentData.member_id
      console.log("passed through all validations");
      next();
    } catch (error) {
      next(error);
    }
  }
);

export const UpdateValidUpto = catchAsyncError(
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    try {
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const itemsPerPage = req.query.perpage
        ? parseInt(req.query.perpage as string)
        : 20;
      const sortBy = req.query.sortBy
        ? (req.query.sortBy as string)
        : "createdAt";
      const sortOrder = req.query.sortOrder
        ? (req.query.sortOrder as string)
        : "asc";

      const { status } = req.body;
      if (!status) {
        throw next(new ErrorHandler("Please Specify Status ", 500));
      }
      const paymentID = req.params.id;
      if (!paymentID) {
        throw next(new ErrorHandler("Please Specify paymentID ", 500));
      }
      if (Object.values(PaymentStatus).includes(status)) {
        const updateData = await prisma.paymentHistory.update({
          where: { id: paymentID },
          data: {
            status: status,
          },
        });

        res.status(200).json({
          success: true,
          message: "Updated SucessFully",
          data: updateData,
        });
      } else {
        throw next(new ErrorHandler("Invalid Status ", 500));
      }
    } catch (error) {
      next(error);
    }
  }
);

export const getPaymentHistory = catchAsyncError(
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    try {
      const data = await prisma.paymentHistory.findMany({
        where: { member_id: req.user.id },
      });
      res.status(200).json({
        success: true,
        message: "Payment details Fetched SucessFully",
        data: data,
      });
    } catch (error) {
      console.error("fetching data failed:", error);
    }
  }
);

export const createPayments = catchAsyncError(
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    const { amount, transction_id  , referallCode} = req.body;
    // let promotionAndMembershipId = "bf546846-6163-40ce-941e-2fe433077c13"

  
   
    const getMembershipAmount = await prisma.promotionAndMembershipAmount.findFirst();

    console.log(getMembershipAmount , "this is a getMemberShipAmount")


    let membershipAmount = (getMembershipAmount?.membershipAmount || 2000) as number;
    const memberId = req.user.id;
 
    if(referallCode &&  referallCode !== process.env.REFERALLCODE) return res.status(201).json({
      success: false,
      message: "Enter a Valid ReferallCode",
    });

    if(referallCode && referallCode === process.env.REFERALLCODE){
      membershipAmount = Number(membershipAmount/2) ; // amount in smallest currency unit
    }

  
    let options = {
      amount: membershipAmount * 100,  // amount in smallest currency unit
      currency: "INR",
      receipt: transction_id
  };



  instance.orders.create(options, async function (err, order) {
    if (err) {
        console.log(err);
        return res.status(500).json({ error: "An error occurred while creating the order" });
    }


    try {

      const isPendingStatus = await prisma.paymentHistory.findFirst({
        where: {
          member_id: req.member_id,
          status: "pending", // Check for pending status
        },
      });
  
      if (isPendingStatus) {
        console.log("is pending called 1", isPendingStatus)
        return res.status(400).json({
          success: false,
          message: "A pending payment already exists. Please complete it before creating a new payment.",
        });
      }
  
     
      const secretKey = jwt.sign( {order:order,memberId:memberId} , process.env.ORDER_SECRET_KEY as string);

      const paymentData = {
        member_id: req.member_id, // Assuming "id" is the primary key of the Member model
        amount: membershipAmount,
        status: "pending", // Set the default status to "pending"
        transction_id:secretKey,
        orderId: order.id
      };
      
      res.status(200).json({
        success: true,
        message: "Payment details Fetched SuccessFully",
        data: {paymentData,order} 
      });
    } catch (error) {
      console.error("Error creating payment :", error);
      return res.status(500).json({ error: "An error occurred while creating payment " });
    }


  })

              

  
  }
);

export const verifyPaymentMemberShip = catchAsyncError(async(req: CustomRequest, res:Response,next :NextFunction)=>{
  try {
    const { razorpay_order_id, razorpay_signature, razorpay_payment_id } = req.body;
    const { secretKey } = req.query;
    const member_id = req.member_id

    let body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
          .createHmac("sha256",process.env.RAZORPAY_API_SECRECT as string)
          .update(body.toString())
          .digest("hex")

          const isAuthentic = expectedSignature === razorpay_signature
          console.log(isAuthentic)

          const decode = jwt.verify(secretKey as string, process.env.ORDER_SECRET_KEY as string) as { order: any ,memberId:string};
            

          const orderId = decode.order.id;
        

     

        if(isAuthentic){
          const createdPayment = await prisma.paymentHistory.create({
            data: {
              member_id: decode.memberId,
            amount: decode.order.amount,
            status: 'pending',
            transction_id:decode.order.id,
            orderId: decode.order.id
            }
          });
          res.redirect('https://member.return2success.com/membership?payment=success')
        }
        else{
          const createdPayment = await prisma.paymentHistory.create({
            data: {
              member_id: decode.memberId,
            amount: decode.order.amount,
            status: 'rejected',
            transction_id:decode.order.id,
            orderId: decode.order.id
            }
          });
          res.redirect('https://member.return2success.com/membership?payment=failed')


        }

  } catch (error) {
    next(error)
  }
})

export default prisma;
