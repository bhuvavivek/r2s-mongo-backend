// admin.ts

import {
  JobDetail,
  PrismaClient
} from "@prisma/client";
import bcrypt from "bcrypt";
import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { CustomRequest } from "../../middleware/auth";
import catchAsyncError from "../../middleware/catchAsyncError";
import ErrorHandler from "../../utils/errorhandler";
import {
  generateMemberId,
  generateReferralCode,
  uploadImageToCloudinary,
  validateBusinessType,
} from "../common";


interface RegistrationRequest extends Request {
  refereedData: any;
  memberId: string;
  is_sales_person?: boolean;
  
}

const prisma = new PrismaClient();

async function createReferralEntry(
  referred_by: string,
  referred_to: string,
  level: any,
  amount: any
) {
  console.log(referred_by, referred_to, "ssssssss");
  await prisma.referralTable.create({
    data: {
      referred_by: referred_by, // Connect the referring member by ID
      referred_to: referred_to,
      status:"pending",
      level: level,
      amount,
      message: `Referall done`,
    },
  });
}

async function createReferralHierarchy(
  referred_by: string,
  referred_to: string,
  level: any,
  amount: any
) {
  // Create a referral entry for the current referral
  await createReferralEntry(referred_by, referred_to, level, amount);

  // Base case: Stop recursing when the level reaches a certain limit (e.g., level 4)
  if (level >= 3) {
    return;
  }

  // Find all users referred by the current user
  const parentUser = await prisma.referralTable.findFirst({
    where: { referred_to: referred_by },
  });

  if (!parentUser) {
    return;
  }
  // Recursively create entries for child users
  await createReferralHierarchy(
    parentUser.referred_by,
    referred_to,
    level + 1,
    100
  ); // Adjust amount as needed
}

async function getReferralCount(member_id: string) {
  try {
    const result = await prisma.$transaction([
      prisma.referralTable.count(), // Total count of referrals
      prisma.referralTable.count({
        where: {
          level: 0, // Count where level is 0
        },
      }),
      prisma.referralTable.count({
        where: {
          referred_to: {
            in: ["1", "2"], // Count child referrals where ID is 1 or 2
          },
        },
      }),
      prisma.referralTable.count({
        where: {
          referred_to: {
            in: ["3", "4"], // Count subchild referrals where ID is 3 or 4
          },
        },
      }),
    ]);

    return {
      total: result[0],
      levelZero: result[1],
      childReferrals: result[2],
      subChildReferrals: result[3],
    };
  } catch (error) {
    // Handle error
    console.error(error);
    return { total: 0, levelZero: 0, childReferrals: 0, subChildReferrals: 0 };
  }
}

