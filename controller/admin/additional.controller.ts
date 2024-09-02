// admin.ts

import bcrypt from 'bcryptjs';
import { NextFunction, Request, Response } from "express";
import { readFileSync } from 'fs';
import { join } from 'path';
import SuccessHandler from "../../utils/sucessReply";

import { PrismaClient } from "@prisma/client"; // Import the PrismaClient
import { CustomadminRequest } from "../../middleware/auth";
import catchAsyncError from "../../middleware/catchAsyncError";
import { AdditionalService, AdminService } from "../../services/admin";

import { OrderHistory, memberInfo } from '@prisma/client';
import nodemailer from 'nodemailer';
interface RegistrationRequest extends Request {
  refereedData: any;
}

const prisma = new PrismaClient(); // Initialize PrismaClient
const additionalApiService=new AdditionalService()
const adminApiServices = new AdminService();


export const updateAddtionaldetail = catchAsyncError(
  async (req: RegistrationRequest, res: Response, next: NextFunction) => {
  const{
    search_limit,Master_referall_amount,Child_referall_amount,SubChild_referall_amount,discount,contact_no,contact_email
  }=req.body

    const dataToUpdate={
      search_limit:parseInt(search_limit) ,
      Master_referall_amount:parseInt(Master_referall_amount),
      Child_referall_amount:parseInt(Child_referall_amount),
      SubChild_referall_amount:SubChild_referall_amount,
      discount:parseInt(discount),
      contact_no:contact_no,
      contact_email:contact_email
    }

    try {

      const updateData=await additionalApiService.update("1",dataToUpdate)

      SuccessHandler.sendSuccessResponse(res,"Additional Detail Updated Sucess",{updateData})

    } catch (error) {
      console.error("Registration failed:", error);
    }
  }
);


export const getAdditional = catchAsyncError(
  async (req: CustomadminRequest, res: Response, next: NextFunction) => {
    const adminId=req.admin_id
    try {
      const [additionalDetailData, myProfileData] = await Promise.all([
        additionalApiService.read({ id: 1 }),
        adminApiServices.read({ id: adminId })
      ]);
      SuccessHandler.sendSuccessResponse(res,"Additional Detail fetched Successfully",{additionalDetailData,myProfileData})
    } catch (error) {
      console.error("Something Went Wrong:", error);
    }
  }
);



