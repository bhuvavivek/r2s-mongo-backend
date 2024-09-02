// import axios from "axios";
import { Prisma, PrismaClient } from "@prisma/client"; // Import the PrismaClient
const prisma = new PrismaClient(); // Initialize PrismaClient
// import {deleteImageFromCloudinary} from "./common/controller"

// const sendOTP = async (phoneNumber: string) => {
//   const authKey = '408239AHI3S4Fu76534065eP1'; // Replace 'YourMSG91AuthKey' with your actual MSG91 authentication key
//   const url = 'https://api.msg91.com/api/v5/otp';

//   const requestBody = {
//     authkey: authKey,
//     template_id: 'YourTemplateID', // Replace 'YourTemplateID' with the ID of your OTP template
//     mobile: phoneNumber,
//   };

//   try {
//     const response = await axios.post(url, requestBody);
//     console.log('OTP Sent:', response.data);
//     return response.data;
//   } catch (error) {
//     console.error('Error sending OTP:', error);
//     throw error;
//   }
// };

// // Usage example
// const phoneNumber = '1234567890'; // Replace with the recipient's phone number
// sendOTP(phoneNumber);

async function getReferralCount(member_id: string) {
  try {
    const result = await prisma.$transaction([
      prisma.referralTable.count({ where: { referred_by: member_id } }), // Total count of referrals
      prisma.referralTable.count({
        where: {
          level: 0, // Count where level is 0
          referred_by: member_id,
        },
      }),
      prisma.referralTable.count({
        where: {
          level: {
            in: [1, 2], // Count child referrals where ID is 1 or 2
          },
          referred_by: member_id,
        },
      }),
      prisma.referralTable.count({
        where: {
          level: {
            in: [3, 4], // Count child referrals where ID is 1 or 2
          },
          referred_by: member_id,
        },
      }),
    ]);
    return {
      total: result[0],
      levelZero: result[1],
      childReferrals: result[2],
      subChildReferrals: result[3],
    };
  } catch (error) {
    // Handle error
    console.error(error);
    return { total: 0, levelZero: 0, childReferrals: 0, subChildReferrals: 0 };
  }
}

async function getEarningAndReferralCount(member_id: string) {
  try {
    const result = await prisma.$transaction([
      prisma.referralTable.aggregate({
        _sum: {
          amount: true,
        },
        _count: true,
        where: {
          referred_by: member_id,
        },
      }),
      prisma.referralTable.aggregate({
        _sum: {
          amount: true,
        },
        _count: true,
        where: {
          level: 0,
          referred_by: member_id,
        },
      }),
      prisma.referralTable.aggregate({
        _sum: {
          amount: true,
        },
        _count: true,
        where: {
          level: {
            in: [1, 2], // Count child referrals where ID is 1 or 2
          },
          referred_by: member_id,
        },
      }),
      prisma.referralTable.aggregate({
        _sum: {
          amount: true,
        },
        _count: true,
        where: {
          level: {
            in: [3, 4], // Count child referrals where ID is 1 or 2
          },
          referred_by: member_id,
        },
      }),
    ]);
 
    return {
      total: result[0],
    };
  } catch (error) {
    // Handle error
    console.error(error);
    return { total: 0, levelZero: 0, childReferrals: 0, subChildReferrals: 0 };
  }
}


// async function updateWallet(member_id: string) {
//   try {
//     const result = await prisma.$transaction([
//       prisma.payoutHistory.aggregate({
//         _sum: {
//           amount: true,
//         },
//         _count: true,
//         where: {
//           member_id: member_id,
//           status:"approved"
//         },
//       }),
//       prisma.referralTable.aggregate({
//         _sum: {
//           amount: true,
//         },
//         _count: true,
//         where: {
//           level: 0,
//           refered_by: member_id,
//         },
//       }),
//       prisma.referralTable.aggregate({
//         _sum: {
//           amount: true,
//         },
//         _count: true,
//         where: {
//           level: {
//             in: [1, 2], // Count child referrals where ID is 1 or 2
//           },
//           refered_by: member_id,
//         },
//       }),
//       prisma.referralTable.aggregate({
//         _sum: {
//           amount: true,
//         },
//         _count: true,
//         where: {
//           level: {
//             in: [3, 4], // Count child referrals where ID is 1 or 2
//           },
//           refered_by: member_id,
//         },
//       }),
//     ]);
//     console.log(result, "this is amount");
//     return {
//       total: result[0],
//     };
//   } catch (error) {
//     // Handle error
//     console.error(error);
//     return { total: 0, levelZero: 0, childReferrals: 0, subChildReferrals: 0 };
//   }
// }