export const register = catchAsyncError(
  async (req: RegistrationRequest, res: Response, next: NextFunction) => {
    const { Member, Bussiness, businessAddress, memberAddress, bank,upiId } =
      req.body;
    const hashPassword=await bcrypt.hash(Member.password,10)
    console.log("get into Referall");
    console.log(req.body);

    const memberId = req.memberId;
    console.log("i am into registration tab and meberid is ", memberId);
    const referralCode = await generateReferralCode(
      Member.phone,
      Member.email,
      Member.member_name
    );
    let originalName: string = Member.member_name;
    let formattedName: string;
    let other=" "

    if(Bussiness.other){
      other=Bussiness.other
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

    try {
      const result = await prisma.$transaction([
        prisma.member.create({
          data: {
            email_id: Member.email,
            full_name: formattedName,
            Contact_no: Member.phone,
            password:hashPassword,
            Job_title: Member.Job_title,
            referal_id: referralCode,
            profile_picture: Member.profile_picture,
            profile_image_key: Member.profile_picture_key,
            memberid: memberId,
            Status: "pending",
            MemberInfo:{
              create:{
                balance:0,
                revenue:0,
                withdrawl:0,
              },
            },
            Bank_Detail: {
              create:bankdata,
            },
            Business_Profile: {
              create: {
                bussiness_name: Bussiness.bussiness_name,
                Bussiness_type: Bussiness.Bussiness_type,
                otherType:other,
                business_logo: Bussiness.business_logo,
                description: Bussiness.bussiness_description,
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
                Social_Link:{
                  create:{
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


      const is_premium=result[0].is_premium
      if (req.refereedData) {
        console.log("get into refferal");
         createReferralHierarchy(
          req.refereedData.id,
          result[0].id,
          0,
          500
        );
        const token = jwt.sign(
          { userID: result[0].id },
          process.env.JWT_SECRET_KEY as string,
          { expiresIn: "5d" }
        );
        res.status(200).json({
          success: true,
          message: "user created Sucessfully",
          data: { token,is_premium },
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
          data: { token,is_premium },
        });
      }

      console.log("Registration successful.");
    } catch (error) {
      console.error("Registration failed:", error);
    }
  }
);

export const handlingSearchRestriction = catchAsyncError(
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    try {
      const data = await prisma.additionalDetail.findUnique({
        where: { id: "1" },
        select: {
          search_limit: true,
        },
      });

      const search_limit = data?.search_limit;

      if (!search_limit) {
        throw next(new ErrorHandler("Something went Wrong ", 500));
      }

      console.log(search_limit, "sssssssssssssssss");
      const search_count = req.search_count;
      if (search_count === search_limit) {
        throw next(new ErrorHandler("Your Search Limit Has Reached ", 500));
      }

      next();
    } catch (error) {
      console.error("Registration failed:", error);
    }
  }
);

export const validatingMemberDetail = catchAsyncError(
  async (req: RegistrationRequest, res: Response, next: NextFunction) => {
    const { phone, referal_code,email } = req.body;
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

      console.log(memberdetail,"this is memeber detail")

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

export const getRecentTransition = catchAsyncError(
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    const { phone, referal_code } = req.body;
    console.log("get Into Recent Transction ");
    console.log(req.body);
    const member_id=req.member_id

    try {

      const RecentTransitionHistory = await prisma.paymentHistory.findMany({
        where: { member_id:  member_id},
        orderBy: { updated_at: 'desc' },
      });
      // Replace timestampField with the field indicating the timestamp



      res.status(200).json({
        success: true,
        message: "detail fetched Sucessfully",
        data: RecentTransitionHistory,
      });

      console.log("Registration successful.");
    } catch (error) {
      console.error("Registration failed:", error);
    }
  }
);

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

export const getEarning = catchAsyncError(
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    const member_id = req.member_id;
    try {

      const [
        masterReferralResult,
        firstLevelResult,
        secondLevelResult,
        thirdLevelResult,
        fourthLevelResult,
        earningDataResult
      ] = await prisma.$transaction([
        prisma.referralTable.aggregate({
          _count: true,
          where: {
            level: 0,
            referred_by: member_id,
          },
        }),
        prisma.referralTable.aggregate({
          _count: true,
          where: {
            level: 1,
            referred_by: member_id,
            status: "approved"
          },
        }),
        prisma.referralTable.aggregate({
          _count: true,
          where: {
            level: 2,
            referred_by: member_id,
            status: "approved"
          },
        }),
        prisma.referralTable.aggregate({
          _count: true,
          where: {
            level: 3,
            referred_by: member_id,
            status: "approved"
          },
        }),
        prisma.referralTable.aggregate({
          _count: true,
          where: {
            level: 4,
            referred_by: member_id,
            status: "approved"
          },
        }),
        prisma.memberInfo.findUnique({
          where: { member_id: member_id },
        }),
      ]);


      res.status(200).json({
        success: true,
        message: "Earning details Fetched Successfully",
        data: {
          masterReferralCount: masterReferralResult._count,
          firstLevelCount: firstLevelResult._count,
          secondLevelCount: secondLevelResult._count,
          thirdLevelCount: thirdLevelResult._count,
          fourthLevelCount: fourthLevelResult._count,
          earningData: earningDataResult
        },
      });
    } catch (error) {
      // Handle error
      console.error(error);

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

export const getTopRatedBusiness = catchAsyncError(
  async (req: RegistrationRequest, res: Response, next: NextFunction) => {
    try {
      // Access is_sales_person from req object
      const isSalesPerson = req.is_sales_person;
      const page: any = req.query.page ; // Assign a default value if page is not provided
      const pageSize = 30
      const skip = (Number(page) - 1) * pageSize; // Explicitly cast page to number

      const totalRecords = await prisma.businessProfile.count();
      const totalPages = Math.ceil(totalRecords / pageSize);



      const result = await prisma.businessProfile.findMany({
        where:{
          Member: { is_sales_person: false }
        },
        orderBy: {
          rating: 'desc',
        },
        take: pageSize,
        skip,
      });

      for (const business of result) {
        const feedbacks = await prisma.businessFeedback.findMany({
          where: {
            bussiness_id: business.id
          },
          select: {
            rating: true
          }
        });
        if (feedbacks.length > 0) {
          const totalRating = feedbacks.reduce((sum, feedback) => sum + feedback.rating, 0);
          business.rating = totalRating / feedbacks.length;
        } else {
          business.rating = 0;
        }
      }

      res.status(200).json({
        success: true,
        message: "Earning details Fetched Successfully",
        data: {
          currentPage: Number(page),
          totalPages,
          result,
        },
      });

      console.log("Top Rated Entries:", result);
    } catch (error) {
      console.error("Error fetching top-rated entries:", error);
    } finally {
      await prisma.$disconnect();
    }
  }
);

export const validatingPicture = catchAsyncError(
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    console.log("come to validating picture");
    const { type, image } = req.body;
    if (!type || !image) {
      throw next(new ErrorHandler("All field Are required", 500));
    }
    if (type !== "profile" && type !== "cover" && type !== "logo") {
      throw next(new ErrorHandler("invalid type", 500));
    }
    next();
  }
);


export const handlingProfilePicture = catchAsyncError(
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    try {
      const member_id = req.member_id;
      console.log("came to handling profile picture");
      const { type, image } = req.body;
      if (type == "profile") {
        console.log("type is profile and updating profile picture");
        const updateProfilePicture = await prisma.member.update({
          where: { id: member_id },
          data: {
            profile_picture: image,
          },
        });
        res.status(200).json({
          success: true,
          message: "Profile Picture Update Sucessfully",
          data: updateProfilePicture,
        });
        console.log("Updated profile picture and exited ");
      } else {
        next();
      }
    } catch (error) {
      console.error(error);
    }
  }
);




export const handlingBussinessCover = catchAsyncError(
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    try {
      const bussiness_id = req.business_id;
      const { type, image } = req.body;
      console.log("handlingBussinessCover");
      if (type == "cover") {
        console.log("type is cover and updating profile picture");
        const updateCoverPicture = await prisma.businessProfile.update({
          where: { id: bussiness_id },
          data: {
            business_cover_image: image,
          },
        });
        res.status(200).json({
          success: true,
          message: "Profile Picture Update Sucessfully",
          data: updateCoverPicture,
        });
        console.log("Updated profile picture and exited ");
      } else {
        next();
      }
    } catch (error) {
      console.error(error);
    }
  }
);

export const updateBusinessLogo = catchAsyncError(
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    try {
      const bussiness_id = req.business_id;
      const { type, image } = req.body;
      console.log("handlingBussinessCover");
      if (type == "logo") {
        console.log("type is logo and updating logo picture");
        const updateCoverPicture = await prisma.businessProfile.update({
          where: { id: bussiness_id },
          data: {
            business_logo: image,
          },
        });
        res.status(200).json({
          success: true,
          message: "bussiness logo Update Sucessfully",
          data: updateCoverPicture,
        });
        console.log("Updated profile picture and exited ");
      }
    } catch (error) {
      // Handle error
      console.error(error);
      return {
        total: 0,
        levelZero: 0,
        childReferrals: 0,
        subChildReferrals: 0,
      };
    }
  }
);

export const getBusiness = catchAsyncError(
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    const bussiness_id = req.params.id;
    console.log("into bussiness detail");
    
    try {
      if (!bussiness_id) {
        throw new ErrorHandler("All field Are required ", 500);
      }

      const bussinessData = await prisma.businessProfile.findUnique({
        where: { id: bussiness_id },
      });

      console.log(bussinessData);

      if (!bussinessData) {
        throw next(new ErrorHandler("Bussiness id is not valid", 500));
      }

      const result = await prisma.businessProfile.findUnique({
        where: { id: bussiness_id },
        include: {
          Member: {
            include: {
              addresses: true,
            },
          },
          addresses: true,
          BusinessFeedback: {
            include: {
              Member: {
                select: {
                  full_name: true,
                  profile_picture: true,
                },
              },
            },
          },
          Interior_Exterior_Picture_Links: true,
          Social_Link: true,
        },
      });
      
      let averageRating: number; // Declare averageRating outside of the try block

      // Ensure result is not null and BusinessFeedback is not null or empty
      if (result && result.BusinessFeedback && result.BusinessFeedback.length > 0) {
        const totalRating = result.BusinessFeedback.reduce(
          (sum, feedback) => sum + (feedback.rating || 0), // Ensure feedback.rating exists
          0
        );
        averageRating = totalRating / result.BusinessFeedback.length;
      } else {
        averageRating = 0; // Set a default value if there are no feedbacks
      }

      console.log(result, "this is amount");
      res.status(200).json({
        success: true,
        message: "Earning details Fetched Successfully",
        data: { result: result, averageRating: averageRating },
      });
    } catch (error) {
      // Handle error
      console.error(error);
      return {
        total: 0,
        levelZero: 0,
        childReferrals: 0,
        subChildReferrals: 0,
      };
    }
  }
);

export const getMyBusiness = catchAsyncError(
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    const bussiness_id = req.business_id;
    console.log("into bussiness detail");
    try {
      const result = await prisma.businessProfile.findUnique({
        where: { id: bussiness_id },
        include: {
          addresses: true,
          BusinessFeedback: true,
          Interior_Exterior_Picture_Links: true,
          Social_Link: true,
        },
      });
      console.log(result, "this is amount");
      res.status(200).json({
        success: true,
        message: "Earning details Fetched SucessFully",
        data: result,
      });
    } catch (error) {
      // Handle error
      console.error(error);
      return {
        total: 0,
        levelZero: 0,
        childReferrals: 0,
        subChildReferrals: 0,
      };
    }
  }
);


type OrderHistoryWhereInput = {
  some: {
    sellerId: string,
    orderDate?: {
      gte: Date
    }
  }
}



export const getTotalProductSales = catchAsyncError(
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    try {
      const business_id = req.business_id;
      const member_id = req.member_id;
      const { filter, startDate: customStartDate, endDate: customEndDate } = req.query;

   
      let startDate: Date | null = null;
      let endDate: Date | null = null;

      const currentDate = new Date();
      const startOfDay = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        currentDate.getDate()
      );

      if (filter === 'week') {
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      } else if (filter === 'month') {
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      } else if (filter === 'year') {
        startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
        
      }
      else if (filter === 'today') {
        startDate = startOfDay; // Start of the current day
      }
      else if (customStartDate && customEndDate) {
        startDate = new Date(customStartDate as string);
        endDate = new Date(customEndDate as string);
      }

      // Step 1: Fetch total product sales
      const totalProductSales = await prisma.order.aggregate({
        _sum: {
          quantity: true
        },
        where: {
          orderHistory: {
            sellerId: business_id,
            orderDate: {
              gte: startDate || undefined // Filter by date if startDate is not null
            },
            orderStatus:'DELIVERED'
          }
        }
      });


      // Step 2: Calculate total earnings
      const orders = await prisma.order.findMany({
        where: {
          orderHistory: {
            sellerId: business_id,
            orderDate: {
              gte: startDate || undefined // Filter by date if startDate is not null
            },
             orderStatus:'DELIVERED',
          }
        },
        select: {
          amount: true,
          quantity: true,
          orderHistory: {
            select: {
              shippingFee: true,
            }
          }
        }
      });

      const totalEarnings = orders.reduce((acc, order) => {
        return acc + (order.amount * order.quantity) + (order.orderHistory.shippingFee ? order.orderHistory.shippingFee : 0);
      }, 0);

      // Step 3: Fetch ecommerce withdraw
      const memberInfo = await prisma.memberInfo.findUnique({
        where: {
          member_id: member_id
        }
      });

      const ecommerceWithdraw = memberInfo?.ecommerceWithdraw || 0;

      // Step 4: Calculate total balance
      const totalBalance = totalEarnings - ecommerceWithdraw;

      res.status(200).json({
        success: true,
        message: "Total product sales and earnings fetched successfully",
        data: {
          totalProductSales: totalProductSales._sum.quantity || 0,
          totalEarnings: totalEarnings,
          ecommerceWithdraw: ecommerceWithdraw,
          totalBalance: totalBalance
        }
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch total product sales and earnings",
        error: error
      });
    }
  }
);


export const updatingMemeberDetail = catchAsyncError(
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    const { member } = req.body;
  
    let memberId ;

    if(req.params.memberId){
      const user = await prisma.member.findUnique({
        where: { id:  req.params.memberId },
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
      });
      if (!user) {
        return next(new ErrorHandler("You are not a Valid User",401));
      }
      memberId = user.memberid
    }else{
       memberId = req.user.id;
    }

    try {
      if (member !== undefined) {
        if (!member.name || !member.job) {
          throw next(
            new ErrorHandler("Please Provide Member name and member Job ", 500)
          );
        }

        if (!Object.values(JobDetail).includes(member.job as JobDetail)) {
          throw new ErrorHandler("Invalid Job type", 400);
        }
      
        const updateMemberDetail = await prisma.member.update({
          where: { id: memberId },
          data: {
            full_name: member.name,
            Job_title: member.job as JobDetail,
          },
        });
        res.status(200).json({
          success: true,
          message: "Member details Update Sucessfully",
          data: updateMemberDetail,
        });
      } else {
        console.log("passed throught member");
        next();
      }
    } catch (error) {
      next(error);
    }
  }
);

export const updatingBusinessDetail = catchAsyncError(
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    const { business } = req.body;
  
    let bussinessId ;
    if(req.params.memberId){
      const user = await prisma.member.findUnique({
        where: { id:  req.params.memberId },
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
      });
      if (!user) {
        return next(new ErrorHandler("You are not a Valid User",401));
      }
      bussinessId = user.Business_Profile[0].id
    }
    else {
      bussinessId = req.business_id;
    }
    try {
      if (business !== undefined) {
        if (
          !business.name ||
          !business.type ||
          !business.hour ||
          !business.short_description
        ) {
          throw next(
            new ErrorHandler(
              "Please Provide All field to Update business detail ",
              500
            )
          );
        }

        const isValidBusinessType = await validateBusinessType(business.type);

      if (!isValidBusinessType) {
        return next(new ErrorHandler("Invalid business type", 400));
      }

      // Check if business detail exists
      const existingBusinessDetail = await prisma.businessProfile.findUnique({
        where: { id: bussinessId },
      });

      if (!existingBusinessDetail) {
        return next(new ErrorHandler("No business detail found", 404));
      }

        let other=" "

        if(business.other){
          other=business.other
        }

        const existingBankDetail = await prisma.businessProfile.findUnique({
          where: { id: bussinessId },
        });

        if (!existingBankDetail) {
          throw next(new ErrorHandler("No bussiness detail find  ", 500));
        }

        const dataToUpdate: { [key: string]: string } = {
          bussiness_name: business.name,
          Bussiness_type: business.type,
          business_hour: business.hour,
          short_description: business.short_description,
          otherType:other
        };
        
        if (business.description) {
          dataToUpdate.description = business.description;
        }

        if (business.website_link) {
          dataToUpdate.website_link = business.website_link;
        }

        console.log(bussinessId);
        console.log("into member");
        const updateMemberDetail = await prisma.businessProfile.update({
          where: { id: bussinessId },
          data: dataToUpdate,
        });
        res.status(200).json({
          success: true,
          message: "Bussiness details Update Sucessfully",
          data: updateMemberDetail,
        });
      } else {
        console.log("passed throught bussiness");
        next();
      }
    } catch (error) {
      next(error);
    }
  }
);

export const updatingBankDetail = catchAsyncError(
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    const { bank } = req.body;
    let bankId;
    if (req.params.memberId) {
      const user = await prisma.member.findUnique({
        where: { id: req.params.memberId },
        include: {
          Business_Profile: {
            include: {
              addresses: true,
            },
          },
          Bank_Detail: true,
          MemberInfo: true,
          addresses: {
            select: {
              id: true,
            },
          },
        },
      });
      if (!user) {
        return next(new ErrorHandler("You are not a Valid User", 401));
      }
      bankId = user.Bank_Detail[0].id;
    } else {
      bankId = req.bank_id;
    }

    try {
      // Check if any bank details are provided
      if (bank && (bank.account_number || bank.account_name || bank.bank_name || bank.ifsc_code || bank.upi_id)) {
        const existingBankDetail = await prisma.bankDetail.findUnique({
          where: { id: bankId },
        });

        if (!existingBankDetail) {
          throw next(new ErrorHandler("No bank detail found", 500));
        }

        // Define the data object with updated values for provided fields
        const dataToUpdate: { [key: string]: string } = {};
        if (bank.account_name) dataToUpdate.Account_name = bank.account_name;
        if (bank.account_number) dataToUpdate.Account_no = bank.account_number;
        if (bank.ifsc_code) dataToUpdate.Ifsc_code = bank.ifsc_code;
        if (bank.bank_name) dataToUpdate.bank_name = bank.bank_name;
        if (bank.upi_id) dataToUpdate.upi_id = bank.upi_id;

        // Update the bank detail
        const updatedBankDetail = await prisma.bankDetail.update({
          where: { id: bankId },
          data: dataToUpdate,
        });

        res.status(200).json({
          success: true,
          message: "Bank details updated successfully",
          data: updatedBankDetail,
        });
      } else {
        console.log("No bank details provided for update");
        next();
      }
    } catch (error) {
      next(error);
    }
  }
);

export const updatingAddressDetail = catchAsyncError(
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    const { address } = req.body;
    let addressId = req.address_id;

    if(req.params.memberId){
     
        const user = await prisma.member.findUnique({
          where: { id:  req.params.memberId },
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
        });
        if (!user) {
          return next(new ErrorHandler("You are not a Valid User",401));
        }
        addressId = user.addresses[0].id;
      
    }else{
    addressId = req.address_id;
    }

    try {
      // Find the bank detail for the member
      if (address !== undefined) {
        if (
          !address.address_line_1 ||
          !address.city ||
          !address.state ||
          !address.state ||
          !address.country ||
          !address.pincode
        ) {
          throw next(
            new ErrorHandler(
              "Please Provide All field for updating address detail ",
              500
            )
          );
        }
        console.log(addressId);
        const existingAddress = await prisma.memberAddress.findUnique({
          where: { id: addressId },
        });

        if (!existingAddress) {
          throw next(
            new ErrorHandler("Please Provide Member name and member Job ", 500)
          );
        }
        // Define the data object with updated values for non-empty fields
        const dataToUpdate: { [key: string]: string } = {
          address_line_1: address.address_line_1,
          address_line_2: address.address_line_2 || '',
          city: address.city,
          state: address.state,
          country: address.country,
          pincode: address.pincode,
        };

        // Update the bank detail
        const updatedMemberAddress = await prisma.memberAddress.update({
          where: { id: addressId },
          data: dataToUpdate,
        });

        res.status(200).json({
          success: true,
          message: "member address updated successfully",
          data: updatedMemberAddress,
        });
      } else {
        throw new ErrorHandler("Please Specify proper type", 500);
      }
    } catch (error) {
      next(error);
    }
  }
);

