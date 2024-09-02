import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import nodemailer from 'nodemailer';
import { CustomRequest } from "../../middleware/auth";
import MemberService from "../../services/member/Member.services.";
import { GenerateSignature } from "../../utils/index";
import SuccessHandler from "../../utils/sucessReply";

// Your controller logic using PrismaClient, JobDetail, and bussinessType

import catchAsyncError from "../../middleware/catchAsyncError";
import ErrorHandler from "../../utils/errorhandler"; // Import your custom error handler if available
import {
  generateMemberId,
  generateReferralCode,
} from "../common";


interface RegistrationRequest extends Request {
  refereedData: any;
  memberId: string;
}




const prisma = new PrismaClient(); // Initialize PrismaClient
const memberApiService = new MemberService()


async function createReferralEntry(
  referred_by: string,
  referred_to: string,
  level: any,
  amount: any
) {
  await prisma.referralTable.create({
    data: {
      referred_by: referred_by, // Connect the referring member by ID
      referred_to: referred_to,
      status: "pending",
      level: level,
      amount,
      message: `Referall done`,
    },
  });
}

async function createReferral(
  referred_by: string,
  referred_to: string,
  amount: any,
) {
  // Create a referral entry for the current referral
  await createReferralEntry(referred_by, referred_to, 0, amount);
}

async function createReferralHierarchy(
  referred_by: string,
  referred_to: string,
  level: any,
  amount: any,
  InitialAmount:any
) {

  // Create a referral entry for the current referral
  await createReferralEntry(referred_by, referred_to, level, amount);

  // Base case: Stop recursing when the level reaches a certain limit (e.g., level 3)
  if (level >= 3) {
    return;
  }


  // Find all users referred by the current user
  const parentUser = await prisma.referralTable.findFirst({
    where: { referred_to: referred_by , amount:Number(InitialAmount)},
    orderBy: { created_at: 'desc' }
  });


  if (!parentUser) {
    return;
  }
  // Recursively create entries for child users
  await createReferralHierarchy(
    parentUser.referred_by,
    referred_to,
    level + 1,
    100,
    InitialAmount
  ); // Adjust amount as needed
}

