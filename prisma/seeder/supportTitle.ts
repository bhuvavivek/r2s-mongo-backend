import { prisma } from '../prismaclient';

const supportTitles = [
    "Ask",
    "Ecommerce",
    'Find Business',
    'Find Service',
    'Find Product',
    "Manage Business",
    "MemberShip",
    "My Business",
    "My Orders",
    "My Services",
    "Order",
    "Promotion",
    "Service",
    "Wallet",
    "Withdrawal",
  ].map(title => ({title}))

  async  function  createSupportTitles () {
try{
    for (const title of supportTitles){
        await prisma.supportTitle.create({data:title});
    }
}catch(error){
    console.log(error)
}
}


createSupportTitles();