export const updatingBussinessAddressDetail = catchAsyncError(
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    const { address } = req.body;
   let  addressId ;
    let bussinessId ;

    if(req.params.memberId){
      const user = await prisma.member.findUnique({
        where: { id:  req.params.memberId },
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
      });
      if (!user) {
        return next(new ErrorHandler("You are not a Valid User",401));
      }
      addressId = user.addresses[0].id
      bussinessId = user.Business_Profile[0].id
    }
    else{
       addressId = req.business_address_id || 'nothing';
       bussinessId = req.business_id || 'nothing';
    }
    
    console.log(bussinessId,"this is addressId")

    try {
      // Find the bank detail for the member
      if (address !== undefined) {
        if (
          !address.address_line_1 ||
          !address.city ||
          !address.state ||
          !address.state ||
          !address.country ||
          !address.pincode
        ) {
          throw next(
            new ErrorHandler(
              "Please Provide All field for updating address detail ",
              500
            )
          );
        }
        
        const existingAddress = await prisma.bussinessAddress.findUnique({
          where: { id: addressId },
        });

        const dataToUpdate: { [key: string]: string } = {
          address_line_1: address.address_line_1,
          address_line_2: address.address_line_2 || "",
          city: address.city,
          state: address.state,
          country: address.country,
          pincode: address.pincode,
        };

        let updatedBussinessAddress
        if (!existingAddress) {
          dataToUpdate.business_ProfileId=bussinessId
            updatedBussinessAddress = await prisma.bussinessAddress.create({
            data:{
            address_line_1: address.address_line_1,
            business_ProfileId:bussinessId,
            address_line_2: address.address_line_2 || "",
            city: address.city,
            state: address.state,
            country: address.country,
            pincode: address.pincode,
            area:' ',
            type:'permanent'
           }
        });

        }
        else{
          updatedBussinessAddress = await prisma.bussinessAddress.update({
            where: { id:addressId },
            data: dataToUpdate
          });
        }
        // Define the data object with updated values for non-empty fields

        // Update the bank detail


        res.status(200).json({
          success: true,
          message: "bussiness address updated successfully",
          data: updatedBussinessAddress,
        });
      } else {
        throw new ErrorHandler("Please Specify proper type", 500);
      }
    } catch (error) {
      next(error);
    }
  }
);

