import { PrismaClient, bussinessType } from "@prisma/client"; // Import the PrismaClient
import cloudinary from "cloudinary";
import { NextFunction, Request, Response } from "express";
import fs from "fs";
import { CustomRequest } from "../middleware/auth";
import catchAsyncError from "../middleware/catchAsyncError";
import ErrorHandler from "../utils/errorhandler"; // Import your custom error handler if available


import crypto from "crypto";
const dotenv = require("dotenv");
dotenv.config();

const prisma = new PrismaClient(); // Initialize PrismaClient
// const accountSid = process.env.TWILIO_ACCOUNT_SID;

interface CustomBusinessRequest extends Request {
  is_sales_person?: boolean;
}

cloudinary.v2.config({
  cloud_name: "dfznwn1fr",
  api_key: "697859574319988",
  api_secret: "AihAZUQMOk9yzX6v_RfRy7rq-oM",
});


// cloudinary.v2.config({
//   cloud_name: "dat5o67ac",
//   api_key: "835764586478217",
//   api_secret: "g04BK5xvgqv75QtSAE-IGHp4IdU",
// });



const accountSid: string = process.env.TWILIO_ACCOUNT_SID || '';
const authToken: string = process.env.TWILIO_TOKEN || '';
const twilioNum: string = process.env.TWILIO_PHONE_NUMBER || '';
const smsKey: string = process.env.SMS_SECRET_KEY || '';

const client: any = require('twilio')(accountSid, authToken);


export const sendOTP = catchAsyncError(async (req: CustomRequest, res: Response, next: NextFunction) => {
  const phone :string=req.phone
  if(!phone){
    throw next(new ErrorHandler("Please Provide Phone no. to Send Otp",500))
  }
  const formatPhone: string = "+91" + req.phone;
  const otp: number = Math.floor(100000 + Math.random() * 900000);
  
  const ttl: number = 20 * 60 * 1000;
  const expires: number = Date.now() + ttl;
  const data: string = `${phone}.${otp}.${expires}`;
  const hash: string = crypto.createHmac("sha256", smsKey).update(data).digest("hex");
  const fullHash: string = `${hash}.${expires}`;

  console.log("this is twillo details", twilioNum, phone,accountSid,authToken);


  client.messages
    .create({
      body: `Your One Time Login Password For TBCOI Bussiness is ${otp}. Valid only for 2 minutes`,
      from: twilioNum,
      friendlyName: "My First Verify Service",
      to: formatPhone,
    })
    .then((messages: any) => {
      res.status(200).send({
                    success: true,
                    message: "Otp Sent SucessFully!",
                    data: {
                     phone,
                     hash:fullHash
                    },
                  });
    })
    .catch((err: any) => {
      console.log(err);
      return next(new ErrorHandler(err, 400));
    });

  // If none of the error conditions are met, proceed with sending OTP
  // next();
});

export function uploadImageToCloudinary(imageBuffer: Buffer) {
  return new Promise<string>((resolve, reject) => {
    // Upload the image to Cloudinary
    cloudinary.v2.uploader
      .upload_stream({ resource_type: "image" }, (error, result) => {
        if (error) {
          reject(error);
        } else if (result && result.secure_url) {
          resolve(result.secure_url);
        } else {
          reject(new Error("Image upload to Cloudinary failed."));
        }
      })
      .end(imageBuffer);
  });
}

export async function deleteImage(key: string): Promise<boolean> {
  return new Promise<boolean>((resolve, reject) => {
    cloudinary.v2.uploader.destroy(key, (err, result) => {
      if (err) {
        reject(err);
      } else {
        if (result.result === 'ok') {
          resolve(true); // Image deletion succeeded
        } else {
          resolve(false); // Image deletion failed
        }
      }
    });
  });
}

const removeTmp = (path: string): void => {
  fs.unlink(path, (err) => {
    if (err) {
      console.error("Some error occurred while removing the file.");
    }
  });
};

function generateRandomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
export function generateMemberId(email: string, name: string,) {
  let toggle=true

  let [firstName, lastName] = name.split('-');

  // If there's only one name, pick the first two letters
  if (!lastName) {
    firstName = firstName.slice(0, 2);
    lastName = ''; // Reset lastName as an empty string
  } else {
    // If there are two parts, take the first letter of each part
    firstName = firstName.charAt(0);
    lastName = lastName.charAt(0);
  }
  // Create the required Member ID format
  const memberId = `R2S${firstName.charAt(0)}${lastName.charAt(0)}${generateRandomNumber(100000, 999999)}`;

  return memberId
}

export function generateReferralCode(
  phoneNumber: string,
  email: string,
  name: string
) {
  // Combine the phone number, email, and name into a single string
  const dataToHash = `${phoneNumber}${email}${name}`;

  // Create a unique hash based on the combined data
  const hash = crypto.createHash("sha256");
  hash.update(dataToHash);
  const referralCode = hash.digest("hex").slice(0, 8);

  return referralCode.toUpperCase();
}


