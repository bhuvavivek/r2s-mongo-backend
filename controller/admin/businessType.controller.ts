import {
    PrismaClient
} from "@prisma/client"; // Import the PrismaClient
import { NextFunction, Request, Response } from "express";
import catchAsyncError from "../../middleware/catchAsyncError";
import ErrorHandler from "../../utils/errorhandler";
import SuccessHandler from "../../utils/sucessReply";

const prisma = new PrismaClient(); // Initialize PrismaClient


export const getBusinesstypecontroller = catchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        const page = parseInt(req.query.page as string) || 1;
        const take = parseInt(req.query.limit as string) || 5;
        const searchQuery = (req.query.search as string || '').trim();

        const skip = (page - 1) * take;

        try {
            let businesstypes;
            let total;

            if (searchQuery) {
                // When search query is provided, do not apply pagination
                businesstypes = await prisma.bussinessType.findMany({
                    where: {
                        type: {
                            contains: searchQuery,
                        }
                    }
                });

                total = businesstypes.length;
            } else {
                // When search query is not provided, apply pagination
                businesstypes = await prisma.bussinessType.findMany({
                    skip,
                    take
                });

                total = await prisma.bussinessType.count();
            }

            if (!businesstypes || businesstypes.length === 0) {
                return SuccessHandler.sendSuccessResponse(res, "businesstype is Empty", {
                    result: [],
                    total: 0
                });
            }

            SuccessHandler.sendSuccessResponse(
                res,
                "Businesstypes fetched successfully",
                { results: businesstypes, total }
            );
        } catch (error) {
            next(new ErrorHandler(`${error}`, 500));
        }
    }
);

export const addBusinesstypeController = catchAsyncError(
    async (req:Request , res:Response , next:NextFunction) => {
if(!req.body.categorytype){
    throw new ErrorHandler("category type is required", 400)
}
try{
   await prisma.bussinessType.create({
        data:{
            type:req.body.categorytype
        }
    });

    SuccessHandler.sendSuccessResponse(
        res,
        "Businesstype Create SuccessFully",
    );
}
catch(error){
    throw next(new ErrorHandler(`${error}`, 500))
}

    }
)


export const updateBusinesstypeController = catchAsyncError(
    async (req:Request , res:Response , next:NextFunction) => {

        if(!req.params.id){
            throw new ErrorHandler("id is required", 400)
        }

        if(!req.body.categorytype){
            throw new ErrorHandler("category type is required", 400)
        }
try{
    const updatedBusinessType = await prisma.bussinessType.update({
        where: {
            id: req.params.id as string // Ensure the id is parsed as a number
        },
        data: {
            type: req.body.categorytype // Ensure the categorytype is correctly parsed from the body
        }
    });

    SuccessHandler.sendSuccessResponse(
        res,
        "Business type Updated SuccessFully",
        {result:updatedBusinessType}
    );
}
catch(error){
    throw next(new ErrorHandler(`${error}`, 500))
}

    }
)