export const updatingPersonalAddressDetail = catchAsyncError(
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    const { address } = req.body;
    const addressId = req.address_id ;
    const memberId = req.member_id ;
    console.log(memberId, "this is memberId");

    try {
      // Find the personal address detail
      if (address !== undefined) {
        if (
          !address.address_line_1 ||
          !address.city ||
          !address.state ||
          !address.country ||
          !address.pincode
        ) {
          throw next(
            new ErrorHandler(
              "Please Provide All fields for updating address detail",
              500
            )
          );
        }
        console.log(addressId);
        const existingAddress = await prisma.memberAddress.findUnique({
          where: { id: addressId },
        });

        const dataToUpdate: { [key: string]: string } = {
          address_line_1: address.address_line_1,
          address_line_2: address.address_line_2 || '', // Optional in the schema
          city: address.city,
          state: address.state,
          country: address.country,
          pincode: address.pincode,
        };

        let updatedPersonalAddress;
        if (!existingAddress) {
          dataToUpdate.member_id = memberId;
          updatedPersonalAddress = await prisma.memberAddress.create({
            data: {
              address_line_1: address.address_line_1,
              member_id: memberId,
              address_line_2: address.address_line_2 || '',
              city: address.city,
              state: address.state,
              country: address.country,
              pincode: address.pincode,
              type: 'permanent', // Assuming it's a permanent address
            },
          });
        } else {
          updatedPersonalAddress = await prisma.memberAddress.update({
            where: { id: addressId },
            data: dataToUpdate,
          });
        }

        res.status(200).json({
          success: true,
          message: "Personal address updated successfully",
          data: updatedPersonalAddress,
        });
      } else {
        throw new ErrorHandler("Please Specify proper type", 500);
      }
    } catch (error) {
      next(error);
    }
  }
);


