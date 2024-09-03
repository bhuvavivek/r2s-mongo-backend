import { prisma } from '../prismaclient';

const businessProfileData = require('../../utils/businessProfile.json')
const memberData = require('../../utils/member.json')
const picturesData = require('../../utils/Pictures.json')
const servicesData = require('../../utils/Services.json')
// i need a prisma client here to connect with db and server 


async function seedMembersInfo() {

    const pictureSeedDatas = await Promise.all(picturesData.map(async (pdata: any) => {

        const service = await prisma.services.findFirst({
            select:{
                id:true
            }
        });

        return{
            productKey: null,
            serviceKey: service?.id,
            businessKey: null,
            image_url: pdata.image_url,
            image_key: pdata.image_key,
            Created_at: convertToISO8601(pdata.Created_at),
            Updated_at: convertToISO8601(pdata.Updated_at)
        };
    }));

    await prisma.pictures.createMany({
        data: pictureSeedDatas
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