export const adminDashboardStatic = catchAsyncError(
  async (req: CustomadminRequest, res: Response, next: NextFunction) => {
    try {
      // Calculate total member count
      const totalMembers = await prisma.member.count();

      // Calculate total revenue
      // const totalRevenue = await prisma.order.aggregate({
      //   _sum: {
      //     amount: true
      //   }
      // });

      const totalRevenue = await prisma.paymentHistory.aggregate({
        _sum:{
          amount:true
        },
        where:{
          status:'approved'
        }
      });

      // Calculate total ecommerce withdrawal
      // const totalEcommerceWithdrawal = await prisma.memberInfo.aggregate({
      //   _sum: {
      //     ecommerceWithdraw: true
      //   }
      // });

      const totalWithdrawal = await prisma.payoutHistory.aggregate({
        _sum:{
          amount:true
        },
        where:{
          status:'approved'
        }
      })

      // Send the response
      res.status(200).json({
        totalMembers,
        totalRevenue: Number(totalRevenue._sum.amount)/100 || 0,
        totalWithdrawal:Number(totalWithdrawal._sum.amount) / 100 || 0
      });
    } catch (error) {
      console.error("Something Went Wrong:", error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);








// Helper function to process order history data and calculate revenue by month
function processOrderHistory(data: OrderHistory[]): Map<number, { revenue: number; withdrawal: number }> {
  const revenueByMonth = new Map<number, { revenue: number; withdrawal: number }>();

  // Process each order history item
  data.forEach((item) => {
    const month = item.orderDate.getMonth() + 1; // Adjust month index to 1-based
    const amount = Number(item.amount || 0); // Convert Decimal to number
    const existingData = revenueByMonth.get(month);
    if (existingData) {
      existingData.revenue += amount;
    } else {
      revenueByMonth.set(month, { revenue: amount, withdrawal: 0 });
    }
  });

  return revenueByMonth;
}

// Helper function to process member info data and calculate withdrawal by month
function processMemberInfo(data: memberInfo[]): Map<number, { revenue: number; withdrawal: number }> {
  const withdrawalByMonth = new Map<number, { revenue: number; withdrawal: number }>();

  // Process each member info item
  data.forEach((item) => {
    const month = item.Created_at.getMonth() + 1; // Adjust month index to 1-based
    const withdrawal = Number(item.ecommerceWithdraw || 0); // Convert Decimal to number
    const existingData = withdrawalByMonth.get(month);
    if (existingData) {
      existingData.withdrawal += withdrawal;
    } else {
      withdrawalByMonth.set(month, { revenue: 0, withdrawal });
    }
  });

  return withdrawalByMonth;
}

export const adminDashboardMonthly = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Fetch order history and member info data
    const orderHistoryData = await prisma.orderHistory.findMany();
    const memberInfoData = await prisma.memberInfo.findMany();

    // Process order history data to get revenue by month
    const revenueByMonth = processOrderHistory(orderHistoryData);

    // Process member info data to get withdrawal by month
    const withdrawalByMonth = processMemberInfo(memberInfoData);

    // Combine revenue and withdrawal data into a single object with month names
    const monthNames = [
      "January", "February", "March", "April", "May", "June", "July",
      "August", "September", "October", "November", "December"
    ];
    const monthlyData: Record<string, { revenue: number; withdrawal: number }> = {};

    // Populate monthly data with month names
    revenueByMonth.forEach((revenueItem, month) => {
      const monthName = monthNames[month - 1]; // Adjust month index since arrays are 0-indexed
      const totalRevenue = revenueItem.revenue || 0;
      const totalWithdrawal = withdrawalByMonth.get(month)?.withdrawal || 0;
      monthlyData[monthName] = { revenue: totalRevenue, withdrawal: totalWithdrawal };
    });

    // Send the response
    res.status(200).json(monthlyData);
  } catch (error) {
    console.error("Something Went Wrong:", error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};


const getEmailTemplate = (templatePath: string, replacements: { [key: string]: string }) => {
  const templateContent = readFileSync(templatePath, 'utf-8');
  let result = templateContent;
  for (const [key, value] of Object.entries(replacements)) {
    result = result.replace(`{{${key}}}`, value); // Replace placeholder with value
  }
  return result;
};



export const otpsend = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get email address from request body
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email address is required' });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000);
    const stringOtp = String(otp);

    // Calculate expiration time (20 seconds from now)
    const expirationTime = new Date();
    expirationTime.setSeconds(expirationTime.getSeconds() + 600);

    // Hash the OTP
    const hashedOTP = await bcrypt.hash(stringOtp, 10);

    // Combine hashed OTP and expiration time
    const otpWithExpiration = `${hashedOTP},${expirationTime.getTime()}`;

    // Create a Nodemailer transporter using SMTP transport
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: true, // true for port 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });


    const templatePath = join(__dirname, '../../emailTemplate/otp.html');
    const emailBody = getEmailTemplate(templatePath, { otp: stringOtp });

    // Send OTP email
    await transporter.sendMail({
      from: '"Return 2 Success" <return2success@gmail.com>',
      to: email,
      subject: 'Your OTP for Verification',
      html: emailBody, // Use the generated email body
    });


    // Respond with success message and hashed OTP with expiration time
    res.status(200).json({ message: 'OTP sent successfully', otpWithExpiration });
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const verifyOTP = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('Verifying OTP...');

    // Get OTP and hashed OTP with expiration from request body
    const { otp, otpWithExpiration } = req.body;
    if (!otpWithExpiration || !otp) {
      return res.status(400).json({ message: 'Hashed OTP with expiration and original OTP are required' });
    }

    // Split hashed OTP with expiration to retrieve hashed OTP and expiration time
    const [hashedOTP, expirationTime] = otpWithExpiration.split(',');

    // Verify the original OTP by comparing it with the provided OTP
   
    
    const currentTime = new Date().getTime();

    // Compare current time with expiration time
    const isExpired = currentTime > parseInt(expirationTime);
    if (isExpired) {
      console.log('OTP has expired');
      return res.status(400).json({ message: 'OTP has expired' });
    }
    const otpMatch = await bcrypt.compare(otp, hashedOTP);

    if (!otpMatch) {
      console.log('Invalid OTP');
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // Get current time
    

    // Respond with success message
    console.log('OTP verified successfully');
    res.status(200).json({ message: 'OTP verified successfully' });
    
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

















