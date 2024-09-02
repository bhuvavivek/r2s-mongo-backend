
import { Request, Response, NextFunction } from "express";
import { CustomRequest } from "../../middleware/auth";
import { PrismaClient } from "@prisma/client";
import ErrorHandler from "../../utils/errorhandler";
import catchAsyncError from "../../middleware/catchAsyncError";

const prisma = new PrismaClient();

const hasCartItemFromDifferentBusiness = async (
  memberId: string,
  newBusinessId: string
): Promise<boolean> => {
  const cartItems = await prisma.cart.findMany({
    where: { member_id: memberId },
    include: { Product: { select: { bussiness_id: true } } },
  });

  return cartItems.some(
    (cartItem) => cartItem.Product.bussiness_id !== newBusinessId
  );
};


// ----------------------------------------------------------------------------------------ADD TO CART BY MOHIT 
// export const addToCart = catchAsyncError(
//   async (req: CustomRequest, res: Response, next: NextFunction) => {
//     try {
//       const { product_id, quantity } = req.body;

//       if (!product_id) {
//         throw new ErrorHandler("All Field Are required", 400);
//       }

//       const memberId = req.member_id;

//       const product = await prisma.product.findUnique({
//         where: { id: product_id },
//         include: { Bussiness: true },
//       });

//       if (!product) {
//         throw new ErrorHandler("Product not found", 400);
//       }

//       const hasDifferentBusinessItem = await hasCartItemFromDifferentBusiness(
//         memberId,
//         product.bussiness_id
//       );


//       let count;
//       let newCartItem;

//       if (hasDifferentBusinessItem) {
//         // Remove all existing items in the cart
//         await prisma.cart.deleteMany({
//           where: { member_id: memberId },
//         });
//         newCartItem = await prisma.cart.create({
//           data: {
//             member_id: memberId,
//             product_id: product_id,
//             quantity: quantity || 1,
//           },
//         });
//       } else {
//         newCartItem = await prisma.cart.create({
//           data: {
//             member_id: memberId,
//             product_id: product_id,
//             quantity: quantity || 1,
//           },
//         });
//       }

//       count = await prisma.cart.count({
//         where: { member_id: memberId },
//       });

//       res.status(200).json({
//         success: true,
//         message: "Product Added to Cart ",
//         data: count,
//       });
//     } catch (error) {
//       next(error);
//     }
//   }
// );

export const addToCart = catchAsyncError(
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    try {
      const { product_id, quantity } = req.body;

      if (!product_id) {
        throw new ErrorHandler("All Field Are required", 400);
      }

      const memberId = req.member_id;

      const product = await prisma.product.findUnique({
        where: { id: product_id },
        include: { Bussiness: true },
      });

      if (!product) {
        throw new ErrorHandler("Product not found", 400);
      }

      // Check if there are existing items in the cart from a different business
      const hasDifferentBusinessItem = await hasCartItemFromDifferentBusiness(
        memberId,
        product.bussiness_id
      );

      let newCartItem;

      // If there are items from a different business, remove them
      if (hasDifferentBusinessItem) {
        await prisma.cart.deleteMany({
          where: { member_id: memberId },
        });
      }

      // Check if the same product from the same business exists in the cart
      const existingCartItem = await prisma.cart.findFirst({
        where: {
          member_id: memberId,
          product_id: product_id,
          // bussiness_id: product.bussiness_id,
        },
      });

      if (existingCartItem) {
        // If the same product from the same business exists,
        // increase the quantity instead of creating a new entry
        await prisma.cart.update({
          where: { id: existingCartItem.id },
          data: { quantity: existingCartItem.quantity + parseInt(quantity || 1) },
        });
      } else {
        // If no existing item found, create a new cart item
        newCartItem = await prisma.cart.create({
          data: {
            member_id: memberId,
            product_id: product_id,
            quantity: quantity || 1,
            // bussiness_id: product.bussiness_id,
          },
        });
      }

      // Count total cart items
      const count = await prisma.cart.count({
        where: { member_id: memberId },
      });

      res.status(200).json({
        success: true,
        message: "Product Added to Cart",
        data: count,
      });
    } catch (error) {
      next(error);
    }
  }
);






export const deleteCartItem = catchAsyncError(
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    const memberId = req.member_id;
    const cartId = req.params.id;
    try {
      const cardExist = await prisma.cart.findUnique({
        where: {
          id: cartId,
        },
      });

      if (!cardExist) {
        throw next(new ErrorHandler("Item did not Found in Cart", 400));
      }

      const serviceData = await prisma.cart.delete({
        where: { id: cartId },
      });
      res.status(200).json({
        success: true,
        message: "Cart Updated Successfully",
        data: serviceData,
      });
    } catch (error) {
      console.error("Cart details fetch failed:", error);
      res.status(500).json({
        success: false,
        message: "Cart details fetch failed",
        error: error,
      });
    }
  }
);

export const updateCartItem = catchAsyncError(
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    const memberId = req.member_id;
    const cartId = req.params.id;
    const { product_id, quantity } = req.body;
    try {
      const cardExist = await prisma.cart.findUnique({
        where: {
          id: cartId,
        },
      });

      if (!cardExist) {
        throw next(new ErrorHandler("Item did not Found in Cart", 400));
      }

      const cartUpdateExist = await prisma.cart.update({
        where: {
          id: cartId,
        },
        data: {
          product_id: product_id,
          quantity: quantity || 1,
        },
      });
      res.status(200).json({
        success: true,
        message: "Cart Updated Successfully",
        data: cartUpdateExist,
      });
    } catch (error) {
      console.error("Cart details fetch failed:", error);
      res.status(500).json({
        success: false,
        message: "Cart details fetch failed",
        error: error,
      });
    }
  }
);

export const getMyCart = catchAsyncError(
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    const memberId = req.member_id;
    try {
      const cartData = await prisma.cart.findMany({
        where: {
          member_id: memberId,
        },
      });
      res.status(200).json({
        success: true,
        message: "Cart Fetched Successfully",
        data: cartData,
      });
    } catch (error) {
      console.error("Cart details fetch failed:", error);
      res.status(500).json({
        success: false,
        message: "Cart details fetch failed",
        error: error,
      });
    }
  }
);

export default prisma;
