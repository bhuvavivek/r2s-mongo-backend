import { prisma } from '../prismaclient';

const businessProfileData = require('../../utils/businessProfile.json')
const  businessAddressData= require('../../utils/bussinessAddress.json')
const memberData = require('../../utils/member.json')
// i need a prisma client here to connect with db and server 


async function seedMembersInfo() {
    const businessAddressDatas = await Promise.all(businessAddressData.map(async (baddress: any) => {

        const businessmemberId = businessProfileData.find((b: any) => b.id === baddress.business_ProfileId)?.member_id;
   
        const memberemail = memberData.find((m:any)=> m.id === businessmemberId)?.email_id;

        const member = await prisma.member.findFirst({
            where: { email_id: memberemail }
        });

        const  businessProfile = await prisma.businessProfile.findFirst({
            where: { member_id: member?.id }
        });
        if (!businessProfile) {
            throw new Error(`Business profile not found for member with id: ${member?.id}`);
        }
        return{
      
            address_line_1:baddress.address_line_1,
            address_line_2: baddress.address_line_2,
            city: baddress.city,
            state: baddress.state,
            area: baddress.area,
            country:  baddress.country,
            pincode: baddress.pincode,
            type:  baddress.type,
            Created_at: convertToISO8601(baddress.Created_at),
            Updated_at: convertToISO8601(baddress.Updated_at),
            business_ProfileId: businessProfile.id
        };
    }));

    await prisma.bussinessAddress.createMany({
        data: businessAddressDatas
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