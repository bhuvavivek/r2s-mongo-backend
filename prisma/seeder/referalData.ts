import { prisma } from '../prismaclient';

const memberData = require('../../utils/member.json')
const referalData = require('../../utils/referralTable.json')
// i need a prisma client here to connect with db and server 


async function referalSeed() {
    const referalDatas = await Promise.all(referalData.map(async (referal: any) => {

        const referredByEmail = memberData.find((m: any) => m.id === referal.referred_by)?.email_id;
        const referredToEmail = memberData.find((m: any) => m.id === referal.referred_to)?.email_id;

        const referredByMember = await prisma.member.findFirst({
            where: { email_id: referredByEmail }
        });

        const referredToMember = await prisma.member.findFirst({
            where: { email_id: referredToEmail }
        });

        return {
            referred_by: referredByMember?.id,
            referred_to: referredToMember?.id,
            level:referal.level,
            amount:referal.amount,
            status:referal.status,
            message:referal.message,
            created_at: convertToISO8601(referal.created_at),
            updated_at: convertToISO8601(referal.updated_at),

        };
    }));

    await prisma.referralTable.createMany({
        data: referalDatas
    });
}

function convertToISO8601(dateString : string) {
    if(!dateString) return null;
    return new Date(dateString.replace(' ', 'T')).toISOString();
}


referalSeed().then((members) => {
    console.log('Seeding completed successfully');
    process.exit(0);
}).catch((err) => {
    console.error(err);
    process.exit(1);
}).finally(async ()=> {
    await prisma.$disconnect();
    console.log('Disconnected');
});