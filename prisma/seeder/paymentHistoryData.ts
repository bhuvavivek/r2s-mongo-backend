import { prisma } from '../prismaclient';

const memberData = require('../../utils/member.json')
const paymenthistory = require('../../utils/paymentHistory.json')
// i need a prisma client here to connect with db and server 


async function seedMembersInfo() {
    const paymentHistoryData = await Promise.all(paymenthistory.map(async (phistory: any) => {

        const memberemail = memberData.find((m: any) => m.id === phistory.member_id)?.email_id;

        const member = await prisma.member.findFirst({
            where: { email_id: memberemail }
        });

        return {
            amount: phistory.amount,
            transction_id: phistory.transction_id,
            status: phistory.status,
            member_id: member?.id,
            created_at:convertToISO8601(phistory.created_at),
            updated_at: convertToISO8601(phistory.updated_at),
            orderId: phistory.orderId,
        };
    }));

    await prisma.paymentHistory.createMany({
        data: paymentHistoryData
    });
}

function convertToISO8601(dateString : string) {
    if(!dateString) return null;
    return new Date(dateString.replace(' ', 'T')).toISOString();
}


seedMembersInfo().then((members) => {
    console.log('Seeding completed successfully');
    process.exit(0);
}).catch((err) => {
    console.error(err);
    process.exit(1);
}).finally(async ()=> {
    await prisma.$disconnect();
    console.log('Disconnected');
});