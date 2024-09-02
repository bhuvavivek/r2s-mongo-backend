
import { NextFunction, Response } from "express";
import { CustomRequest } from "../../middleware/auth";
// import { Decimal } from 'decimal.js';

import {
    PrismaClient
} from "@prisma/client"; // Import the PrismaClient
import catchAsyncError from "../../middleware/catchAsyncError";

const prisma = new PrismaClient(); // Initialize PrismaClient



export const addAsk = catchAsyncError(async (req: CustomRequest, res: Response, next: NextFunction) => {
    try {
        const { title, description } = req.body; // Assuming title, description, and imageUrl are passed in the request body
        const createdBy = req.member_id; // Assuming you have implemented user authentication and req.user contains the authenticated user's information

        // Create a new ask record in the database
        const newAsk = await  prisma.ask.create({
            data:{
                title:title,
                description:description,
                createdById:createdBy
            }
        });

        // Respond with the newly created ask
        res.status(201).json({
            success:true,
            data: {
                ask: newAsk
            }
        });
    } catch (error) {
        // Handle errors
        next(error); // Pass the error to the error handling middleware
    }
});

export const getPublicAsk = catchAsyncError(async (req: CustomRequest, res: Response, next: NextFunction) => {
    try {
        // Pagination parameters
        const page = parseInt(req.query.page as string) || 1; // Current page (default: 1)
        const perPage = parseInt(req.query.perPage as string) || 10; // Number of items per page (default: 10)

        // Calculate skip value for pagination
        const skip = (page - 1) * perPage;

        // Retrieve ask records from the database where isDeleted is false with pagination
        const [asks, totalAsks] = await Promise.all([
            prisma.ask.findMany({
                where: {
                    isDeleted: false,
                    createdById:{
                        not:req.member_id
                    }
                },
                skip: skip,
                take: perPage,
                orderBy: {
                    created_at: 'desc' // Order by created_at field in descending order
                },
                select: {
                    id: true,
                    title: true, 
                    description: true,
                    status: true,
                    isDeleted: true,
                    responses: false,
                    created_at: true,
                    updated_at: true,
                    createdById: true // Select createdById field to retrieve member ID
                }
            }),
            prisma.ask.count({
                where: {
                    isDeleted: false
                }
            })
        ]);

        // Fetch member details for each ask
        const asksWithMemberDetails = await Promise.all(asks.map(async (ask) => {
            // Fetch member details using createdById if it's not null
            const createdBy = ask.createdById 
                ? await prisma.member.findUnique({
                    where: {
                        id: ask.createdById
                    },
                    select: {
                        id: true,
                        full_name: true,
                        email_id: true,
                        Contact_no: true
                    }
                })
                : null; // If createdById is null, set createdBy to null
        
            return {
                ...ask,
                createdBy: createdBy,
                // Include member details in the ask object
            };
        }));

        // Calculate total pages
        const totalPages = Math.ceil(totalAsks / perPage);

        // Respond with the retrieved ask records, including member details, and pagination metadata
        res.status(200).json({
            success: true,
            data: {
                asks: asksWithMemberDetails,
                pagination: {
                    totalResults: totalAsks,
                    totalPages,
                    currentPage: page
                }
            }
        });
    } catch (error) {
        // Handle errors
        next(error);
    }
});

