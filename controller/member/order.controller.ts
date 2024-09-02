// admin.ts

import { OrderStatus, PrismaClient } from "@prisma/client"; // Import the PrismaClient
import crypto from "crypto";
import { NextFunction, Response } from "express";
import jwt from 'jsonwebtoken';
import Razorpay from 'razorpay';
import { CustomRequest } from "../../middleware/auth";
import catchAsyncError from "../../middleware/catchAsyncError";
import ErrorHandler from "../../utils/errorhandler"; // Import your custom error handler if available


const prisma = new PrismaClient();



const razorpayApiKey = process.env.RAZORPAY_API_ID;
const razorpayApiSecret = process.env.RAZORPAY_API_SECRECT;

if (!razorpayApiKey || !razorpayApiSecret) {
    throw new Error("Razorpay API credentials are not provided");
}

var instance = new Razorpay({
    key_id: razorpayApiKey,
    key_secret: razorpayApiSecret,
});


function generateOTP(): number {
    // Get current timestamp
    const timestamp = Date.now();

    // Generate a random number between 100000 and 999999
    const randomNum = Math.floor(Math.random() * 900000) + 100000;

    // Concatenate timestamp and random number
    const otpStr = timestamp.toString() + randomNum.toString();

    // Extract the last 6 digits from the concatenated string
    const otp = parseInt(otpStr.slice(-6), 10);

    return otp;
}




export const postCreateOrder = catchAsyncError(
    async (req: CustomRequest, res: Response, next: NextFunction) => {
        try {
            const { products, addressId, transactionID, useWalletBalance } = req.body;
        
            const memberId = req.member_id;

            // Step 1: Validate the request body
            if (!products || !Array.isArray(products) || products.length === 0) {
                throw new ErrorHandler("Products array is required and should not be empty", 400);
            }

            // Step 1.5: Validate all product IDs first
            const productIds = products.map(product => product.productId);


            const existingProducts = await prisma.product.findMany({
                where: {
                    id: {
                        in: productIds,
                    },

                },
            });



            const businessIds = await prisma.product.findMany({
                where: {
                    id: {
                        in: productIds,
                    },
                },
                select: {
                    bussiness_id: true,
                },
            }).then(products => products.map(product => product.bussiness_id));

            const uniqueBusinessIds = [...new Set(businessIds)];


            const shippingFees = await Promise.all(uniqueBusinessIds.map(async (businessId) => {
                const businessProfile = await prisma.businessProfile.findUnique({
                    where: {
                        id: businessId,
                    },
                    select: {
                        shippingFee: true,
                    },
                });
                const shippingFee = businessProfile?.shippingFee ?? 0; // Convert to regular number
                return {
                    businessId,
                    shippingFee,
                };
            }));

            // Calculate total shipping fee
            const totalShippingFee = shippingFees.reduce((total, { shippingFee }) => total + shippingFee, 0);

         
            // Fetch address
            const address = await prisma.memberAddress.findUnique({
                where: {
                    id: addressId,
                },
            });

            if (!address) {
                throw new ErrorHandler(`Address with ID ${addressId} not found`, 404);
            }

            // Calculate total amount based on product prices
            // Calculate total amount based on product prices
            let totalAmount = products.reduce((total, { productId, quantity }) => {
                const product = existingProducts?.find(p => p.id === productId);
                if (product && product.price !== undefined) {
                    return total + (Number(product.price) * quantity);
                } else {
                    throw new ErrorHandler(`Product with ID ${productId} not found or has undefined price`, 404);
                }
            }, 0);

            totalAmount += totalShippingFee;


            let walletAmount = 0;

            if (useWalletBalance) {
                const memberInfo = await prisma.memberInfo.findUnique({
                    where: {
                        member_id: memberId,
                    },
                });
                if (memberInfo) {
                    walletAmount = Number(memberInfo.balance);
                }
            }

            let usedWalletBalance = 0;
            if(useWalletBalance){
                 usedWalletBalance = (totalAmount + totalShippingFee) -1
            }

            const razorpayAmount = (totalAmount ) > walletAmount ? (totalAmount ) - walletAmount : 1; // Ensure razorpayAmount is always above 0

            if ((totalAmount + totalShippingFee) > walletAmount) {
                walletAmount -= (razorpayAmount - 1); // Deduct 1 rupee less from wallet balance if wallet amount is greater than or equal to total amount
            }

            let options = {
                amount: razorpayAmount * 100,  // amount in smallest currency unit
                currency: "INR",
                receipt: transactionID
            };



            instance.orders.create(options, async function (err, order) {
                if (err) {
                    console.log(err);
                    return res.status(500).json({ error: "An error occurred while creating the order" });
                }

                try {

                    const otp = generateOTP()

                    const orderData = {
                        buyerId: memberId,
                        addressId: addressId,
                        orderStatus: 'PENDING',
                        amount: totalAmount,
                        deliveryOtp: otp,
                        paymentStatus: 'PENDING', // Assuming payment status is pending initially
                        orderId: '', // Will be updated with actual order ID later
                        products: products.map(({ productId, quantity }) => {
                            const product = existingProducts.find(p => p.id === productId);
                            if (product && product.price !== undefined) {
                                return {
                                    productId,
                                    quantity,
                                    amount: Number(product.price) * quantity,
                                };
                            } else {
                                throw new ErrorHandler(`Product with ID ${productId} not found or has undefined price`, 404);
                            }
                        }),
                        transaction: {
                            amount: totalAmount,
                            transactionID: transactionID,
                            paymentStatus: 'PENDING', // Assuming payment status is pending initially
                            paymentMethod: 'ONLINE',
                        },

                    };

                    const secretKey = jwt.sign({ order: order, orderData: orderData, walletBalance: usedWalletBalance }, process.env.ORDER_SECRET_KEY as string);

                    // Send the response
                    res.json({ success: true, order, secretKey, orderData });
                } catch (error) {
                    console.error("Error creating order history:", error);
                    return res.status(500).json({ error: "An error occurred while creating order history" });
                }
            });

        } catch (error) {
            next(error);
        }
    }
);



