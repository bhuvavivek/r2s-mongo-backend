import { prisma } from '../prismaclient';

const memberData = require('../../utils/member.json')
const businessProfileData = require('../../utils/businessProfile.json')
// i need a prisma client here to connect with db and server 


async function seedMembersInfo() {
    const businessProfileDatas = await Promise.all(businessProfileData.map(async (bprofile: any) => {

        const memberemail = memberData.find((m: any) => m.id === bprofile.member_id)?.email_id;

        const member = await prisma.member.findFirst({
            where: { email_id: memberemail }
        });

        return {
    member_id:member?.id,
    bussiness_name: bprofile.bussiness_name,
    Bussiness_type:  bprofile.Bussiness_type,
    otherType:  bprofile.otherType,
    business_logo:  bprofile.business_logo,
    logo_image_key: bprofile.logo_image_key,
    business_cover_image: bprofile.business_cover_image,
    cover_image_key: bprofile.cover_image_key,
    description: bprofile.description,
    short_description: bprofile.short_description,
    website_link: bprofile.website_link,
    business_hour: bprofile.business_hour,
    rating: bprofile.rating,
    Created_at:convertToISO8601(bprofile.Created_at),
    Updated_at: convertToISO8601(bprofile.Updated_at),
    shippingFee: bprofile.shipping_fee,
        };
    }));

    await prisma.businessProfile.createMany({
        data: businessProfileDatas
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