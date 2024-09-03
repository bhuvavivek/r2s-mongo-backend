import { prisma } from '../prismaclient';

const businessProfileData = require('../../utils/businessProfile.json')
const  serviceData= require('../../utils/Services.json')
const memberData = require('../../utils/member.json')
// i need a prisma client here to connect with db and server 


async function seedServiceData() {
    const serviceDatas = await Promise.all(serviceData.map(async (sdata: any) => {

        const businessmemberId = businessProfileData.find((b: any) => b.id === sdata.bussiness_id)?.member_id;
   
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
            price:sdata.price,
            title:sdata.title,
            description:sdata.description,
            created_at: convertToISO8601(sdata.created_at),
            updated_at: convertToISO8601(sdata.updated_at),
            bussiness_id: businessProfile.id
        };
    }));

    await prisma.services.createMany({
        data: serviceDatas
    });
}

function convertToISO8601(dateString : string) {
    if(!dateString) return null;
    return new Date(dateString.replace(' ', 'T')).toISOString();
}


seedServiceData().then((members) => {
    console.log('Seeding completed successfully');
    process.exit(0);
}).catch((err) => {
    console.error(err);
    process.exit(1);
}).finally(async ()=> {
    await prisma.$disconnect();
    console.log('Disconnected');
});