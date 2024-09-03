import { prisma } from '../prismaclient';

const businessProfileData = require('../../utils/businessProfile.json')
const  socialLinksData= require('../../utils/socialLink.json')
const memberData = require('../../utils/member.json')
// i need a prisma client here to connect with db and server 


async function seedSocialLinks() {
    const socialLinksDatas = await Promise.all(socialLinksData.map(async (slink: any) => {

        const businessmemberId = businessProfileData.find((b: any) => b.id === slink.business_id)?.member_id;
   
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
      
            instagram:slink.instagram,
            facebook:slink.facebook,
            linkedin:slink.linkedin,
            twitter:slink.twitter,
            youtube:slink.youtube,
            Created_at: convertToISO8601(slink.Created_at),
            Updated_at: convertToISO8601(slink.Updated_at),
            business_id: businessProfile.id
        };
    }));

    await prisma.socialLink.createMany({
        data: socialLinksDatas
    });
}

function convertToISO8601(dateString : string) {
    if(!dateString) return null;
    return new Date(dateString.replace(' ', 'T')).toISOString();
}

seedSocialLinks().then((members) => {
    console.log('Seeding completed successfully');
    process.exit(0);
}).catch((err) => {
    console.error(err);
    process.exit(1);
}).finally(async ()=> {
    await prisma.$disconnect();
    console.log('Disconnected');
});