async function handlingSearchLimit() {
  
    try {
     const search_limit =await prisma.additionalDetail.findUnique({
      where:{id:1},
      select:{
        search_limit:true
      }
     })

     console.log(search_limit,"sssssssssssssssss")
     const search_count=1

    } catch (error) {
      console.error("Registration failed:", error);
    }
  
}

async function resetSearchLimit(member_id:string) {
  await prisma.member.update({
    where:{id:member_id},
    data:{
      search_count:0,
      is_premium:true
    }
  })
}

async function updateMemberValidUpto(member_id:string) {
  const currentDate = new Date();
  const validUptoDate = new Date(currentDate);
  validUptoDate.setFullYear(validUptoDate.getFullYear() + 1);
  await prisma.member.update({
    where:{id:member_id},
    data:{
      Valid_upto:validUptoDate
    }
  })
}

// async function updateBussinessCateogory(member_id:string) {
//   const currentDate = new Date();
//   const validUptoDate = new Date(currentDate);
//   validUptoDate.setFullYear(validUptoDate.getFullYear() + 1);
  
//   await prisma.businessProfile.update({
//     where:{id:member_id},
//     data:{
//       Bussiness_type:bussinessType.id
//     }
//   })
// }

async function deleteAllPaymentAndPayout() {
  const currentDate = new Date();
  const validUptoDate = new Date(currentDate);
  validUptoDate.setFullYear(validUptoDate.getFullYear() + 1);
  await prisma.payoutHistory.deleteMany()
  await prisma.paymentHistory.deleteMany()
}

async function deleteAdminAccount() {
  const currentDate = new Date();
  const validUptoDate = new Date(currentDate);
  validUptoDate.setFullYear(validUptoDate.getFullYear() + 1);
  await prisma.admin.deleteMany()
}



export async function updateSingleEarningStatus(member_id:string) {
  const approvedReferrals = await prisma.referralTable.groupBy({
    by: ['referred_by'],
    where: {
      status: 'approved',
      referred_by:member_id
    },
    _sum:{
      amount:true
    }
    
  });
  
  for (const referral of approvedReferrals) {
    const { referred_by, _sum } = referral;
    // const totalEarnings = _sum?.amount 
    const totalEarnings: Prisma.Decimal | null = _sum?.amount || null;
   
    if (totalEarnings !==  null) {
      const earningsValue: number = parseFloat(totalEarnings.toString());
      const data=await prisma.memberInfo.update({
        where: {
          member_id:referred_by 
        },
        data: {
          revenue: earningsValue
        }
      });
      console.log(data)
    }
  }

  console.log(approvedReferrals)
}


export async function updateAllBalances() {
  try {
    const allMembers = await prisma.memberInfo.findMany();
    console.log(allMembers,"this is all member data ")

    await Promise.all(
      allMembers.map(async (member) => {
        const revenue = Number(member.revenue); // Convert Prisma.Decimal to number
        const withdrawal = Number(member.withdrawl); // Convert Prisma.Decimal to number

        const newBalance = revenue - withdrawal;

        await prisma.memberInfo.updateMany({
          where: {
            member_id: member.member_id,
          },
          data: {
            balance: newBalance,
          },
        });
      })
    );
    
    return { success: true, message: 'All balances updated successfully' };
  } catch (error) {
    return { success:false,error };
  }
}



