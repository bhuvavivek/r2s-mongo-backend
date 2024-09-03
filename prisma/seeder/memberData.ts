import { prisma } from '../prismaclient';

const memberData = require('../../utils/member.json')

// i need a prisma client here to connect with db and server 

async  function seedMembers(){
    await prisma.member.createMany({
        data:memberData.map((m : any)=> {
            return {
                password: m.password,
                email_id: m.email_id,
                search_count: m.search_count,
                full_name: m.full_name,
                Contact_no: m.Contact_no,
                Job_title: m.Job_title,
                referal_id: m.referal_id,
                profile_picture: m.profile_picture,
                profile_image_key: m.profile_image_key,
                isWhatsapp: !!m.isWhatsapp,
                is_premium: !!m.is_premium,
                memberid: m.memberid,
                Status: m.Status,
                Valid_upto: convertToISO8601(m.Valid_upto),
                joined_at: convertToISO8601(m.joined_at),
                Created_at: convertToISO8601(m.Created_at),
                Updated_at: convertToISO8601(m.Updated_at),
                is_sales_person: !!m.is_sales_person
            }
        })
    })
}

function convertToISO8601(dateString : string) {
    if(!dateString) return null;
    return new Date(dateString.replace(' ', 'T')).toISOString();
}


seedMembers().then((members) => {
    console.log('Seeding completed successfully');
    process.exit(0);
}).catch((err) => {
    console.error(err);
    process.exit(1);
}).finally(async ()=> {
    await prisma.$disconnect();
    console.log('Disconnected');
});