export const register = catchAsyncError(
  async (req: RegistrationRequest, res: Response, next: NextFunction) => {
    const { Member, Bussiness, businessAddress, memberAddress, bank, upiId } =
      req.body;
    const hashPassword = await bcrypt.hash(Member.password, 10)

    const memberId = req.memberId;

    const referralCode = await generateReferralCode(
      Member.phone,
      Member.email,
      Member.member_name
    );

    let originalName: string = Member.member_name;
    let formattedName: string;
    let other = " "

    if (Bussiness.other) {
      other = Bussiness.other
    }


    if (originalName.includes("-")) {
      formattedName = originalName.replace("-", " ");
    } else {
      formattedName = originalName;
    }

    interface BankData {
      Account_name: string | "";
      Account_no: string | null;
      Ifsc_code: string | null;
      bank_name: string | null;
      upi_id: string | null;
    }

    let bankdata: BankData = {
      Account_name: "",
      Account_no: null,
      Ifsc_code: null,
      bank_name: null,
      upi_id: null,
    };

    if (bank && typeof bank === 'object' && upiId) {
      bankdata = {
        Account_name: bank.Account_name,
        Account_no: bank.Account_no || null,
        Ifsc_code: bank.Ifsc_code || null,
        bank_name: bank.bank_name || null,
        upi_id: upiId,
      };
    } else if (bank && typeof bank === 'object' && !upiId) {
      bankdata = {
        Account_name: bank.Account_name,
        Account_no: bank.Account_no || null,
        Ifsc_code: bank.Ifsc_code || null,
        bank_name: bank.bank_name || null,
        upi_id: null,
      };
    } else if (!bank && upiId) {
      bankdata = {
        Account_name: "",
        Account_no: "", // This might be causing the issue
        Ifsc_code: "",
        bank_name: "",
        upi_id: upiId,
      };
    }

    // Generate member ID and referral code

    const businessType = await prisma.bussinessType.findFirst({
      where: { type: Bussiness.Bussiness_type },
    });

    if (!businessType) {
      return res.status(400).json({
        success: false,
        message: 'Invalid business type provided',
      });
    }

    try {
      const result = await prisma.$transaction([
        prisma.member.create({
          data: {
            email_id: Member.email,
            full_name: formattedName,
            Contact_no: Member.phone,
            password: hashPassword,
            Job_title: Member.Job_title,
            referal_id: referralCode,
            profile_picture: Member.profile_picture,
            profile_image_key: Member.profile_picture_key,
            is_sales_person: Member.is_sales_person,
            memberid: memberId,
            Status: "pending",
            MemberInfo: {
              create: {
                balance: 0,
                revenue: 0,
                withdrawl: 0,
              },
            },
            Bank_Detail: {
              create: bankdata,
            },
            Business_Profile: {
              create: {
                bussiness_name: Bussiness.bussiness_name,
                Bussiness_type: businessType.type,
                otherType: other,
                business_logo: Bussiness.business_logo,
                short_description: Bussiness.bussiness_description,
                website_link: Bussiness.website_link || null,
                business_hour: Bussiness.business_hour,
                addresses: {
                  create: [
                    {
                      address_line_1: businessAddress.address_line_1,
                      address_line_2: businessAddress.address_line_2,
                      area: businessAddress.area,
                      city: businessAddress.city,
                      state: businessAddress.state,
                      country: businessAddress.country,
                      pincode: businessAddress.pincode,
                      type: "office_address",
                    },
                  ],
                },
                Social_Link: {
                  create: {
                  }
                }
              },
            },
            addresses: {
              create: [
                {
                  address_line_1: memberAddress.address_line_1,
                  address_line_2: memberAddress.address_line_2,
                  city: memberAddress.city,
                  state: memberAddress.state,
                  country: memberAddress.country,
                  pincode: memberAddress.pincode,
                  type: "permanent",
                },
              ],
            },
          },
          include: {
            Bank_Detail: true,
            Business_Profile: {
              include: {
                addresses: true,
              },
            },
            addresses: true,
          },
        }),
      ]);


      const is_premium = result[0].is_premium;

      if (req.refereedData) {

        const referalAmountRecord = await prisma.promotionAndMembershipAmount.findFirst({
          select: {
            referallAmount: true
          }
        })

        await createReferralHierarchy(
          req.refereedData.id,
          result[0].id,
          0,
          referalAmountRecord?.referallAmount || 500,
          referalAmountRecord?.referallAmount || 500
        );

        const token = jwt.sign(
          { userID: result[0].id },
          process.env.JWT_SECRET_KEY as string,
          { expiresIn: "5d" }
        );
        res.status(200).json({
          success: true,
          message: "user created Sucessfully",
          data: { token, is_premium },
        });
      } else {

        const token = jwt.sign(
          { userID: result[0].id },
          process.env.JWT_SECRET_KEY as string, // Assuming it's a string
          { expiresIn: "5d" }
        );

        res.status(200).json({
          success: true,
          message: "user created Sucessfully",
          data: { token, is_premium },
        });
      }


    } catch (error) {
      console.error("Registration failed:", error);
    }
  }
);

export const validatingMemberDetail = catchAsyncError(
  async (req: RegistrationRequest, res: Response, next: NextFunction) => {
    const { phone, referal_code, email } = req.body;
    console.log("get into Referall");
    console.log(req.body);

    if (!phone || !email) {
      throw next(new ErrorHandler("All field are required", 500));
    }

    try {
      let responseData = {};

      const memberdetail = await prisma.member.findFirst({
        where: {
          OR: [{ Contact_no: phone }, { email_id: email }],
        },
      });

      console.log(memberdetail, "this is memeber detail")

      responseData = {
        Ismemberexist: memberdetail ? true : false,
      };

      if (referal_code && referal_code.length > 0) {
        const referaldetail = await prisma.member.findUnique({
          where: { referal_id: referal_code },
        });

        responseData = {
          Ismemberexist: memberdetail ? true : false,
          Isreferalexist: referaldetail ? true : false,
        };
      }

      res.status(200).json({
        success: true,
        message: "detail fetched Sucessfully",
        data: responseData,
      });

      console.log("Registration successful.");

    } catch (error) {
      console.error("Registration failed:", error);
    }
  }
);