async function deleteAccount(memberId: string): Promise<void> {
  try {

const bussiness=await prisma.businessProfile.findFirst({
  where:{
    member_id:memberId
  }
})

    await prisma.paymentHistory.deleteMany({
      where: {
        member_id: memberId,
      },
    });

    await prisma.referralTable.deleteMany({
      where: {
        referred_to: memberId,
      },
    });

    await prisma.referralTable.deleteMany({
      where: {
        referred_by: memberId,
      },
    });

    // Continue with other tables...
    await prisma.payoutHistory.deleteMany({
      where: {
        member_id: memberId,
      },
    });

    await prisma.businessFeedback.deleteMany({
      where: {
        member_id: memberId,
      },
    });

    // Delete child records
    await prisma.bankDetail.deleteMany({
      where: {
        member_id: memberId,
      },
    });

   

    await prisma.bussinessAddress.deleteMany({
      where: {
        business_ProfileId: bussiness?.id,
      },
    });

    await prisma.memberAddress.deleteMany({
      where: {
        member_id: memberId,
      },
    });

    await prisma.interiorExteriorImages.deleteMany({
      where: {
        business_id: bussiness?.id,
      },
    });

    // await prisma.pictures.deleteMany({
    //   where: {
    //     keyId: bussiness?.id,
    //   },
    // });

    // await prisma.socialLink.delete({
    //   where: {
    //     business_id: bussiness?.id,
    //   },
    // });

    // Continue with other tables...
    await prisma.businessProfile.deleteMany({
      where: {
        member_id: memberId,
      },
    });
    // Delete one-to-one related records
    await prisma.memberInfo.delete({
      where: {
        member_id: memberId,
      },
    });

    // Delete the main record
    await prisma.member.delete({
      where: {
        id: memberId,
      },
    });

  } catch (error) {
    console.error(`Error deleting account: ${error}`);
  } finally {
    await prisma.$disconnect();
  }
}


// export async function createAllMemberInfo() {
//   console.log("update Balance with referral running")
//   try {
//     const allMembers = await prisma.member.findMany();
//     console.log(allMembers)

//     console.log("found this as all member",allMembers)

//     await Promise.all(
//       allMembers.map(async (member) => {
//         const memeberDetail=await prisma.memberInfo.findUnique({
//           where:{member_id:member.id}
//         })
//         if(!memeberDetail){
//           await prisma.memberInfo.create({
//             data:{
//               member_id:member.id,
//               revenue:0,
//               balance:0,
//               withdrawl:0,
//             }
//           })
//         }
//       })
//     );

    
//     console.log('All balances updated successfully')
//     return { success: true, message: 'All balances updated successfully' };
//   } catch (error) {
//     return { success:false,error };
//   }
// }


export async function getReferalData(memberId: string) {
  try {
    
    const name =await prisma.member.findUnique({
      where:{id:memberId},
      select:{
        full_name:true
      }

    })

 
    const data =await prisma.referralTable.findMany({
      where:{referred_by:memberId},
      include:{
        Member:{
          select:{
            full_name:true,
          }
        }
      }
    })
    
if(data){
  data.forEach((element)=>{
    console.log(name,"refered to ",element.Member?.full_name,"and level is",element.level,"id is ",element.id)
    
  })
}

    // console.log('All balances updated successfully',data)
    return { success: true, message: 'All balances updated successfully' };
  } catch (error) {
    return { success:false,error };
  }
}



// export async function testReferral() {
//   try {
//     console.log('testRefrrall is running')
//  const data=await prisma.orderHistory.create({
//   data:{
//     item_id:"28bb3ff5-e2e8-40d1-859d-4cfd4eabb6b6",
//     member_id:"318783e6-077a-4eeb-b885-f0584a46b9db",
//     address_id:"0685997f-4f89-4d64-af80-b4a26ed0c75b",
//     amount:parseInt('223'),
//     quantity:parseInt('1'),
//     status:'APPROVED',
//     paymentStatus:'approved'
//   }
//  })

//  console.log(data,'this is data')
//     // console.log('All balances updated successfully',data)
//     return { success: true, message: 'All balances updated successfully' };
//   } catch (error) {
//     console.log(error)
//   }
// }

// Example usage:
// createAllMemberInfo()
// updateEarningStatus()
// updateSingleEarningStatus('8b7f20be-4019-460d-a3fd-e2e54a221d54')
// deleteAllPaymentAndPayout()
// deleteAdminAccount()
// updateEarningStatus()
// testReferral()


// updateMemberValidUpto("e397295e-6656-4bc8-ad98-c6c2cd937fa0")
// async function resetSearchLimit(member_id:string) {
// await prisma
// }
// deleteImageFromCloudinary("AanadHospital/if7fxhakdcvpi2cnxmjc")
// getReferralCount("ba7cd590-e040-45b4-8187-75b197284d8a");
// getEarningCount("ba7cd590-e040-45b4-8187-75b197284d8a");
// handlingSearchLimit("ba7cd590-e040-45b4-8187-75b197284d8a")
// resetSearchLimit("285c8581-d3b6-481c-a8b2-e9b89d4e97f0")
// updateBussinessCateogory("fe476b8e-6be8-4f07-b1dc-de1a573cc4bb")