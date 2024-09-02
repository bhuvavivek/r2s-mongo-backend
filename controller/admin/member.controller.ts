// admin.ts

import { Prisma, PrismaClient, Status, } from '@prisma/client'; // Import the PrismaClient
import { NextFunction, Request, Response } from 'express';
import { CustomadminRequest } from "../../middleware/auth";
import catchAsyncError from '../../middleware/catchAsyncError';
import ErrorHandler from '../../utils/errorhandler'; // Import your custom error handler if available
import SuccessHandler from "../../utils/sucessReply";


const prisma = new PrismaClient(); // Initialize PrismaClient


export const getMembersProfiles = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const page = parseInt(req.query.page as string, 10) || 1;
    const itemsPerPage = parseInt(req.query.perpage as string, 10) || 20
      ;
    const validSortOrderValues = ["asc", "desc"];

    const sortOrderParam = req.query.sortOrder as string || "asc";
    try {

      const sortByParam = req.query.sortBy as string || 'Created_at';

      const orderBy = {
        [sortByParam]: sortOrderParam,
      };

      let filter: Prisma.memberWhereInput = {};

      const totalCount = await prisma.member.count({ where: filter });
      const offset = (page - 1) * itemsPerPage;

      if (req.query.status) {
        filter = {
          Status: { equals: req.query.status as Status },
        };
      }

      const results = await prisma.member.findMany({
        include: {
          MemberInfo: true
        },
        skip: offset,
        take: itemsPerPage,
        where: filter,
        orderBy,
      });

      const totalPages = Math.ceil(totalCount / itemsPerPage);

      SuccessHandler.sendSuccessResponse(res, "Member Profile Fetched Successfully", { results, totalPages });



    } catch (error) {
      throw next(new ErrorHandler(`${error}`, 500))
    }
  }
);




export const searchMember = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      memberid,
      full_name,
      Contact_no,
      email_id,
      bussiness_name,
      sort_by,
      order_by,
      perpage,
      page,
    } = req.query as Record<string, string>;

    // Parse page and perpage values to integers
    const pageParam = parseInt(page || '1');
    const itemsPerPage = parseInt(perpage || '20');

    // Define valid sort order values and sort by values
    type SortOrder = 'asc' | 'desc';
    type SortBy = 'Created_at' | 'Updated_at' | 'Status';
    const validSortOrderValues: SortOrder[] = ['asc', 'desc'];
    const validSortByValues: SortBy[] = ['Created_at', 'Updated_at', 'Status'];

    // Check if provided sort order and sort by values are valid, otherwise default to 'asc' and 'Created_at'
    const sortOrderParam = order_by || 'asc';
    const sortOrder: SortOrder = validSortOrderValues.includes(sortOrderParam as SortOrder) ? sortOrderParam as SortOrder : 'asc';

    const sortByParam = sort_by || 'Created_at';
    const sortBy: SortBy = validSortByValues.includes(sortByParam as SortBy) ? sortByParam as SortBy : 'Created_at';

    // Build the where condition dynamically based on the provided query parameters
    const where: any = {};

    // Apply the relevant search criteria based on the provided query parameters
    if (memberid) {
      where.memberid = { contains: memberid };
    }
    if (full_name) {
      where.full_name = { contains: full_name };
    }
    if (Contact_no) {
      where.Contact_no = { contains: Contact_no };
    }
    if (email_id) {
      where.email_id = { contains: email_id };
    }
    if (bussiness_name) {
      where.Business_Profile = { some: { bussiness_name: { contains: bussiness_name } } };
    }

    // Execute the Prisma query
    const results = await prisma.member.findMany({
      include: {
        MemberInfo: true
      },
      where,
      orderBy: {
        [sortBy]: sortOrder,
      },
      skip: (pageParam - 1) * itemsPerPage,
      take: itemsPerPage,
    });

    // Fetch total count for pagination
    const totalCount = await prisma.member.count({ where });

    // Calculate total pages
    const totalPages = Math.ceil(totalCount / itemsPerPage);

    // Send the response
    res.status(200).json({ results, totalCount, totalPages });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};







export const updateMemberStatus = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const { memberId } = req.params;
    const { status } = req.body;
    try {
      const updateData = await prisma.member.update({
        where: { id: memberId },
        data: {
          Status: status,
        },
      });

      SuccessHandler.sendSuccessResponse(res, `User details Updated SuccessFully`, updateData);

    } catch (error) {
      next(error);
    }
  }
);

export const updateMemberProfile = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const { memberId } = req.params;
    // pending
    // active
    // blocked
    const { status } = req.body;
    if (
      !status ||
      !memberId ||
      (status != "pending" && status != "active" && status != "blocked")
    ) {
      throw new ErrorHandler("Please Spicify Member id and status", 400);
    }
    // if(status!="pending" && status!="active" && status!="blocked"){
    //   throw new ErrorHandler('Invalid status', 400);
    // }
    console.log(memberId);
    try {
      const updateData = await prisma.member.update({
        where: { id: memberId },
        data: {
          Status: status,
          // Add other fields to update as needed
        },
      });
      // const memberdata = await prisma.member.findUnique({
      //   where: { member_id: memberId },
      //   include: {
      //     Business_Profile: true,
      //     Bank_Detail: true,
      //     Payment_History: true, // Include the Payment_History relationship
      //     // Include other relationships as needed
      //   },
      // });

      console.log(updateData);
      res.status(200).json({
        success: true,
        message: "Payment details Fetched SucessFully",
        data: updateData,

      });
    } catch (error) {
      next(error);
    }
  }
);

