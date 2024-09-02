// admin.ts

import { NextFunction, Response } from "express";
import { CustomRequest } from "../../middleware/auth";

import {
  BookingStatus,
  PrismaClient
} from "@prisma/client"; // Import the PrismaClient
import catchAsyncError from "../../middleware/catchAsyncError";
import ErrorHandler from "../../utils/errorhandler"; // Import your custom error handler if available
const prisma = new PrismaClient(); // Initialize PrismaClient


// addProduct,updateProduct,getMyproducts,getTopRatedProducts,getBusinessProducts,SearchProduct

export const addServices = catchAsyncError(
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    try {
      const { price, title, description, images } = req.body;

      if (!price || !title || !description) {
        throw new ErrorHandler("All Field Are required", 400);
      }

      const businessId = req.business_id;

      const businessExists = await prisma.businessProfile.findUnique({
        where: { id: businessId },
      });

      if (!businessExists) {
        throw next(new ErrorHandler("Business not found", 400));
      } else {
        let picturesData = {};

        if (images && Array.isArray(images)) {
          picturesData = {
            create: images.map((image: any) => {
              return {
                image_url: image.link,
                image_key: image.key,
              };
            }),
          };
        }

        const productData = await prisma.services.create({
          data: {
            bussiness_id: businessId,
            price: price,
            title: title,
            description: description,
            pictures: picturesData,
          },
          include: {
            pictures: true,
          },
        });

     

        res.status(200).json({
          success: true,
          message: "Services Picture Added Successfully",
          data: productData,
        });
      }
    } catch (error) {
      next(error);
    }
  }
);

export const handleProductPictureUpload = catchAsyncError(
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    const serviceId = req.service_id;
 
    const { images } = req.body;

    if (images.length === 0) {
      throw next(new ErrorHandler("Minimum one image is Required", 400));
    }
    try {
      for (const image of images) {
        await prisma.pictures.create({
          data: {
            productKey: serviceId,
            image_url: image.link,
            image_key: image.key,
          },
        });
      }
      const serviceData = await prisma.services.findUnique({
        where: { id: serviceId },
        include: {
          pictures: true,
        },
      });
      res.status(200).json({
        success: true,
        message: "Product Updated Successfully",
        data: serviceData,
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

enum SortBy {
  CREATED_AT = "created_at",
  UPDATED_AT = "updated_at",
}

enum SortOrder {
  ASC = "asc",
  DESC = "desc",
}

export const updateService = catchAsyncError(
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    const productId = req.params.id;
    const { price, title, description } = req.body;

    if (!price || !title || !description) {
      throw next(new ErrorHandler("All Field Are  required", 400));
    }
    try {
      const productExists = await prisma.services.findUnique({
        where: { id: productId },
        include: {
          pictures: true
        }
      });

      if (!productExists) {
        throw next(new ErrorHandler("Services not found", 400));
      }
      const ProductData = await prisma.services.update({
        where: {
          id: productId,
        },
        data: {
          price: price,
          title: title,
          description: description,

        },

      });
      res.status(200).json({
        success: true,
        message: "Services Updated Successfully",
        data: ProductData,
      });
    } catch (error) {
      console.error("Services details fetch failed:", error);
      res.status(500).json({
        success: false,
        message: "Services details fetch failed",
        error: error,
      });
    }
  }
);

export const getSingleService = catchAsyncError(
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    const serviceId = req.params.id;
    try {
    
      const productExists = await prisma.services.findUnique({
        where: { id: serviceId },
      });

      if (!productExists) {
        throw next(new ErrorHandler("Services not found", 400));
      }
      const serviceData = await prisma.services.findUnique({
        where: {
          id: serviceId,
        },
        include: {
          pictures: true,
          businessFeedback: true
        }
      });

      
      const productFeedback = await prisma.businessFeedback.findMany({
        where: { service_id: serviceId },
      });

      let averageRating: number;
      if (productFeedback.length > 0) {
        const totalRating = productFeedback.reduce(
          (sum, feedback) => sum + (feedback.rating || 0),
          0
        );
        averageRating = totalRating / productFeedback.length;
      } else {
        averageRating = 0;
      }

      res.status(200).json({
        success: true,
        message: "Services Updated Successfully",
        data: {...serviceData,averageRating:averageRating},
      });
    } catch (error) {
      console.error("Services details fetch failed:", error);
    }
  }
);

export const deleteService = catchAsyncError(
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    const serviceId = req.params.id;
    try {
      const serviceExists = await prisma.services.findUnique({
        where: { id: serviceId },
      });

      if (!serviceExists) {
        throw next(new ErrorHandler("Services not found", 400));
      }
      const serviceData = await prisma.services.delete({
        where: {
          id: serviceId,
        },
      });
      res.status(200).json({
        success: true,
        message: "Services deleted Successfully",
      });
    } catch (error) {
      console.error("Services details fetch failed:", error);
      res.status(500).json({
        success: false,
        message: "Services details fetch failed",
        error: error,
      });
    }
  }
);

export const getMyService = catchAsyncError(
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    let bussiness_id;
     // Pagination parameters with default values
     const pageSizeParam = req.query.pageSize;
     const pageParam = req.query.page;
 
     const pageSize = (typeof pageSizeParam === 'string' && parseInt(pageSizeParam)) || 10; // Default size of 10
     const page = (typeof pageParam === 'string' && parseInt(pageParam)) || 1;// Default to first page
 
     // Calculate the offset for pagination
     const skip = (page - 1) * pageSize;
    // for search
     const searchQuery = (req.query.search as string || '').trim();

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
      bussiness_id = user.Business_Profile[0].id
    }
    else {
      bussiness_id = req.business_id;
    }
    try {
      let totalServiceCount;
        let myProductData;

      if(searchQuery){
         myProductData = await prisma.services.findMany({
          where: {
            bussiness_id: bussiness_id,
            title:{
              contains: searchQuery,
            }
          },
          include: {
            pictures: true,
            businessFeedback: true
          },
        });

        totalServiceCount = myProductData.length || 0
      }else{
         totalServiceCount = await prisma.services.count({
          where: {
            bussiness_id: bussiness_id,
          },
        });
  
         myProductData = await prisma.services.findMany({
          where: {
            bussiness_id: bussiness_id,
          },
          include: {
            pictures: true,
            businessFeedback: true
          },
          take:pageSize,
          skip
        });
      }
   

      res.status(200).json({
        success: true,
        message: "Services details Fetched Successfully",
        data: myProductData,
        pagination: {
          currentPage: page,
          pageSize: pageSize,
          totalResults: totalServiceCount,
          totalPages: Math.ceil(totalServiceCount / pageSize),
        },
      });
    } catch (error) {
      console.error("Services details fetch failed:", error);
      res.status(500).json({
        success: false,
        message: "Services details fetch failed",
        error: error,
      });
    }
  }
);