export const verifyPayment = catchAsyncError(
    async (req: CustomRequest, res: Response, next: NextFunction) => {
        try {
            const { razorpay_order_id, razorpay_signature, razorpay_payment_id } = req.body;
            const { secretKey } = req.query;

            let body = razorpay_order_id + "|" + razorpay_payment_id;
            const expectedSignature = crypto
                .createHmac("sha256", process.env.RAZORPAY_API_SECRECT as string)
                .update(body.toString())
                .digest("hex");

            const isAuthentic = expectedSignature === razorpay_signature;



            const decoded = await jwt.verify(secretKey as string, process.env.ORDER_SECRET_KEY as string) as { order: any, orderData: any, walletBalance: any };


            const orderId = decoded.order.id
            const wallet = decoded.walletBalance

          

            if (isAuthentic) {

                interface Product {
                    productId: string; // Assuming productId is of type string
                    // Add other properties here if necessary
                    price: number;
                    quantity: number;
                    bussiness_id: String;
                }


                const productIds = decoded.orderData.products.map((product: Product) => product.productId);

                const existingProducts = await prisma.product.findMany({
                    where: {
                        id: {
                            in: productIds,
                        },
                    },
                });

                const combinedProducts = decoded.orderData.products.map((decodedProduct: Product) => {
                    const existingProduct = existingProducts.find(product => product.id === decodedProduct.productId);
                    if (existingProduct) {
                        return {
                            ...existingProduct,
                            quantity: decodedProduct.quantity
                        };
                    } else {
                        return null;
                    }
                }).filter(Boolean);
                const productsByBusinessId = new Map();

                combinedProducts.forEach((product: Product) => {
                    const businessId = product.bussiness_id;
                    if (!productsByBusinessId.has(businessId)) {
                        productsByBusinessId.set(businessId, []);
                    }
                    productsByBusinessId.get(businessId).push(product);
                });

                // Create orders based on products grouped by business_id

                const orderPromises = [];

                for (const [businessId, products] of productsByBusinessId.entries()) {
                    const businessProfile = await prisma.businessProfile.findUnique({
                        where: {
                            id: businessId
                        },
                        select: {
                            shippingFee: true
                        }
                    });

                    let totalPrice = 0;
                    products.forEach((product: Product) => {
                        totalPrice += product.price * product.quantity;
                    });

                    totalPrice += Number(businessProfile?.shippingFee);

                 
                    orderPromises.push(prisma.orderHistory.create({
                        data: {
                            buyerId: decoded.orderData.buyerId,
                            addressId: decoded.orderData.addressId,
                            sellerId: businessId,
                            deliveryOtp: decoded.orderData.deliveryOtp,
                            orderStatus: decoded.orderData.orderStatus,
                            amount: totalPrice,
                            paymentStatus: decoded.orderData.paymentStatus,
                            orderId: decoded.order.id,
                            shippingFee:businessProfile?.shippingFee,
                            products: {
                                create: products.map((product: any) => ({
                                    productId: product.id,
                                    quantity: product.quantity,
                                    amount: product.price
                                }))
                            },
                            transaction: {
                                create: {
                                    amount: decoded.orderData.transaction.amount,
                                    transactionID: decoded.orderData.transaction.transactionID,
                                    paymentStatus: 'approved',
                                    paymentMethod: decoded.orderData.transaction.paymentMethod,
                                }
                            }
                        }
                    }));


                }

                // Wait for all order creation promises to resolve
                await Promise.all(orderPromises);

                const fatchWalletBalance = await prisma.memberInfo.findFirst({
                    where: {
                        member_id: decoded.orderData.buyerId
                    }
                })
                const currentBalance = Number(fatchWalletBalance?.balance)
                const currentwithdrawalBalance = Number(fatchWalletBalance?.withdrawl)

                const updatedBalance = currentBalance - decoded.walletBalance
                const updatedWithdrawalBalance = currentwithdrawalBalance + decoded.walletBalance
                const totalRevenue = updatedBalance +updatedWithdrawalBalance
                const updateWalletBalance = await prisma.memberInfo.update({
                    where: {
                        member_id: decoded.orderData.buyerId
                    },
                    data: {
                        balance: updatedBalance,
                        withdrawl:updatedWithdrawalBalance,
                        revenue:totalRevenue
                    }
                })

                res.redirect('https://member.return2success.com/membership/payment/success')
            }
            else {


                res.redirect('https://member.return2success.com/membership/payment/failed')

            }

        } catch (error) {
            next(error);
        }
    }
);