export const forgotPassword = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  const { email } = req.body;

  // Check if email exists in the database
  const member = await prisma.member.findFirst({ where: { email_id: email } });
  if (!member) {
    return res.status(404).json({ message: 'Email not found' });
  }

  try {
    // Generate a unique token (e.g., JWT token)
    const token = jwt.sign({ email }, process.env.JWT_SECRET_KEY as string, { expiresIn: '1h' });

    // Create a Nodemailer transporter using SMTP transport
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: true, // false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      debug: true, // Enable debugging
    });
    // Send the password reset link to the user's email address
    console.log("this is email " + email)
    try {
      // Send the password reset link to the user's email address
      await transporter.sendMail({
        from: '"Your Company" <return2success@gmail.com>',
        to: email, // Ensure that 'email' is correctly defined and contains the recipient's email address
        subject: 'Password Reset Link',
        html: `<p>Please click <a href="member.return2success.com/auth/jwt/change-password?token=${token}">here</a> to reset your password.</p>`,
      });

      res.status(200).json({ message: 'Password reset link sent successfully' });
    } catch (error) {
      console.error('Error sending password reset link:', error);
      res.status(500).json({ message: 'Error sending password reset link' });
    }
  } catch (error) {
    console.error('Error sending password reset link:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

export const resetPassword = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  const { token, newPassword } = req.body;

  // Verify JWT token
  jwt.verify(token, process.env.JWT_SECRET_KEY as string, async (err: jwt.VerifyErrors | null, decoded: string | object | undefined) => {
    if (err) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    try {
      if (typeof decoded === 'undefined' || typeof decoded === 'string') {
        throw new Error('Invalid decoded token');
      }

      const decodedPayload = decoded as { email: string };

      // Extract user email from decoded JWT payload
      const { email } = decodedPayload;

      console.log(email + "this is emmail from reset api ")

      // Find user by email in the database
      const user = await prisma.member.findFirst({ where: { email_id: email } });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Update user's password with the new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await prisma.member.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      });

      // Password reset successful
      res.status(200).json({ message: 'Password reset successful' });
    } catch (error) {
      console.error('Error resetting password:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  });
});

export const whatsappStatus = catchAsyncError(async (req: CustomRequest, res: Response, next: NextFunction) => {
  try {

    const isWhatsapp = req.query.isWhatsapp === 'true';
    const member_id = req.member_id


    if (!isWhatsapp) {
      res.status(404).json({ message: "please provide whatsapp status " })
    }

    const updateWhatsappStatus = await prisma.member.update({
      where: {
        id: member_id
      },
      data: {
        isWhatsapp: isWhatsapp
      }
    })


    res.status(200).json({
      success: true,
      message: "whatsapp status updated succesfully ",

    });

  } catch (error) {
    console.error('Error while changing whatsapp status:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
})


export const VerifingExistence = catchAsyncError(
  async (req: RegistrationRequest, res: Response, next: NextFunction) => {
    const { Member } = req.body;
    console.log("get into verifying exictense");
    try {
      const data = await prisma.member.findFirst({
        where: {
          OR: [{ Contact_no: Member.phone }, { email_id: Member.email }],
        },
      });
      if (data) {
        throw next(new ErrorHandler("User already Exist", 500));
        // console.log("data",data)
      } else {
        let referalExistense;
        if (Member.referal_id) {
          referalExistense = await prisma.member.findUnique({
            where: { referal_id: Member.referal_id },
          });
        }
        if (referalExistense) {
          req.refereedData = referalExistense;
        }
        next();
      }
    } catch (error) {
      console.error("Registration failed:", error);
    }
  }
);

export const generateUniqueMemberId = catchAsyncError(
  async (req: RegistrationRequest, res: Response, next: NextFunction) => {
    try {
      const { Member } = req.body;
      let isUnique = false;
      let memberId;

      let count = 1;
      // Loop until a unique Member ID is generated
      while (!isUnique) {
        // Generate a random Member ID
        memberId = generateMemberId(Member.email, Member.member_name);
        console.log("member id is ", memberId);
        // Check if the generated Member ID exists in the database
        const existingMember = await prisma.member.findUnique({
          where: { memberid: memberId },
        });

        console.log("count is ", count);
        // If the Member ID doesn't exist, mark it as unique and break the loop
        if (!existingMember) {
          isUnique = true;
        }
        count += 1;

        // If the Member ID exists, continue the loop to generate a new one
      }
      //@ts-ignore
      req.memberId = memberId;
      next();
    } catch (error) {
      // Handle errors appropriately
      console.error("Error generating unique Member ID:", error);
      next(error);
    }
  }
);

export const Login = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { phone, password } = req.body;

      const memberExist = await memberApiService.read({ Contact_no: phone })


      if (!memberExist) {
        throw new ErrorHandler("Phone number not valid", 400);
      }
      const isMatch = await bcrypt.compare(password, memberExist.password);
      if (!isMatch) {
        throw new ErrorHandler("Invalid password", 500);
      }

      const token = await GenerateSignature({ userID: memberExist.id });

      SuccessHandler.sendSuccessResponse(res, "Login Success", { token });

    } catch (error) {
      next(error);
    }
  }
);

export const checkUserExistence = catchAsyncError(
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    try {
      const phone = req.phone;
      console.log(phone);
      const memberdata = await prisma.member.findFirstOrThrow({
        where: { Contact_no: phone },
      });
      if (!memberdata) {
        throw new ErrorHandler("Phone no not valid not valid", 400);
      } else {
        const token = jwt.sign(
          { userID: memberdata.id },
          process.env.JWT_SECRET_KEY as string, // Assuming it's a string
          { expiresIn: "5d" }
        );
        res.status(200).json({
          success: true,
          message: "Login Successful",
          token,
          data: { id: memberdata.id, email: memberdata.email_id },
        });
      }
    } catch (error) {
      next(error);
    }
  }
);

interface ReadOptions {
  Business_Profile?: {
    include: {
      Interior_Exterior_Picture_Links: boolean;
      addresses: boolean;
      Social_Link: boolean;
    };
  };
  Bank_Detail?: boolean;
  addresses?: boolean;
}


export const getMyProfile = catchAsyncError(
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    const memberId = req.user.id;
    try {
      const myprofiledata = await prisma.member.findUnique({
        where: { id: memberId },
        include: {
          Business_Profile: {
            include: {
              Interior_Exterior_Picture_Links: true,
              addresses: true,
              Social_Link: true
            }
          },
          Bank_Detail: true,
          addresses: true,
        },
      }) as any;

      // const myprofiledata=await memberApiService.read({ id: memberId },{
      //   Business_Profile: {
      //     include: {
      //       Interior_Exterior_Picture_Links: true,
      //       addresses: true,
      //       Social_Link: true
      //     }
      //   },
      //   Bank_Detail: true,
      //   addresses: true,
      // })

      res.status(200).json({
        success: true,
        message: "Payment details Fetched SucessFully",
        data: myprofiledata,
      });
    } catch (error) {
      console.log(error)
      next(error);
    }
  }
);


export const getReferral = catchAsyncError(
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;
      const masterReferalData = await prisma.referralTable.findMany({
        where: { referred_by: req.member_id },
        include: {
          Member: true
        },
        skip: skip,
        take: limit,
      });

      const totalDocuments = await prisma.referralTable.count({
        where: { referred_by: req.member_id },
      })

      res.status(200).json({
        message: "this is data",
        data: masterReferalData,
        page: page,
        limit: limit,
        totalDocuments
      });
    } catch (error) {
      console.log(error)
    }
  }
);