export const verifyingUpdateData = catchAsyncError(
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    const { address, member, bank } = req.body;

    if (!address && !member! && !bank) {
      throw next(new ErrorHandler("Please Specify Which Field To update", 500));
    }

    if (address && member && bank) {
      throw next(
        new ErrorHandler("Please Specify only one Which  To update", 500)
      );
    }
    console.log("passed through validation");
    next();
  }
);

export const verifyingBussinessUpdateData = catchAsyncError(
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    const { address, business } = req.body;

    if (!business && !address) {
      throw next(new ErrorHandler("Please Specify Which Field To update", 500));
    }

    if (address && business) {
      throw next(
        new ErrorHandler("Please Specify only one Which  To update", 500)
      );
    }
    console.log("passed through validation");
    next();
  }
);

export const updateMyBusiness = catchAsyncError(
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    // console.log(memberId);
    // try {
    //   const updateData=prisma.member.update(
    //     {
    //       where:{id:memberId},
    //       data:{
    //       }
    //     }
    //   )
    // } catch (error) {
    //   next(error);
    // }
  }
);

export const testingImageUpload = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    // @ts-ignore
    const { profile_picture } = req.files;
    await uploadImageToCloudinary(profile_picture);

    if (!profile_picture) {
      return res.status(400).json({ error: "Image is required" });
    }

    // Upload the image to Cloudinary
    await uploadImageToCloudinary(profile_picture);
  }
);