export const getOrder = catchAsyncError(
    async (req: CustomRequest, res: Response, next: NextFunction) => {
        try {
            const member_id = req.member_id;
            const page = req.query.page ? parseInt(req.query.page as string, 10)  : undefined;
            const limit =req.query.limit ?  parseInt(req.query.limit as string, 10)  : undefined; // Default limit is 10
            const offset =  page && limit ? (page - 1) * limit : 0;
            const status = req.query.status; // New parameter for filtering by order status

            // Define the filter object based on the status parameter
            const statusFilter = status ? { orderStatus: status as OrderStatus } : {};

            // Query to fetch orders with pagination, descending order, and status filter
            const [orders, totalCount] = await Promise.all([
                prisma.orderHistory.findMany({
                    where: {
                        buyerId: member_id,
                        ...statusFilter // Include status filter in the where clause
                    },
                    include: {
                        products: true,
                        transaction: true,
                        address: true,

                    },
                    orderBy: {
                        orderDate: 'desc' // Sort by orderDate field in descending order
                    },
                    skip: offset, // Skip items based on pagination
                    take: limit // Take items based on pagination
                }),
                prisma.orderHistory.count({
                    where: {
                        buyerId: member_id,
                        ...statusFilter // Include status filter in the where clause
                    }
                })
            ]);

            const totalPages = limit ? Math.ceil(totalCount / limit) : 1;

            res.status(200).json({
                success: true,
                message: "Your orders fetched successfully",
                data: {
                    orders,
                    currentPage: page || 1,
                    totalPages,
                    totalCount
                },
            });
        } catch (error) {
            next(error);
        }
    }
);






