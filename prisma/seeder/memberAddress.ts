import { prisma } from '../prismaclient';

const memberData = require('../../utils/member.json')
const memberAddressData = require('../../utils/memberAddress.json')
// i need a prisma client here to connect with db and server 


async function seedMembersInfo() {
    const memberAddressDatas = await Promise.all(memberAddressData.map(async (maddress: any) => {

        const memberemail = memberData.find((m: any) => m.id === maddress.member_id)?.email_id;

        const member = await prisma.member.findFirst({
            where: { email_id: memberemail }
        });

        return {
            address_line_1: maddress.address_line_1,
            address_line_2: maddress.address_line_2,
            city: maddress.city,
            state: maddress.state,
            country: maddress.country,
            pincode: maddress.pincode,
            type:maddress.type,
            is_delete: !!maddress.is_delete,
            Created_at: convertToISO8601(maddress.Created_at),
            Updated_at: convertToISO8601(maddress.Updated_at),
            member_id: member?.id,
            order_reciver_name: null,
            order_reciver_mobile_number: null
        };
    }));

    await prisma.memberAddress.createMany({
        data: memberAddressDatas
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