interface LocationQuery  {
  state?: string;
  city?: string;
}

export const getTopRatedService = catchAsyncError(
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    try {
      const page: any = req.query.page || 1; // Assign a default value if page is not provided
      const pageSize = 30;
      const skip = (Number(page) - 1) * pageSize; // Explicitly cast page to number
      const business_id = req.business_id
      const {state ,city  } = req.query  as LocationQuery;


      let addressQuery : Record<string, string> = {};
      if( state !== undefined  && state.trim() !==''){
        addressQuery = {
        ...addressQuery,
          state
        }
      }

      if(city !== undefined  && city.trim() !==''){
        addressQuery = {
      ...addressQuery,
        city
        }
      }
      const whereCondition: any = {
        NOT: {
          bussiness_id: business_id,
        },}

        if (Object.keys(addressQuery).length > 0) {
          whereCondition.Bussiness = {
            addresses: {
              some: addressQuery,
            },
          };
        }

      const totalRecords = await prisma.services.count({
          where: whereCondition,
        });

      const totalPages = Math.ceil(totalRecords / pageSize);

      const result = await prisma.services.findMany({
        take: pageSize,
        skip,
        where:whereCondition,
        include: {
          pictures: true,
          businessFeedback: true
        }
      });

      res.status(200).json({
        success: true,
        message: "Services Fetched Successfully",
        data: {
          currentPage: Number(page),
          totalPages,
          result,
        },
      });

    
    } catch (error) {
      console.error("Error fetching top-rated entries:", error);
    } finally {
      await prisma.$disconnect();
    }
  }
);

export const getBusinessService = catchAsyncError(
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    try {
      const bussinessId = req.params.id;
      const { status } = req.body;

      if (!bussinessId) {
        throw new ErrorHandler("Image ID and URL are required", 400);
      }

      const productData = await prisma.services.findMany({
        where: { bussiness_id: bussinessId },
        include: {
          pictures: true,
          businessFeedback: true
        }
      });

      if (!productData) {
        throw new ErrorHandler("Services not found", 400);
      }
      
      res.status(200).json({
        success: true,
        message: "Services Picture Updated Successfully",
        data: productData,
      });
    } catch (error) {
      next(error);
    }
  }
);

interface SearchServiceCriteria {
  title?: string;
  description?: string;
}