export const putOrderStatus = catchAsyncError(
    async (req: CustomRequest, res: Response, next: NextFunction) => {
        try {
            // Step 1: Check if the provided order ID exists
            const orderId = req.params.id;
            const { status, deliveryOtp } = req.body;

            const numberOtp = Number(deliveryOtp)

            if (!orderId || !status) {
                throw next(new ErrorHandler("All fields are required", 500));
            }

            const existingOrder = await prisma.orderHistory.findUnique({
                where: { id: orderId }
            });

            if (!existingOrder) {
                return res.status(404).json({
                    success: false,
                    message: "Order not found."
                });
            }

            // Step 2: Validate if the provided status transition is allowed
            const currentStatus = existingOrder.orderStatus;
            const allowedStatusTransitions: Record<OrderStatus, OrderStatus[]> = {
                PENDING: ["PROCESSING", "CANCELLED",'DELIVERED'],
                PROCESSING: ["APPROVED", "CANCELLED"],
                APPROVED: ["SHIPPED", "CANCELLED"],
                SHIPPED: ["DELIVERED", "RETURNED"],
                DELIVERED: ["RETURNED"],
                CANCELLED: [],
                RETURNED: ["REFUNDED"],
                REFUNDED: [],
                ON_HOLD: ["CANCELLED"]
            };

            if (!allowedStatusTransitions[currentStatus].includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid status transition."
                });
            }

            // Step 3: If status transition is to "DELIVERED", verify the delivery OTP
            if (status === "DELIVERED") {
                if (!numberOtp || existingOrder.deliveryOtp !== numberOtp) {
                    return res.status(400).json({
                        success: false,
                        message: "Invalid delivery OTP."
                    });
                }
            }

            // Step 4: Update the order status
            const updatedOrder = await prisma.orderHistory.update({
                where: { id: orderId },
                data: { orderStatus: status }
            });

            res.status(200).json({
                success: true,
                message: "Order status updated successfully.",
                data: updatedOrder
            });

        } catch (error) {
            console.error(error,"this is something error");
            next(error);
        }
    }
);



export const getSingleOrder = catchAsyncError(
    async (req: CustomRequest, res: Response, next: NextFunction) => {
      const orderId = req.params.id;
      const memberId = req.member_id; // Current member ID
      
      if (!orderId) {
        return next(new ErrorHandler("Order ID is required", 400));
      }
  
      try {
        const orderData = await prisma.orderHistory.findUnique({
          where: { id: orderId },
          include: {
            products: {
              include: {
                product: {
                  include: {
                    pictures: true,
                  },
                },
              },
            },
            address: true,
            transaction: true,
            seller: true,
            buyer: true,
          },
        });

        let subAmount = Number(orderData?.amount);
        if(orderData?.shippingFee){
            subAmount -= Number(orderData?.shippingFee)
        }
  
        if (!orderData) {
          return next(new ErrorHandler("Order not found", 404));
        }
  
        // Check if the current member is the buyer
        const isBuyer = orderData.buyerId === memberId;
  
        let response: any;
  
        // If the current member is the buyer, include the delivery OTP
        if (isBuyer) {
          response = {
            ...orderData,
            subAmount,
            deliveryOtp: orderData.deliveryOtp,
          };
        } else {
          // If not, build a response without the delivery OTP
          response = { ...orderData };
          delete response.deliveryOtp; // Explicitly remove `deliveryOtp` if it exists
        }
  
        // Use JSON.stringify with a custom replacer to handle BigInt
        // const responseData = JSON.parse(JSON.stringify(response, bigIntToStringReplacer));
  
        res.status(200).json({
          success: true,
          message: "Order details fetched successfully",
          data: response,
        });
      } catch (error) {
        next(error);
      }
    }
  );