export const deleteMemberAccount = catchAsyncError(
  async (req: CustomadminRequest, res: Response, next: NextFunction) => {
    const accountId = req.params.id; // Assuming the account ID is passed as a parameter

    try {
      const member = await prisma.member.findUnique({
        where: { id: accountId },
        include: {
          Bank_Detail: true,
          MemberInfo: true,
          Payment_History: true,
          Business_Profile: {
            include: {
              Interior_Exterior_Picture_Links: true,
              Pictures: true
            }
          },

          BusinessFeedback: true,
          // Include other related tables as needed
        },
      });

      if (!member) {
        return next(new ErrorHandler('Account not found', 404));
      }

      // Delete associated bankDetail records

      await prisma.bankDetail.deleteMany({
        where: { member_id: accountId },
      });
      console.log('passed from here')

      await prisma.businessFeedback.deleteMany({
        where: { bussiness_id: member.Business_Profile[0].id },
      });

      await prisma.memberAddress.deleteMany({
        where: { member_id: accountId },
      });
      // Delete associated paymentHistory records
      await prisma.paymentHistory.deleteMany({
        where: { member_id: accountId },
      });

      await prisma.memberInfo.deleteMany({
        where: { member_id: accountId },
      });

      // Delete associated Payment_History records
      await prisma.payoutHistory.deleteMany({
        where: { member_id: accountId },
      });

      await prisma.bussinessAddress.deleteMany({
        where: { business_ProfileId: member.Business_Profile[0].id },
      });

      await prisma.interiorExteriorImages.deleteMany({
        where: { business_id: member.Business_Profile[0].id },
      });

      await prisma.pictures.deleteMany({
        where: { businessKey: member.Business_Profile[0].id },
      });

      await prisma.referralTable.deleteMany({
        where: { referred_by: accountId },
      });

      await prisma.referralTable.deleteMany({
        where: { referred_to: accountId },
      });

      await prisma.socialLink.deleteMany({
        where: { business_id: member.Business_Profile[0].id },
      });
      // Finally, delete the member



      await prisma.businessProfile.deleteMany({
        where: { member_id: member.Business_Profile[0].id },
      });


      // await prisma.memberInfo.delete({
      //   where: { member_id:accountId },
      // });

      await prisma.member.delete({
        where: { id: accountId },
      });

      res.status(200).json({
        success: true,
        message: 'Account deleted successfully',
      });
    } catch (error) {
      next(error);
    } finally {
      await prisma.$disconnect(); // Close the Prisma client connection
    }
  }
);


export const fetchMemberProfile = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const { memberId } = req.params;
    console.log(memberId);
    try {
      const memberdata = await prisma.member.findUnique({
        where: { id: memberId },
        include: {
          Business_Profile: {
            include: {
              Interior_Exterior_Picture_Links: true,
              Pictures: true,
              addresses: true,
              Social_Link: true,
            },
          },
          Bank_Detail: true,
        },
      });

      res.status(200).json({
        success: true,
        message: 'Fetch Sucess Sucessfully',
        data: memberdata
      });
    } catch (error) {
      next(error);
    }
  }
);




//  BUSSINESS TYPES 



export const addBusinessType = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  const { type } = req.body; // Destructure 'type' from the request body

  if (!type) {
    return res.status(400).json({ success: false, message: "Business type is required" });
  }

  // Insert into businessType table
  const newBusinessType = await prisma.bussinessType.create({
    data: {
      type, // The business type to add
    },
  });

  res.status(201).json({
    success: true,
    message: 'Business type added successfully',
    data: newBusinessType,
  });
});


export const getAllBusinessTypes = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    // Default pagination parameters
    const page = parseInt(req.query.page as string) || 1; // Default to page 1
    const pageSize = parseInt(req.query.pageSize as string) || 10; // Default page size

    // Calculate the records to skip and take
    const skip = (page - 1) * pageSize; // Skip the correct number of records
    const take = pageSize; // Take the correct number of records

    // Fetch the total count of business types
    const totalBusinessTypes = await prisma.bussinessType.count(); // Get the total count

    // Fetch the paginated business types
    const businessTypes = await prisma.bussinessType.findMany({
      skip,
      take,
    });

    // Return the paginated data along with the total count
    res.status(200).json({
      success: true,
      message: 'All business types fetched successfully',
      total: totalBusinessTypes, // Total count of records
      data: businessTypes, // The paginated data
      currentPage: page, // Current page number
      totalPages: Math.ceil(totalBusinessTypes / pageSize), // Total number of pages
    });
  }
);

export const getSingleBusinessType = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params; // Get the ID from the request parameters

    if (!id) {
      return res.status(400).json({ success: false, message: "Business type ID is required" });
    }

    const businessType = await prisma.bussinessType.findUnique({
      where: { id }, // Use the ID to fetch a specific business type
    });

    if (!businessType) {
      return res.status(404).json({ success: false, message: "Business type not found" }); // Return 404 if not found
    }

    res.status(200).json({
      success: true,
      message: 'Business type fetched successfully',
      data: businessType,
    });
  }
);

export const deleteBusinessType = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params; // Get the ID from the request parameters

    if (!id) {
      return res.status(400).json({ success: false, message: "Business type ID is required" });
    }

    const deletedBusinessType = await prisma.bussinessType.delete({
      where: { id }, // Use the ID to find and delete
    });

    res.status(200).json({
      success: true,
      message: 'Business type deleted successfully',
      data: deletedBusinessType,
    });
  }
);


