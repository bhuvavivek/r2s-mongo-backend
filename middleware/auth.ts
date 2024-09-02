import { PrismaClient } from '@prisma/client'; // Import the PrismaClient
import { NextFunction, Request, Response } from "express";
import catchAsyncError from "./catchAsyncError";

import crypto from "crypto";
import jwt from 'jsonwebtoken';
import ErrorHandler from "../utils/errorhandler";

import * as dotenv from 'dotenv';

const prisma = new PrismaClient(); // Initialize PrismaClient

dotenv.config();

interface CustomRequest extends Request {
  phone: string;
  // member_balance:string
  user:any;
  is_sales_person:boolean,
  is_premium:boolean
  member_id:string,
  business_id:string,
  bank_id:string,
  address_id:string,
  generatedMemberId:string,
  business_address_id:string,
  search_count:number
  search_limit:number
  balance: number;
  member_status:string
  product_id:string
  service_id:string
}

interface CustomadminRequest extends Request {
  phone: string;
  admin:any;
  admin_id:string
  member_id:string
  isPremium:boolean,
  earlierStatus:string,
  validUpto:Date | null
}


const smsKey = process.env.SMS_SECRET_KEY;
const twilioNum = process.env.TWILIO_PHONE_NUMBER;

export const otpVerification = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  let phone = req.body.phone;
  const hash = req.body.hash;
  const otp = req.body.otp;
  phone = "+91" + phone;

  if (!(phone && hash && otp)) {
    return next(new ErrorHandler("Please enter the credentials", 400));
  }

  let [hashValue, expires] = hash.split('.');
  let now = Date.now();

  if (now > parseInt(expires)) {
    return next(new ErrorHandler("Otp Time out Please Resend It again", 400));
  }

  // Check if smsKey is defined before using it
  if (smsKey) {
    let data = `${phone}.${otp}.${expires}`;
    let newCalculatedHash = crypto.createHmac('sha256', smsKey).update(data).digest('hex');

    if (newCalculatedHash === hashValue) {
      next();
    } else {
      return next(new ErrorHandler("Incorrect Credentials", 401));
    }
  } else {
    return next(new ErrorHandler("SMS_SECRET_KEY is not defined", 500)); // Handle the case when smsKey is undefined
  }
});


export const isAuthenticatedAdmin = catchAsyncError(async (req: CustomadminRequest, res: Response, next: NextFunction) => {

  const bearerHeader = req.headers["authorization"];

  if (typeof bearerHeader !== "undefined") {
    const bearer = bearerHeader.split(" ");
    const token = bearer[1];
    let user;

    jwt.verify(token, "DF983kjhfqn7@$@%*bjbfh12_", (err: any, decodedData: any) => {
      if (err) {
        return next(new ErrorHandler("Invalid token",401));
      } else {
        const decodedUserID: string = decodedData.userID;
        prisma.admin
          .findUnique({
            where: { id: decodedUserID },
          })
          .then((user) => {
            if (!user) {
              return next(new ErrorHandler("You are not a Valid admin",401));
            }
            req.admin=user
            req.admin_id=user.id
            next();
          })
          .catch((error) => {
            return next(error);
          });
      }
    });
    
    
  } else {
    return next(new Error("Please login to access this resources. Invalid token"));
  }
});


export const isAuthenticatedMember = catchAsyncError(async (req: CustomRequest, res: Response, next: NextFunction) => {

  const bearerHeader = req.headers["authorization"];

  if (typeof bearerHeader !== "undefined") {
    const bearer = bearerHeader.split(" ");
    const token = bearer[1];
    let user;

    jwt.verify(token, "DF983kjhfqn7@$@%*bjbfh12_", (err: any, decodedData: any) => {
      if (err) {
        return next(new ErrorHandler("Invalid token",401));
      } else {
        const decodedUserID: string = decodedData.userID;
        prisma.member
          .findUnique({
            where: { id: decodedUserID },
            include:{
              Business_Profile:{
                include:{
                  addresses:true
                }
              },
              Bank_Detail:true,
              MemberInfo:true,
              addresses:{
                select:{
                  id:true
                }
              }
            }
          })
          .then((user) => {
            if (!user) {
              return next(new ErrorHandler("You are not a Valid User",401));
            }
            
            req.user=user
            req.member_id=user.id
            // req.member_balance=user.MemberInfo?.balance
            req.member_status=user.Status
            req.search_count=user.search_count 
            req.is_premium=user.is_premium
            req.is_sales_person = user.is_sales_person
            req.business_id=user.Business_Profile[0].id
            req.bank_id=user.Bank_Detail[0].id
            req.address_id=user.addresses[0].id
            req.business_address_id=user?.Business_Profile[0]?.addresses[0]?.id
          
            if (typeof user?.MemberInfo?.balance   === 'string') {
              req.balance=user?.MemberInfo?.balance  
            }
  
            next();
          })
          .catch((error) => {
            return next(error);
          });
      }
    });
    
    
  } else {
    return next(new ErrorHandler("Please login to access this resources. Invalid token",401));
  }
});

export const verifyOtp = catchAsyncError(async (req: CustomRequest, res: Response, next: NextFunction) => {
  const smsKey = process.env.SMS_SECRET_KEY || '';

  let phone = req.body.phone;
  req.phone=phone
  if(!phone){
    phone=req.body.Member.phone
  }
	const hash = req.body.hash;
	const otp = req.body.otp;

	if(!(phone && hash && otp) ){
       return next(new ErrorHandler("Please enter the credantials",400))
	}
	let [ hashValue, expires ] = hash.split('.');

	let now = Date.now();
	if (now > parseInt(expires)) {
		return next(new ErrorHandler("Otp Time out Please Resend It again",400));
	}
	let data = `${phone}.${otp}.${expires}`;
	let newCalculatedHash = crypto.createHmac('sha256', smsKey).update(data).digest('hex');
 
	if (newCalculatedHash === hashValue) {
        next();
	} else {
		 return next(new ErrorHandler("Invalid Otp ",400));
	}
});


export { CustomadminRequest, CustomRequest };

