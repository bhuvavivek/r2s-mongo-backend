import { prisma } from '../prismaclient';

const memberData = require('../../utils/member.json')
const memberInfoData = require('../../utils/memberInfo.json')
// i need a prisma client here to connect with db and server 


async function seedMembersInfo() {
    const memberInfoDatas = await Promise.all(memberInfoData.map(async (minfo: any) => {

        const memberemail = memberData.find((m: any) => m.id === minfo.member_id)?.email_id;

        const member = await prisma.member.findFirst({
            where: { email_id: memberemail }
        });

        return {
            member_id: member?.id,
            balance: minfo.balance,
            revenue: minfo.revenue,
            withdrawl: minfo.withdrawl,
            ecommerceWithdraw: minfo.ecommerceWithdraw,
            Created_at:convertToISO8601( minfo.Created_at),
            Updated_at: convertToISO8601(minfo.Updated_at),
        };
    }));

    await prisma.memberInfo.createMany({
        data: memberInfoDatas
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