export const putPaymentStatus = catchAsyncError(
    async (req: CustomRequest, res: Response, next: NextFunction) => {
        const { type, id } = req.query;

        if (!type || !id) {
            throw next(new ErrorHandler("All fields are required", 500));
        }
        if (type !== "member" && type !== "business") {
            throw next(new ErrorHandler("Invalid Type", 500));
        }
        try {
            const page = parseInt(req.query.page as string, 10) || 1;
            const itemsPerPage = parseInt(req.query.perpage as string, 10) || 10;
            const offset = (page - 1) * itemsPerPage;
            let whereCondition = {}; // Initialize an empty object to build the 'where' condition

            if (type === "member") {
                // If the type is 'member', filter by member_id
                whereCondition = { member_id: id };
            } else if (type === "business") {
                // If the type is 'business', filter by business_id
                whereCondition = { bussiness_id: id };
            }

            const feedbackData = await prisma.businessFeedback.findMany({
                where: whereCondition,
                include: {
                    Member: {
                        select: {
                            id: true,
                            full_name: true,
                            profile_picture: true,
                        },
                    },
                },
                skip: offset,
                take: itemsPerPage,
            });


            if (feedbackData.length === 0) {
                res.status(200).json({
                    success: false,
                    message: `No ${type} found associated to id `,
                });
            }
            else {
                res.status(200).json({
                    success: true,
                    message: "Feedback details Fetched Successfully",
                    data: feedbackData,
                });
            }


        } catch (error) {
            next(error);
        }
    }
);

export const getMyOrder = catchAsyncError(
    async (req: CustomRequest, res: Response, next: NextFunction) => {
        try {
            const business_id = req.business_id;
            const page = parseInt(req.query.page as string, 10) || 1;
            const limit = parseInt(req.query.limit as string, 10) || 10; // Default limit is 10
            const offset = (page - 1) * limit;
            const status = req.query.status; // New parameter for filtering by order status

            // Define the filter object based on the status parameter
            const statusFilter = status ? { orderStatus: status as OrderStatus } : {};

            // Query to fetch orders with pagination, descending order, and status filter
            const [orders, totalCount] = await Promise.all([
                prisma.orderHistory.findMany({
                    where: {
                        sellerId: business_id,
                        ...statusFilter // Include status filter in the where clause
                    },

                    select: {
                        id: true,
                        buyerId: true,
                        sellerId: true,
                        orderStatus: true,
                        addressId: true,
                        orderDate: true,
                        orderId: true,
                        amount: true,
                        paymentId: true,
                        paymentStatus: true,
                        secretKey: true,
                        products: {
                            select: {
                                id: true,
                                orderHistoryId: true,
                                amount: true,
                                quantity: true,
                                productId: true,
                                product: {
                                    select: {
                                        id: true,
                                        bussiness_id: true,
                                        price: true,
                                        title: true,
                                        description: true,
                                        created_at: true,
                                        updated_at: true,
                                        is_delete: true,
                                        pictures: {
                                            select: {
                                                id: true,
                                                productKey: true,
                                                image_url: true,
                                                image_key: true,
                                                Created_at: true
                                            }
                                        }
                                    }
                                }
                            }
                        },

                        transaction: true,
                        seller: true,
                        buyer: true

                    },

                    orderBy: {
                        orderDate: 'desc' // Sort by createdAt field in descending order
                    },
                    skip: offset, // Skip items based on pagination
                    take: limit // Take items based on pagination
                }),
                prisma.orderHistory.count({
                    where: {
                        sellerId: business_id,
                        ...statusFilter // Include status filter in the where clause
                    }
                })
            ]);

            const totalPages = Math.ceil(totalCount / limit);

            res.status(200).json({
                success: true,
                message: "Your orders fetched successfully",
                data: {
                    orders,
                    currentPage: page,
                    totalPages,
                    totalCount
                },
            });
        } catch (error) {
            next(error);
        }
    }
);



export default prisma;