export const getPrivateAsk = catchAsyncError(async (req: CustomRequest, res: Response, next: NextFunction) => {
    try {
        // Pagination parameters
        const page = parseInt(req.query.page as string) || 1; // Current page (default: 1)
        const perPage = parseInt(req.query.perPage as string) || 10; // Number of items per page (default: 10)

        // Calculate skip value for pagination
        const skip = (page - 1) * perPage;

        // Retrieve ask records from the database where isDeleted is false with pagination
        const [asks, totalAsks] = await Promise.all([
            prisma.ask.findMany({
                where: {
                    isDeleted: false,
                    createdById:req.member_id,
                },
                skip: skip,
                take: perPage,
                orderBy: {
                    created_at: 'desc' // Order by created_at field in descending order
                },
                select: {
                    id: true,
                    title: true,
                    description: true,
                    status: true,
                    isDeleted: true,
                    responses: false,
                    created_at: true,
                    updated_at: true,
                    createdById: true // Select createdById field to retrieve member ID
                }
            }),
            prisma.ask.count({
                where: {
                    isDeleted: false
                }
            })
        ]);

        // Fetch member details for each ask
        const asksWithMemberDetails = await Promise.all(asks.map(async (ask) => {
            // Fetch member details using createdById if it's not null
            const createdBy = ask.createdById 
                ? await prisma.member.findUnique({
                    where: {
                        id: ask.createdById
                    },
                    select: {
                        id: true,
                        full_name: true,
                        email_id: true,
                        Contact_no: true
                    }
                })
                : null; // If createdById is null, set createdBy to null
        
            return {
                ...ask,
                createdBy: createdBy,
                // Include member details in the ask object
            };
        }));

        // Calculate total pages
        const totalPages = Math.ceil(totalAsks / perPage);

        // Respond with the retrieved ask records, including member details, and pagination metadata
        res.status(200).json({
            success: true,
            data: {
                asks: asksWithMemberDetails,
                pagination: {
                    totalResults: totalAsks,
                    totalPages,
                    currentPage: page
                }
            }
        });
    } catch (error) {
        // Handle errors
        next(error);
    }
});


export const getSingleMemberAsks = catchAsyncError(async (req: CustomRequest, res: Response, next: NextFunction) => {
    try {
        // Pagination parameters
        const page = parseInt(req.query.page as string) || 1; // Current page (default: 1)
        const perPage = parseInt(req.query.perPage as string) || 10; // Number of items per page (default: 10)

        // Calculate skip value for pagination
        const skip = (page - 1) * perPage;

        const member_id = req.member_id;

        // Retrieve total number of ask records for the member
        const totalAsks = await prisma.ask.count({
            where: {
                createdById: member_id
            }
        });

        // Retrieve ask records from the database for the member with pagination
        const asks = await prisma.ask.findMany({
            where: {
                createdById: member_id
            },
            skip: skip,
            take: perPage,
            orderBy: {
                created_at: 'desc' // Order by created_at field in descending order
            }
        });

        // Calculate total pages
        const totalPages = Math.ceil(totalAsks / perPage);

        // Respond with the retrieved ask records and pagination metadata
        res.status(200).json({
            success:true,
            data: {
                asks,
                pagination: {
                    totalResults: totalAsks,
                    totalPages,
                    currentPage: page
                }
            }
        });
    } catch (error) {
        // Handle errors
        next(error);
    }
});

export const getPublicSingleAskById = catchAsyncError(async (req: CustomRequest, res: Response, next: NextFunction) => {
    try {
        const askId = req.params.id; // Get the ask ID from the request parameters

        // Retrieve the ask record from the database by its ID
        const ask = await prisma.ask.findUnique({
            where: {
                id: askId
            }
        });

        const responses = await prisma.response.findMany({
            where:{
                askId:askId,
            },
            include:{
                respondedBy:{
                    select:{
                        id: true,
                        profile_picture:true,
                        full_name:true,
                        email_id:true,
                    }
                },
            }
        })
     

        // Check if the ask exists
        if (!ask) {
            return res.status(404).json({
                success: false,
                message: 'Ask not found'
            });
        }

        // Fetch member details using createdById if it's not null
        const createdBy = ask.createdById 
            ? await prisma.member.findUnique({
                where: {
                    id: ask.createdById
                },
                select: {
                    id: true,
                    full_name: true,
                    email_id: true,
                    Contact_no: true,
                    profile_picture:true,
                }
            })
            : null; // If createdById is null, set createdBy to null

        // Respond with the retrieved ask and member details
        res.status(200).json({
            success: true,
            data: {
                ask: {
                    ...ask,
                    createdBy: createdBy // Include member details in the ask object
                },
                response:responses
            }
        });
    } catch (error) {
        // Handle errors
        next(error);
    }
});


