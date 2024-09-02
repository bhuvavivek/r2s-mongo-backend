
import { prisma } from '../prismaclient';
async function addWalletBalance (){
    await prisma.memberInfo.update({
        where: {
            member_id: '22f9a0df-04e8-4a6d-a708-bdade6fb48bc'
        },
        data: {
            balance: 50000
        }
    });
}

addWalletBalance().catch(
    (e)=>{
        console.error(e);
        process.exit(1);
    }
).then(async ()=>{
    await prisma.$disconnect();
})