interface SearchCriteria {
  bussiness_type?: bussinessType;
  bussiness_name?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  pincode_or_area?:string;
}

export const verifyUserExistence = catchAsyncError(
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    const { phone, type } = req.body;
    req.phone = phone;
    if (!type || !phone || (type !== "REGISTRATION" && type != "LOGIN")) {
      throw new ErrorHandler("Please Provide Valid Type ex:-REGISTRATION or LOGIN  ", 400);
    }
    try {
      const memberdata = await prisma.member.findUnique({
        where: { Contact_no: phone }, // Use 'Contact_no' to search
      });


      if(!memberdata){
        console.log(" i didnt find member detail associated to it ")
      }

      if (!memberdata && type === "LOGIN") {
        throw new ErrorHandler("User Is not Registerd", 400);
      }
      if (memberdata && type === "REGISTRATION") {
        throw new ErrorHandler("User already Registered", 400);
      }
      req.user = memberdata;
      next();
      // res.status(200).send({
      //     success: true,
      //     message: "Updated Scuessfully",
      //     user: memberdata,
      //   });
    } catch (error) {
      next(error);
    }
  }
);

export const SendOtp = catchAsyncError(
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    const smsKey = process.env.SMS_SECRET_KEY || "";
    console.log(smsKey);
    const phone = req.phone;
    const member = req.user;
    const otp = Math.floor(100000 + Math.random() * 900000);
    const ttl = 5 * 60 * 1000;
    const expires = Date.now() + ttl;
    const data = `${phone}.${otp}.${expires}`;
    const hash = crypto.createHmac("sha256", smsKey).update(data).digest("hex");
    const fullHash = `${hash}.${expires}`;
    try {
      console.log(member);
      res.status(200).send({
        success: true,
        message: "Otp sent",
        data: {
          otp: otp,
          hash: fullHash,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);


// export async function checkAccountExistence(req: Request, res: Response, next: NextFunction) {
//   try {
//     const { phone } = req.body
//     if (phone) {
//       const result = await prisma.member.findFirst({
//         where: {
//           Contact_no: phone
//         }
//       })

//       if (result) {
//         res.status(200).json(
//           {
//             success: true,
//             message: "Account is already exist with number, try logIn!",
//             data: {
//               isExist: true
//             },
//           }
//         )
//       }else{
//         res.status(200).json(
//           {
//             success: true,
//             message: "Account not exist!",
//             data: {
//               isExist: false
//             },
//           }
//         )
//       }

//     } else {
//       throw new ErrorHandler("Phone number should not be empty!", 400)
//     }

//   } catch (error) {
//     next(error)
//   }

// }

type BusinessType = {
  id: string;
  type: string;
  Created_at: Date;
  Updated_at: Date;
};

// Function to validate business type from the database



export async function validateBusinessType(type: string): Promise<string | undefined> {
  try {
    console.log(type)

    const businessType = await prisma.bussinessType.findFirst({
      where: { type },
    });
    console.log(businessType)
    return businessType ? businessType.type : undefined; // Return 'type' if found
  } catch (error) {
    console.error("Error validating business type:", error);
    return undefined; // Default to undefined in case of error
  }
}


async function updateEarningCount(
  member_id:string
) {
 
await prisma.referralTable.updateMany({
  where:{referred_to:member_id},
  data:{
    status:'approved'
  }
})
}


// export const searchBykeywords = catchAsyncError(
//   async (req: Request, res: Response, next: NextFunction) => {
//     try {
//       const { bussinessType, bussiness_name, city, state, country, pincode_or_area } =
//         req.query;
      

//         console.log("bussiness type is ",bussinessType)
//         const validBusinessType = await validateBusinessType(bussinessType);
//         console.log(validBusinessType)

//         if (!validBusinessType) {
//           return res.status(400).json({ error: "Invalid or missing business type parameter" });
//         }
  

//       // Create a search criteria object with proper type casting
//       const searchCriteria: SearchCriteria = {
//         bussiness_type: validBusinessType,
//         bussiness_name: bussiness_name as string,
//         city: city as string, // Adjusted to accept either string or array of strings
//         state: state as string,
//         pincode_or_area: pincode_or_area as string,
//       };

//       const results = await prisma.businessProfile.findMany({
//         where: {
//           Bussiness_type: validBusinessType,
//           addresses: {
//             some: {
//               city: searchCriteria.city,
//               state: searchCriteria.state,
//               OR: [
//                 { pincode: pincode_or_area as string },
//                 { area: pincode_or_area as string },
//               ],
//             },
//           },
//         },
//         include:{
//           addresses:{
//             select:{
//               pincode:true,
//               city:true,
//               state:true,
//               country:true
//             }
//           },
//           Member:{
//             select:{
//               full_name:true,
//               Job_title:true,
//               profile_picture:true,
//             }
//           },
//         },
//       });

//       res.status(200).json({
//         success: true,
//         message: "Bussiness detail fetched Fetched SucessFully",
//         data: results,
//       });
//     } catch (error) {
//       console.error(error);
//       res.status(500).json({ error: "Internal Server Error" });
//     }
//   }
// );

export const searchBykeywords = catchAsyncError(
  async (req: CustomBusinessRequest, res: Response, next: NextFunction) => {

    const isSalesPerson = req.is_sales_person;
    const {
      business_name,
      businessType,
      city,
      state,
      pincode,
    } = req.query;

    // Build the search condition
    const whereCondition: any = {};


// Optional filters: only add to whereCondition if specified
if (business_name) {
  whereCondition.business_name = business_name;
}

if (businessType) {
  whereCondition.Bussiness_type = businessType;
}

// Address-based filtering
const addressCondition: any = {};
if (city) {
  addressCondition.city = city;
}
if (state) {
  addressCondition.state = state;
}
if (pincode) {
  addressCondition.pincode = pincode;
}

  whereCondition.Member = { is_sales_person: false }


if (Object.keys(addressCondition).length > 0) {
  whereCondition.addresses = {
    some: addressCondition,
  };
}


    try {
      const results = await prisma.businessProfile.findMany({
        where: whereCondition, // Apply whereCondition for filtering
        include: {
          addresses: {
            select: {
              pincode: true,
              city: true,
              state: true,
              country: true,
            },
          },
          Member: {
            select: {
              full_name: true,
              Job_title: true,
              profile_picture: true,
            },
          },
          // Include other related models as needed
        },
      });

      console.log("this is founded result",results)
      res.status(200).json({
        success: true,
        message: "Business profiles fetched successfully",
        data: results,
      });
    } catch (error) {
      console.error("Error fetching business profiles:", error);
      res.status(500).json({ error: "Internal Server Error" }); // Handle server errors
    }
  }
);


export const getSharedProfile = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const username =
        req.query.username as string ;

      // Create a search criteria object with proper type casting
      if(!username){
        return next(new ErrorHandler("Please Give Username",500))
      }
      else{
        const results = await prisma.member.findUnique({
          where:{memberid:username},
          include:{
            Business_Profile:{
              include:{
                
                Social_Link:true,
                Interior_Exterior_Picture_Links:true,
                Pictures:true
              },
              
            },
            addresses:false,
            
           
          }
        });
          
        const findBusinessFeedback = await prisma.businessFeedback.findMany({
          where:{
            bussiness_id:results?.Business_Profile[0]?.id
          }
        })
       

        const feedback = findBusinessFeedback ?? [];

        const totalRatings = feedback.length; // Total number of ratings
        const totalRatingValue = feedback.reduce((acc, item) => acc + item.rating, 0); // Sum of all ratings
  
        const averageRating = totalRatings > 0 ? totalRatingValue / totalRatings : 0; // Average rating
  




        if(!results){
          return next(new ErrorHandler("Detail not Found",500))
        }
        
        else{
          const combinedPictures = [
            ...results.Business_Profile[0].Interior_Exterior_Picture_Links,
            ...results.Business_Profile[0].Pictures,
          ];

          // Shuffle the combined array
          combinedPictures.sort(() => Math.random() - 0.5);

          // Select 4 random images
          const selectedImages = combinedPictures.slice(0, 4);
          res.status(200).json({
            success: true,
            message: "Bussiness detail fetched Fetched SucessFully",
            data: {results,selectedImages,averageRating
              ,totalRatings}
          });
        }
      }
  
      
      
    

    
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);



export const handlingSearchRestriction = catchAsyncError(
  async (req: CustomRequest, res: Response, next: NextFunction) => 
  {
    try {
      const search_limit=req.search_limit

      console.log(search_limit)

      if(!search_limit){
        throw next(new ErrorHandler("Something went Wrong ",500))
      }

      console.log(search_limit,"sssssssssssssssss")
      const search_count=req.search_count
      if(search_count===search_limit){
        throw next(new ErrorHandler("Your Search Limit Has Reached ",500))
      }
      else{
        const update =await prisma.member.update({
          where:{id:req.member_id},
          data:{
            search_count:search_count+1
          }
         })
        next()
      }

  
     } catch (error) {
       console.error("Registration failed  handle search Restrciton :", error);
     }
  }
);



export const configuringSearchLimit = catchAsyncError(
  async (req: CustomRequest, res: Response, next: NextFunction) => 
  {
    try {
      const data =await prisma.additionalDetail.findUnique({
       where:{id:"1"},
       select:{
         search_limit:true,
       }
      })

      console.log("configuringSearchLimit called",req.user.name)

      if(req.is_premium){
      console.log("User is premium ")
      req.search_limit=data?.search_limit || 50
      next()
      }
      else{
        console.log("User is not premium ")
        req.search_limit=data?.search_limit || 30
        next()
      }      
     } catch (error) {
       console.error("Registration failed:", error);
     }
  }
);


export const handlingUserIsPremium = catchAsyncError(
  async (req: CustomRequest, res: Response, next: NextFunction) => 
  {
    const memberId=req.member_id
    const memberStatus=req.member_status
    try {
      

      if(memberStatus==="blocked"  ){
        throw next(new ErrorHandler("Please Wait For Your Payment Confirmation to Be done",500))
        
      }
      else{
        next()
      }      
     } catch (error) {
       console.error("Registration failed:", error);
     }
  }
);

export async function updateEarningStatus() {

  const approvedReferrals = await prisma.referralTable.groupBy({
    by: ['referred_by'],
    where: {
      status: 'approved',
    },
    _sum:{
      amount:true
    }
  });

  console.log("approved refered by user",approvedReferrals);


  for (const referral of approvedReferrals) {

    console.log("this is a single referall",referral);

    const { referred_by, _sum } = referral;
    // const totalEarnings = _sum?.amount 
    const totalEarnings = _sum?.amount  || null;

    console.log('total earning ',totalEarnings);

    console.log(_sum.amount)
    if (totalEarnings !==  null) {
      const earningsValue: number = parseFloat(totalEarnings.toString());


      console.log("this is a earning value",earningsValue);

      const data = await prisma.memberInfo.updateMany({
        where: {
          member_id:referred_by 
        },
        data: {
          revenue: earningsValue
        }
      });
      console.log(data)
    }
  }

  console.log(approvedReferrals)
}

export async function updateSingleEarningStatus(member_id:string) {

  console.log("updateSingleEarningStatus running for", member_id);
  const approvedReferrals = await prisma.referralTable.groupBy({
    by: ['referred_by'],
    where: {
      status: 'approved',
      referred_by:member_id
    },
    _sum:{
      amount:true
    }
  });


  for (const referral of approvedReferrals) {
    const { referred_by, _sum } = referral;
    // const totalEarnings = _sum?.amount 
    const totalEarnings = _sum?.amount || null;


    if (totalEarnings !==  null) {
      const earningsValue: number = parseFloat(totalEarnings.toString());
      const data=await prisma.memberInfo.update({
        where: {
          member_id:referred_by 
        },
        data: {
          revenue: earningsValue
        }
      });
      console.log(data , "updated referal Data")
    }
  }

}

export async function updateAllBalances() {
  try {
    const allMembers = await prisma.memberInfo.findMany();

    await Promise.all(
      allMembers.map(async (member) => {
        const revenue = Number(member.revenue); // Convert Prisma.Decimal to number
        const withdrawal = Number(member.withdrawl); // Convert Prisma.Decimal to number

        const newBalance = revenue - withdrawal;

        await prisma.memberInfo.update({
          where: {
            member_id: member.member_id,
          },
          data: {
            balance: newBalance,
          },
        });
      })
    );
    console.log('All balances updated successfully')
    return { success: true, message: 'All balances updated successfully' };
  } catch (error) {
    return { success:false,error };
  }
}



export async function updateSingleBalance(member_id: string) {
  try {
    console.log("updateSingleBalance running for", member_id);

    const member = await prisma.memberInfo.findUnique({
      where: { member_id: member_id },
    });

    if (!member) {
      console.log('Member not found');
      return { success: false, message: 'Member not found' };
    }

    const revenue = Number(member.revenue); // Convert Prisma.Decimal to number
    const withdrawal = Number(member.withdrawl); // Convert Prisma.Decimal to number

    const newBalance = revenue - withdrawal;


    const updateData=await prisma.memberInfo.updateMany({
      where: {
        member_id: member_id,
      },
      data: {
        balance: newBalance,
      },
    });

    console.log("Balance updated successfully", updateData, newBalance);
    return { success: true, message: 'Balance updated successfully' };
  } catch (error) {
    console.error('Error updating balance:', error);
    return { success: false, error };
  }
}



export async function updateSingleBalanceWithReferal(member_id:string) {
  console.log("update Balance with referral running");
  try {
    const allMembers = await prisma.referralTable.findMany({
      where:{referred_to:member_id}
    });
 

    for (const member of allMembers) {
      await updateSingleEarningStatus(member.referred_by);
    }

    // Update balance for all members
    for (const member of allMembers) {
      await updateSingleBalance(member.referred_by);
    }
    console.log('All balances updated successfully');
    return { success: true, message: 'All balances updated successfully' };
  } catch (error) {
    return { success:false,error };
  }
}
