import { prisma } from '../prismaclient';

const memberData = require('../../utils/member.json')
const bankDetailsData = require('../../utils/bankDetail.json')
// i need a prisma client here to connect with db and server 


async function seedMembersInfo() {
    const bankDetailDatas = await Promise.all(bankDetailsData.map(async (bdetail: any) => {

        const memberemail = memberData.find((m: any) => m.id === bdetail.member_id)?.email_id;

        const member = await prisma.member.findFirst({
            where: { email_id: memberemail }
        });

        return {
            member_id: member?.id,
            Account_name: bdetail.Account_name,
            Account_no: bdetail.Account_no,
            Ifsc_code: bdetail.Ifsc_code,
            bank_name: bdetail.bank_name,
            upi_id:bdetail.upi_id,
        };
    }));

    await prisma.bankDetail.createMany({
        data: bankDetailDatas
    });
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