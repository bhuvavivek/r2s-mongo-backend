
import { NextFunction, Response } from "express";
import { CustomRequest } from "../../middleware/auth";
// import { Decimal } from 'decimal.js';

import {
    PrismaClient
} from "@prisma/client"; // Import the PrismaClient
import catchAsyncError from "../../middleware/catchAsyncError";

const prisma = new PrismaClient(); // Initialize PrismaClient



export const addSupportTitle = catchAsyncError(
    async (req: CustomRequest, res: Response, next: NextFunction) => {
        try {
            const { title } = req.body; // Assuming title is passed in the request body

            // Validate title
            if (!title) {
                throw new Error('Title is required and must be a string');
            }

            // Create the title in the database
            const newTitle = await prisma.supportTitle.create({
                data: {
                    title: title,
                },
            });

            res.status(201).json({
                success: true,
                message: 'Title added successfully',
                data: newTitle,
            });
        } catch (error) {
            console.error('Failed to add title:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to add title',
                error: error,
            });
        }
    }
);

export const getSupportTitle = catchAsyncError(
    async (req: CustomRequest, res: Response, next: NextFunction) => {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const take = parseInt(req.query.limit as string) || 5;
            const searchQuery = (req.query.search as string || '').trim();

            const skip = (page - 1) * take;

            let supportTitles;
            let total;

            if (searchQuery) {
                // When search query is provided, do not apply pagination
                supportTitles = await prisma.supportTitle.findMany({
                    where: {
                        title: {
                            contains: searchQuery,
                        }
                    }
                });

                total = supportTitles.length;
            } else {
                // When search query is not provided, apply pagination
                supportTitles = await prisma.supportTitle.findMany({
                    skip,
                    take,
                });

                total = await prisma.supportTitle.count({
                    where: {
                        title: {
                            contains: searchQuery,
                        }
                    }
                });
            }

            res.status(200).json({
                success: true,
                message: 'Support Title fetched successfully',
                data: supportTitles,
                total
            });
        } catch (error) {
            console.error('Failed to fetch title:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch title',
                error: error,
            });
        }
    }
);

export const deleteSupportTitle = catchAsyncError(
    async (req: CustomRequest, res: Response, next: NextFunction) => {
        try {
            const titleid = req.params.id // Assuming title is passed in the request body

            // Validate title
            if (!titleid) {
                throw new Error('Title is required and must be a string');
            }

            // Create the title in the database
            const newTitle = await prisma.supportTitle.delete({
                where:
                {
                    id: titleid
                }
            });

            res.status(201).json({
                success: true,
                message: 'Title deleted  successfully',
                data: newTitle,
            });
        } catch (error) {
            console.error('Failed to delete title:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete title',
                error: error,
            });
        }
    }
);


export const updateSupportTitle = catchAsyncError(
    async (req: CustomRequest, res: Response, next: NextFunction) => {
        try {
            const titleId = req.params.id;
            const { title } = req.body; // Assuming title is passed in the request body

            // Validate title
            if (!titleId) {
                throw new Error('Title ID is required');
            }

            // Update the title in the database
            const updatedTitle = await prisma.supportTitle.update({
                where: { id: titleId },
                data: { title: title } // Assuming title field is to be updated
            });

            res.status(200).json({
                success: true,
                message: 'Title updated successfully',
                data: updatedTitle,
            });
        } catch (error) {
            console.error('Failed to update title:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update title',
                error: error,
            });
        }
    }
);

export const getSingleSupportTitle = catchAsyncError(
    async (req: CustomRequest, res: Response, next: NextFunction) => {
        try {
            const titleId = req.params.id;

            // Validate title
            if (!titleId) {
                throw new Error('Title ID is required');
            }

            // Update the title in the database
            const updatedTitle = await prisma.supportTitle.findFirst({
                where: { id: titleId }, // Assuming title field is to be updated
            });

            res.status(200).json({
                success: true,
                message: 'Title updated successfully',
                data: updatedTitle,
            });
        } catch (error) {
            console.error('Failed to update title:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update title',
                error: error,
            });
        }
    }
);

export const updateSupportStatus = catchAsyncError(
    async (req: CustomRequest, res: Response, next: NextFunction) => {
        try {
            let { ticketNumber, status } = req.body;
            ticketNumber = typeof ticketNumber === 'string' ? parseInt(ticketNumber) : ticketNumber;
            
            // Validate title
            if (!ticketNumber || !status) {
                throw new Error('status is required');
            }

            // Update the title in the database
            const updatedSupport = await prisma.support.update({
                where: { ticketNumber: ticketNumber }, // Use ticketNumber as the unique identifier
                data: {
                    supportStatus: status // Update the support status
                }
            });

            res.status(200).json({
                success: true,
                message: 'status updated successfully',
                data: updatedSupport,
            });
        } catch (error) {
            console.error('Failed to update title:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update title',
                error: error,
            });
        }
    }
);


export const searchSupportByTicketNumber = catchAsyncError(
    async (req: CustomRequest, res: Response, next: NextFunction) => {
        try {
            let { ticketNumber } = req.query;

            // Validate ticketNumber
            if (!ticketNumber) {
                throw new Error('Ticket number is required');
            }

            // If ticketNumber is an array, take the first element
            if (Array.isArray(ticketNumber)) {
                ticketNumber = ticketNumber[0];
            }

            // Convert ticketNumber to a number if it's provided as a string
            const parsedTicketNumber = typeof ticketNumber === 'string' ? parseInt(ticketNumber) : ticketNumber;

            // Search for support entry by ticket number
            const supportEntry = await prisma.support.findFirst({
                where: { ticketNumber: parsedTicketNumber }
            });

            if (!supportEntry) {
                res.status(404).json({
                    success: false,
                    message: 'Support entry not found',
                });
                return;
            }

            res.status(200).json({
                success: true,
                message: 'Support entry found',
                data: supportEntry,
            });
        } catch (error) {
            console.error('Failed to search support by ticket number:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to search support by ticket number',
                error: error,
            });
        }
    }
);

export const getSupport = catchAsyncError(
    async (req: CustomRequest, res: Response, next: NextFunction) => {
        try {
            let page = parseInt(req.query.page as string) || 1; // Default page is 1
            let limit = parseInt(req.query.limit as string) || 10; // Default limit is 10
            
            // Calculate offset based on page and limit
            let offset = (page - 1) * limit;

            const searchQuery = (req.query.search as string || '').trim();

            let supportTickets;
            let totalCount;

            if (searchQuery) {
                // When search query is provided, do not apply pagination
                supportTickets = await prisma.support.findMany({
                    where: {
                        OR: [
                            { title: { contains: searchQuery } },
                            { description: { contains: searchQuery } },
                            ...(isNaN(Number(searchQuery)) ? [] : [{ ticketNumber: Number(searchQuery) }])
                        ]
                    }
                });

                totalCount = supportTickets.length;
            } else {
                // When search query is not provided, apply pagination
                supportTickets = await prisma.support.findMany({
                    skip: offset,
                    take: limit,
                });

                totalCount = await prisma.support.count();
            }

            res.status(200).json({
                success: true,
                message: 'Support tickets retrieved successfully',
                data: supportTickets,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(totalCount / limit),
                    totalItems: totalCount,
                },
            });
        } catch (error) {
            console.error('Failed to retrieve support tickets:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve support tickets',
                error: error,
            });
        }
    }
);




