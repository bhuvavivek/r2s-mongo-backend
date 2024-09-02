import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class MemberService {
    private prisma = prisma;

   read = async (cond = {}, select = {
    id: true,
    email_id: true,
    password: true,
    Contact_no: true,
},) => {
    try {
        const result = await this.prisma.member.findFirst({
            where: { ...cond },
            select
        });
        return result;
    } catch (err) {
        throw err;
    }
};

    

    // create = async (data) => {
    //     try {
    //         const result = await this.prisma.admin.create({
    //             data,
    //         });
    //         return result;
    //     } catch (err) {
    //         throw err;
    //     }
    // };

    update = async (id:string, data:object) => {
        try {
            const result = await this.prisma.member.update({
                where: { id },
                data,
            });
            return result;
        } catch (err) {
            throw err;
        }
    };

    // remove = async (id) => {
    //     try {
    //         const result = await this.prisma.admin.update({
    //             where: { id },
    //             data: {
    //                 is_deleted: true,
    //             },
    //         });
    //         return result;
    //     } catch (err) {
    //         throw err;
    //     }
    // };

    // all = async (page_no, no_of_records, search, cond = {}) => {
    //     const dataPipeline = [
    //         {
    //             $match: {
    //                 is_deleted: false,
    //                 ...cond,
    //             },
    //         },
    //     ];

    //     if (search) {
    //         dataPipeline.push({
    //             $match: {
    //                 $or: [
    //                     {
    //                         first_name: {
    //                             $regex: `.*${search}.*`,
    //                             $options: 'i',
    //                         },
    //                     },
    //                     {
    //                         last_name: {
    //                             $regex: `.*${search}.*`,
    //                             $options: 'i',
    //                         },
    //                     },
    //                     {
    //                         email: {
    //                             $regex: `.*${search}.*`,
    //                             $options: 'i',
    //                         },
    //                     },
    //                     {
    //                         mobile: {
    //                             $regex: `.*${search}.*`,
    //                             $options: 'i',
    //                         },
    //                     },
    //                 ],
    //             },
    //         });
    //     }

    //     dataPipeline.push({
    //         $skip: page_no > 1 ? no_of_records * (page_no - 1) : 0,
    //     }, {
    //         $limit: no_of_records,
    //     });

    //     const pipeline = [
    //         {
    //             $facet: {
    //                 total_records: [
    //                     {
    //                         $match: {
    //                             is_deleted: false,
    //                         },
    //                     }, {
    //                         $count: 'count',
    //                     },
    //                 ],
    //                 data: dataPipeline,
    //             },
    //         },
    //     ];

    //     try {
    //         const result = await this.prisma.admin.aggregateRaw({
    //             pipeline,
    //         });
    //         return result;
    //     } catch (err) {
    //         throw err;
    //     }
    // };
}

export default MemberService;
