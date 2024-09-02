// admin.ts

import {
  PrismaClient,
} from "@prisma/client"; // Import the PrismaClient
import { NextFunction, Response } from "express";
import { CustomRequest, } from "../../middleware/auth";
import catchAsyncError from "../../middleware/catchAsyncError";
import ErrorHandler from "../../utils/errorhandler"; // Import your custom error handler if available

const prisma = new PrismaClient(); // Initialize PrismaClient

// addProduct,updateProduct,getMyproducts,getTopRatedProducts,getBusinessProducts,SearchProduct

export const addProduct = catchAsyncError(
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    try {
      const { price, originalPrice, title, description, images } = req.body;

      if (!price || !title || !description || !originalPrice) {
        throw new ErrorHandler("All fields are required", 400);
      }

      const businessId = req.business_id;
   

      const businessExists = await prisma.businessProfile.findUnique({
        where: { id: businessId },
      });

      if (!businessExists) {
        throw new ErrorHandler("Business not found", 400);
      }

      let picturesData = {};
      const maxDescriptionLength = 100000; // Define a maximum allowed length
const trimmedDescription = description.length > maxDescriptionLength 
  ? description.substring(0, maxDescriptionLength) + '...' 
  : description;

  



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

      // Calculate discountPrice and discountPercentage
      const discountPrice = originalPrice && price ? originalPrice - price : null;
      const discountPercentage = originalPrice && price ? ((originalPrice - price) / originalPrice) * 100 : null;

      const productData = await prisma.product.create({
        data: {
          bussiness_id: businessId,
          price: price,
          originalPrice: originalPrice,
          discount: discountPrice, // Save the discountPrice in the database
          discountPercentage: discountPercentage, // Save the discountPercentage in the database
          title: title,
          description: trimmedDescription,
          pictures: picturesData,
        },
        include: {
          pictures: true,
        },
      });


      res.status(200).json({
        success: true,
        message: "Product added successfully",
        data: productData,
      });
    } catch (error) {
      next(error);
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

export const updateProduct = catchAsyncError(
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    try {
      const { price, title, description, images,originalPrice } = req.body;
      const product_id = req.params.id

      // if (!price || !title || !description) {
      //   throw new ErrorHandler("All Field Are required", 400);
      // }

      // const businessId = req.business_id;
      // console.log("this is business", businessId);

      const productExists = await prisma.product.findUnique({
        where: { id: product_id },
        
      });

      if (!productExists) {
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

        const productData = await prisma.product.update({
          where:{id:product_id},
          data: {
           
            price: price,
            title: title,
            description: description,
            pictures: picturesData,
            originalPrice:originalPrice
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
    const productId = req.params.id;
    const { images } = req.body;



    if (images.length === 0) {
      throw next(new ErrorHandler("Minimum one image is Required", 400));
    }
    try {

      for (const image of images) {
        const productExists = await prisma.pictures.create({
          data: {
            productKey: req.service_id,
            image_url: image.link,
            image_key:image.key
          },
        });
      }
      res.status(200).json({
        success: true,
        message: "Product Updated Successfully",
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

export const deleteProduct = catchAsyncError(
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    const productId = req.params.id;
    try {
      const productExists = await prisma.product.findUnique({
        where: { id: productId },
      });
    

      if (!productExists) {
        throw next(new ErrorHandler("Product not found", 400));
      }
      const ProductData = await prisma.product.update({
        where: {
          id: productId,
        },
        data:{
          is_delete:true
        }
      });
      res.status(200).json({
        success: true,
        message: "Product deleted Successfully",
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

export const getMyproducts = catchAsyncError(
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    let business_id;

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
    }
    else {
      business_id = req.business_id;
    }

    // Pagination parameters with default values
    const pageSizeParam = req.query.pageSize;
    const pageParam = req.query.page;

    const pageSize = (typeof pageSizeParam === 'string' && parseInt(pageSizeParam)) || 10; // Default size of 10
    const page = (typeof pageParam === 'string' && parseInt(pageParam)) || 1;// Default to first page

    // Calculate the offset for pagination
    const skip = (page - 1) * pageSize;

    // search
    const searchQuery = (req.query.search as string || '').trim();

    try {

      let totalProductsCount;
      let myProductData;

      if(searchQuery){
        myProductData = await prisma.product.findMany({
          where: {
            bussiness_id: business_id,
            is_delete: false,
            title:{
              contains: searchQuery,
            }
          },
          include: {
            pictures: true,
            businessFeedback: true,
          },
          orderBy: {
            created_at: 'desc', // Order by created_at in descending order
          }, // Limit number of results
        });
        totalProductsCount = myProductData.length || 0;
      } else{
              // Fetch the total count of products to calculate the total page
              totalProductsCount =  await prisma.product.count({
                where: {
                  bussiness_id: business_id,
                  is_delete: false,
                },
              });
            // Fetch the paginated products
            myProductData = await prisma.product.findMany({
              where: {
                bussiness_id: business_id,
                is_delete: false,
              },
              include: {
                pictures: true,
                businessFeedback: true,
              },
              skip: skip, // Offset for pagination
              take: pageSize,
              orderBy: {
                created_at: 'desc', // Order by created_at in descending order
              }, // Limit number of results
            });  
      }
     
  
      res.status(200).json({
        success: true,
        message: "Product details fetched successfully",
        data: myProductData,
        pagination: {
          currentPage: page,
          pageSize: pageSize,
          totalResults: totalProductsCount,
          totalPages: Math.ceil(totalProductsCount / pageSize),
        },
      });
    } catch (error) {
      console.error("Product details fetch failed:", error);
      res.status(500).json({
        success: false,
        message: "Product details fetch failed",
        error: error,
      });
    }
  }
);

interface LocationQuery  {
  state?: string;
  city?: string;
  pincode_or_area?: string;
}


export const getTopRatedProducts = catchAsyncError(
  async (req: CustomRequest, res: Response, next: NextFunction) => {
      try {
        const page: any = req.query.page || 1; // Assign a default value if page is not provided
        const pageSize = 15
        const skip = (Number(page) - 1) * pageSize; // Explicitly cast page to number
        const business_id = req.business_id
        const {state ,city , pincode_or_area } = req.query  as LocationQuery;

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

        if(pincode_or_area){
          addressQuery = {
            ...addressQuery,
            pincode:pincode_or_area
          }
        }
        
        const whereCondition: any = {
          NOT: {
            bussiness_id: business_id,
          },
          is_delete: false,
        };

        if (Object.keys(addressQuery).length > 0) {
          whereCondition.Bussiness = {
            addresses: {
              some: addressQuery,
            },
          };
        }

        const totalRecords = await prisma.product.count({
          where: whereCondition,
        });

        const totalPages = Math.ceil(totalRecords / pageSize);
  
        const result = await prisma.product.findMany({
          take: pageSize,
          skip,
          where: whereCondition,
          include: {
            pictures: true,
            businessFeedback: true,
            Bussiness:{
              select:{
                 shippingFee:true,
}            }
          },
          orderBy: {
            created_at: 'desc', // Order by created_at in descending order
          },
        });
        
  
        res.status(200).json({
          success: true,
          message: "Top rated Fetched Successfully",
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

export const getBusinessProducts = catchAsyncError(
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    try {
      const bussinessId = req.params.id;
      const { status } = req.body;

      if (!bussinessId) {
        throw new ErrorHandler("Image ID and URL are required", 400);
      }

      const productData = await prisma.product.findMany({
        where: { bussiness_id: bussinessId, is_delete:false },
        include:{
          pictures:true,
          businessFeedback:true
        }
      });

      if (!productData) {
        throw new ErrorHandler("Product not found", 400);
      }
      res.status(200).json({
        success: true,
        message: "Product Picture Updated Successfully",
        data: productData,
      });
    } catch (error) {
      next(error);
    }
  }
);

interface SearchProductCriteria {
  title?: string;
  description?: string;
}

export const SearchProduct = catchAsyncError(
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    const query = req.query.query as string;
    const page = parseInt(req.query.page as string, 10) || 1;
    const pageSize = parseInt(req.query.perpage as string, 10) || 20;
    const business_id = req.business_id
    try {
     
      const offset = (Number(page) - 1) * Number(pageSize);

      let whereCondition: any = {
        is_delete: false, // Ensure that is_delete is false
        NOT: {
          bussiness_id: business_id,
        },
      };

      if (query && query.trim() !== '') {
        // Add search conditions if query is provided and not empty
        whereCondition = {
          AND: [
            {
              OR: [
                { title: { contains: query.toLowerCase() } },
                { description: { contains: query.toLowerCase() } },
              ],
              NOT: {
                bussiness_id: business_id,
              },
            },
            {
              is_delete: false, // Ensure that is_delete is false
            },
          ],
        };
      }

      // Perform a case-insensitive search on title and description columns
      const results = await prisma.product.findMany({
        where: whereCondition,
        skip: offset,
        take: Number(pageSize),
        include:{
          pictures:true,
          businessFeedback:true
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


export const getSingleProduct = catchAsyncError(
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    const productId = req.params.id;
    try {
      const productExists = await prisma.product.findUnique({
        where: { id: productId },
      });

      if (!productExists || productExists?.is_delete) {
        throw next(new ErrorHandler("Product not found", 400));
      }
      
      const ProductData = await prisma.product.findUnique({
        where: {
          id: productId,
        },
        include:{
          pictures:true,
          businessFeedback:true
        }
      });

      const productFeedback = await prisma.businessFeedback.findMany({
        where: { product_id: productId },
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
        message: "Product Fatched Successfully",
        data: {...ProductData,averageRating: averageRating},
      });
    } catch (error) {
      console.error("Product details fetch failed:", error);
      res.status(500).json({
        success: false,
        message: "Product details fetch failed",
        error: error,
      });
    }
  }
);

export const updateShippinfFee = catchAsyncError(
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    const business_id = req.business_id;
    const {shippingFee} = req.body
    try {
      const businessExists = await prisma.businessProfile.findUnique({
        where: { id: business_id },
      });

      if (!businessExists ) {
        throw next(new ErrorHandler("Product not found", 400));
      }
     
      const ProductData = await prisma.businessProfile.update({
        where: {
          id: business_id,
        },
        data:{
          shippingFee:shippingFee
        }
      });
      res.status(200).json({
        success: true,
        message: "Shipping fee updated Successfully",
        data: ProductData,
      });
    } catch (error) {
      console.error("shipping not updated :", error);
      res.status(500).json({
        success: false,
        message: "Shipping fee update failed",
        error: error,
      });
    }
  }
);



export default prisma;
