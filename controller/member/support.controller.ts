
import { NextFunction, Response } from "express";
import { CustomRequest } from "../../middleware/auth";
// import { Decimal } from 'decimal.js';

import {
    PrismaClient
} from "@prisma/client"; // Import the PrismaClient
import catchAsyncError from "../../middleware/catchAsyncError";

const prisma = new PrismaClient() //initialize PrismaClient




function generateTicketNumber() {
    const timestamp = Date.now().toString(); // Get current timestamp in milliseconds as string
    const randomDigits = Math.floor(Math.random() * 1000000000); // Generate 9 random digits
    const ticketNumber = timestamp.slice(-8) + randomDigits.toString().slice(0, 1); // Concatenate last 8 digits of timestamp with the first digit of random digits
    return ticketNumber.padStart(10, '0'); // Ensure the ticket number is always 10 digits by padding with leading zeros if necessary
}

export const addSupport = catchAsyncError(
    async (req: CustomRequest, res: Response, next: NextFunction) => {
        try {
            const { title, description } = req.body;
            const member_id = req.member_id; // Assuming member_id is passed in the request body

            // Validate title and description
            if (!title || !description) {
                throw new Error('Title and description are required');
            }

            const ticketNumber = generateTicketNumber();

            // Create the support entry in the database
            const newTitle = await prisma.support.create({
                data: {
                    title: title,
                    description: description,
                    supportStatus: "PENDING",
                    member_id: member_id,
                    ticketNumber: Number(ticketNumber)
                },
            });

            res.status(201).json({
                success: true,
                message: 'Ticket raised successfully',
                data: newTitle,
            });
        } catch (error) {
            console.error('Failed to raise ticket:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to raise ticket',
                error: error,
            });
        }
    }
);


export const getSupport = catchAsyncError(
    async (req: CustomRequest, res: Response, next: NextFunction) => {
        try {
          
            const member_id = req.member_id // Assuming title is passed in the request body

            // Create the title in the database
            const newTitle = await prisma.support.findMany({
                where:{
                    member_id:member_id
                }
              
            });

            res.status(201).json({
                success: true,
                message: 'ticket raised succefully',
                data: newTitle,
            });
        } catch (error) {
            console.error('Failed to add title:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to raised ticket ',
                error: error,
            });
        }
    }
);