export const SearchServices = catchAsyncError(
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    const query = req.query.query as string;
    const page = parseInt(req.query.page as string, 10) || 1;
    const pageSize = parseInt(req.query.perpage as string, 10) || 20;
    const business_id = req.business_id
    try {

      let WhereCondition : any = {
        NOT: {
          bussiness_id: business_id,
        },
      }
     
      if(query && query.trim() !== ''){
     WhereCondition = { 
    OR: [
    { title: { contains: (query as string).toLowerCase() } },
    { description: { contains: (query as string).toLowerCase() } },
  ],
  NOT: {
    bussiness_id: business_id,
  },
      }
 }


      const offset = (Number(page) - 1) * Number(pageSize);
      // Perform a case-insensitive search on title and description columns
      const results = await prisma.services.findMany({
        where: WhereCondition,
        skip: offset,
        take: Number(pageSize),
        include: {
          pictures: true,
          businessFeedback: true
        }
      });

      res.status(200).json({
        success: true,
        message: "Products fetched successfully",
        data: results,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

export const bookService = catchAsyncError(
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    try {
      const service_id = req.params.id;
      const buyer_id = req.member_id

      // Retrieve the service to get the business_id
      const service = await prisma.services.findUnique({
        where: { id: service_id },
        select: { bussiness_id: true }
      });

      if (!service) {
        return res.status(404).json({
          success: false,
          message: "Service not found",
        });
      }

      // Retrieve the business profile to get the member_id
      const businessProfile = await prisma.businessProfile.findUnique({
        where: { id: service.bussiness_id },
        select: { member_id: true }
      });

      if (!businessProfile) {
        return res.status(404).json({
          success: false,
          message: "Business profile not found",
        });
      }

      // Retrieve the contact number of the member associated with the business
      const member = await prisma.member.findFirst({
        where: { id: businessProfile.member_id },
        select: { Contact_no: true }
      });

      if (!member) {
        return res.status(404).json({
          success: false,
          message: "Member not found",
        });
      }

      const buyerContact = parseInt(member.Contact_no);
    


      const serviceBooking = await prisma.serviceBooking.create({
        data: {
          buyerId: buyer_id,
          sellerId: service.bussiness_id,
          buyerContact: member.Contact_no,
          service_id:service_id
        }
      });
      res.status(200).json({
        success: true,
        message: "service booked successfully",
        data: serviceBooking,
      });
    } catch (error) {
      console.error("Error occurred while fetching contact number:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch contact number",
        error: error,
      });
    }
});



export const myBookedService = catchAsyncError(
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    try {
    
      const business_id = req.business_id;
      let status = req.query.status as string;

        // Prepare the query conditionally based on status validity
        let queryCondition: any = {
          sellerId: business_id,
        };
  
        if (Object.values(BookingStatus).includes(status as BookingStatus)) {
          queryCondition.status = status as BookingStatus;
        }

      const findMyBookedService = await prisma.serviceBooking.findMany({
          where:queryCondition,
          include:{
            buyer:true,
            seller:true,
            service:true,
          }
      })
      
      res.status(200).json({
        success: true,
        message: "your service is booked by ",
        data: findMyBookedService,
      });
    } catch (error) {
      console.error("Error occurred while fetching contact number:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch contact number",
        error: error,
      });
    }
  });


  export const bookedByUser = catchAsyncError(
    async (req: CustomRequest, res: Response, next: NextFunction) => {
      try {
  
        const member_id = req.member_id
        let status = req.query.status as string;

          // Prepare the query conditionally based on status validity
          let queryCondition: any = {
            buyerId:member_id
          };
    
        
        if (Object.values(BookingStatus).includes(status as BookingStatus)) {
          queryCondition.status = status as BookingStatus;
        }
  
        const findMyBookedService = await prisma.serviceBooking.findMany({
            where:queryCondition,
            include:{
              buyer:true,
              seller:true,
              service:true
              
            }
        })
  
        
        res.status(200).json({
          success: true,
          message: "your  booked this service ",
          data: findMyBookedService,
        });
      } catch (error) {
        console.error("Error occurred while fetching contact number:", error);
        res.status(500).json({
          success: false,
          message: "Failed to fetch contact number",
          error: error,
        });
      }
    });


    export const updateServiceStatus = catchAsyncError(
      async (req: CustomRequest,res:Response,next:NextFunction) =>{
        try{

          const bookingId =  req.params.bookingId; 
          const status = req.body.status


          const existingRecord = await prisma.serviceBooking.findUnique({
            where: {
              id: bookingId,
            },
          });

      if (!existingRecord) {
        return res.status(404).json({
          success: false,
          message: 'Record to update not found.',
        });
      }
      
         await prisma.serviceBooking.update({
            where : {
              id:bookingId
            },
            data:{
              status:status
            }
          });

          res.status(200).json({
            success: true,
            message: `Service ${status} Successfull`,
          });
        }catch(error){
          console.error('Error occcured while updating Service Status',error)
          res.status(500).json({
            success: false,
            message: "Failed to fetch contact number",
            error: error,
          })
        }
      }
    )




export default prisma;
