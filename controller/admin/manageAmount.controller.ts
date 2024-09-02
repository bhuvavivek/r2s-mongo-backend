// admin.ts

import { PrismaClient } from '@prisma/client'; // Import the PrismaClient
import { NextFunction, Request, Response } from 'express';
import catchAsyncError from '../../middleware/catchAsyncError';
import ErrorHandler from '../../utils/errorhandler'; // Import your custom error handler if available
import SuccessHandler from "../../utils/sucessReply";

const prisma = new PrismaClient(); // Initialize PrismaClient


export const UpdateAmountDetails = catchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {

       const {memberShipAmount , promotionAmount , referallAmount} = req.body ;
      
       const updateData  = {} as any;
        if(Number(memberShipAmount)){
           updateData['membershipAmount'] = Number(memberShipAmount) ;
        }

        if(Number(promotionAmount)){
          updateData['promotionAmount'] = Number(promotionAmount) ;
       }

       if(Number(referallAmount)){
        updateData['referallAmount'] = Number(referallAmount) ;
     }

        try {

          // here want to just first one record from PromotionAndMemberData
          const firstRecord = await prisma.promotionAndMembershipAmount.findFirst();

          if(!firstRecord){
            throw new ErrorHandler("No record found", 404)
          }

          const updatedRecord = await prisma.promotionAndMembershipAmount.update({
            where:{
              id:firstRecord.id
            },
            data:updateData
          })

          SuccessHandler.sendSuccessResponse(res, "SubScription Fees Updated Successfully", { results:updatedRecord });
    

        } catch (error) {
          throw next(new ErrorHandler(`${error}`, 500))
        }
      }
)

export const getAmountDetails = catchAsyncError(async (req:Request , res:Response , next:NextFunction)=>{
   try {

      const firstRecord = await prisma.promotionAndMembershipAmount.findFirst();
      if(!firstRecord){
        throw new ErrorHandler("No record found", 404)
      }
      SuccessHandler.sendSuccessResponse(res, "SubScription Fees Fetched Successfully", { results:firstRecord });
   } catch (error) {
      throw next(new ErrorHandler(`${error}`, 500))
   }
})