export const changeMemberPassword = catchAsyncError(
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    const { password, confirm_password, current_password } = req.body;
    console.log(req.body);
    if (!password || !confirm_password || !current_password) {
      throw next(new ErrorHandler("All field are required", 500))
    }

    if (password !== confirm_password) {
      throw next(new ErrorHandler("Password and confirm Did not matched", 500))
    }

    if (password.length < 6) {
      throw next(new ErrorHandler("Password Length Should be greater 6 ", 500))
    }

    const hashPassword = await bcrypt.hash(password, 10)
    const isSame = await bcrypt.compare(password, req.user.password);


    if (isSame) {
      throw next(new ErrorHandler("New Password Should be different that older  ", 500))
    }

    try {

      const isMatch = await bcrypt.compare(current_password, req.user.password);

      if (!isMatch) {
        throw next(new ErrorHandler("Invalid current password ", 500))
      }

      const adminData = await prisma.member.update({
        where: { id: req.member_id },
        data: {
          password: hashPassword
        }
      });
      res.status(200).json({
        success: true,
        message: 'Password changed Successfully ',
      });
    } catch (error) {
      next(error);
    }
  }
);


export const validateRegistrationFields = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { Member, Bussiness, memberAddress, bank, businessAddress, upiId } = req.body;

  function validateFields(data: any, fields: string[], section: string) {
    const missingFields = fields.filter((field) => !data[field]);
    if (missingFields.length > 0) {
      throw new Error(
        `In ${section}, missing fields: ${missingFields.join(", ")}`
      );
    }
  }

  try {
    validateFields(
      Member,
      ["email", "member_name", "phone", "Job_title", "password"],
      "Member"
    );
    validateFields(
      Bussiness,
      ["bussiness_name", "Bussiness_type", "bussiness_description"],
      "Bussiness"
    );
    validateFields(
      memberAddress,
      ["address_line_1", "city", "state", "pincode", "country"],
      "Member Address"
    );
    if (!bank && !upiId) {
      throw new Error(
        `Please Specify One thing Bank Or Upi Id `
      );
    }
    if (bank) {
      validateFields(
        bank,
        ["Account_name", "Account_no", "Ifsc_code", "bank_name"],
        "Bank"
      );
    }

    validateFields(
      businessAddress,
      ["address_line_1", "city", "state", "area", "pincode", "country"],
      "Business Address"
    );

    // Validate other sections similarly

    console.log("Passed through validateRegistrationFields");
    next();
  } catch (error: any) {
    return res.status(400).json({ success: false, error: error.message });
  }
};

export default prisma;