export const getPersonalSingleAskById = catchAsyncError(async (req: CustomRequest, res: Response, next: NextFunction) => {
    try {
        const askId = req.params.id; // Get the ask ID from the request parameters
        const member_id = req.member_id; // Get the member ID of the logged-in user

        // Retrieve the ask record from the database by its ID
        const ask = await prisma.ask.findUnique({
            where: {
                id: askId
            }
        });

        // Check if the ask exists
        if (!ask) {
            return res.status(404).json({
                success: false,
                message: 'Ask not found'
            });
        }

        // Check if the logged-in user is the creator of the ask
        if (ask.createdById !== member_id) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to access this ask'
            });
        }

        // Fetch member details of the creator using createdById
        const createdBy = ask.createdById 
            ? await prisma.member.findUnique({
                where: {
                    id: ask.createdById
                },
                select: {
                    id: true,
                    full_name: true,
                    email_id: true,
                    Contact_no: true
                }
            })
            : null; // If createdById is null, set createdBy to null

        // Retrieve responses associated with the ask in descending order of creation
        const responses = await prisma.response.findMany({
            where: {
                askId: askId
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Fetch member details of each responder using respondedById
        const responseDetails = await Promise.all(responses.map(async (response) => {
            const responder = await prisma.member.findUnique({
                where: {
                    id: response.respondedById
                },
                select: {
                    id: true,
                    full_name: true,
                    email_id: true,
                    Contact_no: true
                }
            });
            return {
                ...response,
                responder: responder
            };
        }));

        // Respond with the retrieved ask, member details, and responses
        res.status(200).json({
            success: true,
            data: {
                ask: {
                    ...ask,
                    createdBy: createdBy, // Include member details of the creator
                    responses: responseDetails // Include responses with responder details
                }
            }
        });
    } catch (error) {
        // Handle errors
        next(error);
    }
});

export const updateAskStatus = catchAsyncError(async (req: CustomRequest, res: Response, next: NextFunction) => {
    try {
        const askId = req.params.id; // Get the ask ID from the request parameters
        const { status } = req.body;
        const member_id = req.member_id;

        // Retrieve the ask record from the database by its ID
        let ask = await prisma.ask.findUnique({
            where: {
                id: askId
            }
        });

        // Check if the ask exists
        if (!ask) {
            return res.status(404).json({
                success: false,
                message: 'Ask not found'
            });
        }

        // Check if the member is authorized to update the status of the ask
        if (ask.createdById !== member_id) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to update the status of this ask'
            });
        }

        // Check if the current status is 'CANCEL'
        if (ask.status === 'CANCEL') {
            return res.status(400).json({
                success: false,
                message: 'Cannot update status. The ask is already cancelled'
            });
        }

        // Update the status of the ask
        ask = await prisma.ask.update({
            where: {
                id: askId
            },
            data: {
                status: status,
                isDeleted: status === 'CANCEL' // Set isDeleted to true if status is 'CANCEL'
            }
        });

        // Respond with the updated ask
        res.status(200).json({
            success: true,
            message: 'Ask updated successfully',
            data: {
                ask
            }
        });
    } catch (error) {
        // Handle errors
        next(error);
    }
});

export const addResponse = catchAsyncError(async (req: CustomRequest, res: Response, next: NextFunction) => {
    try {
        const { askId, description } = req.body; // Assuming askId and description are provided in the request body
        const respondedById = req.member_id; // Get the member ID from the request
        const createdAt = new Date(); // Get the current date and time

        // Retrieve the ask record from the database to check the createdById
        const ask = await prisma.ask.findUnique({
            where: {
                id: askId
            },
            select: {
                createdById: true
            }
        });

        // Check if the member ID who created the ask is the same as the member ID who sent the response
        if (ask?.createdById === respondedById) {
            return res.status(400).json({
                success: false,
                message: "You cannot send a response to your own ask"
            });
        }

        // Create the response record in the database
        const newResponse = await prisma.response.create({
            data: {
                description: description,
                respondedById: respondedById,
                askId: askId,
                createdAt: createdAt
            }
        });

        // Respond with the newly created response
        res.status(201).json({
            success: true,
            data: {
                response: newResponse
            }
        });
    } catch (error) {
        // Handle errors
        next(error);
    }
});