export const getReferral = catchAsyncError(
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    try {
      console.log("Into getReferall")
      const masterReferalData = await prisma.referralTable.findMany({
        where: { referred_by: req.member_id, level: 0 },
        include:{
          Member:true
        }
      });

      res.status(200).json({
        message: "this is data",
        data: masterReferalData,
      });
    } catch (error) {
      console.log(error)
    }
  }
);

export const updatePersonalDetail = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const {email_id,  full_name ,Contact_no , Job_title} = req.body;
    const {memberId} = req.params;

    const  memberExists = await prisma.member.findUnique({
      where: { id: memberId },
    });

    if(!memberExists) {
      throw next(
        new ErrorHandler(
          "Member not found",
          404
        )
      );
    }

    try {
      const updatedMember = await prisma.member.update({
        where: { id:memberId },
        data: {
          email_id,
          full_name,
          Contact_no,
          Job_title
        },
      });
      res.status(200).json({
        success: true,
        message: "Personal details updated successfully",
      });
    } catch (error) {
      next(error);
    }
  }
)

export const validateRegistrationFields = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { Member, Bussiness, memberAddress, bank, businessAddress,upiId } = req.body;

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
      ["email", "member_name", "phone", "Job_title","password"],
      "Member"
    );
    validateFields(
      Bussiness,
      ["bussiness_name", "Bussiness_type", "bussiness_description"],
      "Bussiness"
    );
    validateFields(
      memberAddress,
      ["address_line_1", "city", "state", "pincode","country"],
      "Member Address"
    );
    if(!bank && !upiId){
      throw new Error(
        `Please Specify One thing Bank Or Upi Id `
      );
    }
    if(bank){
      validateFields(
        bank,
        ["Account_name", "Account_no", "Ifsc_code", "bank_name"],
        "Bank"
      );
    }

    validateFields(
      businessAddress,
      ["address_line_1", "city", "state", "area", "pincode","country"],
      "Business Address"
    );

    // Validate other sections similarly

    console.log("Passed through validateRegistrationFields");
    next();
  } catch (error: any) {
    return res.status(400).json({ success: false, error: error.message });
  }
};
