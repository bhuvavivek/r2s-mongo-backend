// admin.ts

import { PrismaClient, } from "@prisma/client"; // Import the PrismaClient
import { NextFunction, Response } from "express";
import { CustomRequest } from "../../middleware/auth";
import catchAsyncError from "../../middleware/catchAsyncError";
import ErrorHandler from "../../utils/errorhandler"; // Import your custom error handler if available



const prisma = new PrismaClient(); // Initialize PrismaClient



// function validateSocialMediaLink(url: string): string | null {
//   const instagramRegex = /(?:http(?:s)?:\/\/)?(?:www\.)?instagram\.com\/[\w\-]+\/?/;
//   const twitterRegex = /(?:http(?:s)?:\/\/)?(?:www\.)?twitter\.com\/[\w]+\/?/;
//   const linkedInRegex = /(?:http(?:s)?:\/\/)?(?:www\.)?linkedin\.com\/in\/[\w\-]+\/?/;
//   const facebookRegex = /(?:http(?:s)?:\/\/)?(?:www\.)?facebook\.com\/[\w\-]+\/?/;

//   if (instagramRegex.test(url)) {
//     return 'Instagram';
//   } else if (twitterRegex.test(url)) {
//     return 'Twitter';
//   } else if (linkedInRegex.test(url)) {
//     return 'LinkedIn';
//   } else if (facebookRegex.test(url)) {
//     return 'Facebook';
//   } else {
//     return null;
//   }
// }

const validateSocialMediaLink = (link: string, platform: string): boolean => {
  switch (platform) {
    case 'instagram':
      return /^(https?:\/\/)?(www\.)?instagram\.com\/[a-zA-Z0-9_.]+\/?$/.test(link);
    case 'linkedin':
      // Validate LinkedIn URL using a regex pattern
      return /^https?:\/\/(www\.)?linkedin\.com/.test(link);
    case 'facebook':
      // Validate Facebook URL using a regex pattern
      return /^https?:\/\/(www\.)?facebook\.com/.test(link);
    case 'twitter':
      // Validate Twitter URL using a regex pattern
      return /^https?:\/\/(www\.)?twitter\.com/.test(link);
    default:
      return false;
  }
};

// Update addSocialLinks function to receive CustomRequest instead of Request




// export const addSocialLink = catchAsyncError(
//   async (req: CustomRequest, res: Response, next: NextFunction) => {
//     try {
//       const { type, link: socialLink } = req.body as { type: string, link: string };

//       if (!type || !socialLink) {
//         throw new ErrorHandler("Type and link are required for the social link", 400);
//       }

//       if (!Object.values(SocialType).includes(type as SocialType)) {
//         throw new ErrorHandler("Invalid social link type", 400);
//       }

//       const createdLink = await prisma.socialLink.create({
//         data: {
//           business_id: req.business_id,
//           link: socialLink,
//           type: type as SocialType,
//         },
//       });

//       res.status(200).json({
//         success: true,
//         message: "Social Link Added Successfully",
//         data: createdLink,
//       });

//     } catch (error) {
//       next(error);
//     }
//   }
// );



export const updateSocialLinks = catchAsyncError(
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    try {
      let business_id 
      const {instagram,linkedin,youtube,twitter,facebook}=req.body
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
  business_id = user.Business_Profile[0].id
}else{
  business_id =  req.business_id
}


      const existingSocialLink = await prisma.socialLink.findUnique({
        where: { business_id: business_id },
      });
      
      if (!existingSocialLink) {
        throw next(new ErrorHandler("Social link not found for the given ID", 404));
      }
  

      const updatedData = await prisma.socialLink.update({
        where:{business_id:business_id},
        data:{
          instagram:instagram,
          linkedin:linkedin,
          twitter:twitter,
          youtube:youtube,
          facebook:facebook,
        }
      });

      res.status(200).json({
        success: true,
        message: "Update Successfully",
        data:updatedData
      });

    } catch (error) {
      next(error);
    }
  }
);

export const getSocialLinks = catchAsyncError(
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    try {
      const business_id = req.business_id;

      // Find the social links for the given business_id
      const socialLinks = await prisma.socialLink.findUnique({
        where: { business_id: business_id },
      });

      // Check if social links exist for the given business_id
      if (!socialLinks) {
        throw next(new ErrorHandler("Social links not found for the given ID", 404));
      }

      // Return the social links
      res.status(200).json({
        success: true,
        data: socialLinks
      });

    } catch (error) {
      next(error);
    }
  }
);


export const deleteSocialLinks = catchAsyncError(
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    const socialLinkId = req.params.id;
    try {
      const socialLinkData=await prisma.socialLink.findUnique({
        where:{id:socialLinkId}
      })
      


      if(!socialLinkData){
        throw next(new ErrorHandler("Link id is not valid",500))
      }

      const feedbackData = await prisma.socialLink.delete({
        where: {id:socialLinkId}
      });



      res.status(200).json({
        success: true,
        message: "Link Delete Successfully",
      });
    } catch (error) {
      next(error);
    }
  }
);

export default prisma;
