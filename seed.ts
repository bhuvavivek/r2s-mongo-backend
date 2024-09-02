import { PrismaClient, } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

enum UserType {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
}
export async function seedData() {
  try {
    // Insert sample users with hashed passwords
    const users = [
      {
        email: 'user1@example.com',
        name: 'John Doe',
        password: await bcrypt.hash('password1', 10),
        profile_photo:"sss",
        profile_image_key:"sss",
        type: UserType.ADMIN,
        phone: '7729952301',
      },
      {
        email: 'user2@example.com',
        name: 'Jane Smith',
        profile_photo:"sss",
        profile_image_key:"sss",
        password: await bcrypt.hash('password2', 10),
        type: UserType.MANAGER,
        phone: '1234567890',
      },
    ];

   

    await prisma.admin.create({
      data:  {
        email: 'return2success@gmail.com',
        name: 'Mayur Solanki',
        profile_photo:"sss",
        profile_image_key:"sss",
        password: await bcrypt.hash('Mobile@1612', 10),
        type: UserType.MANAGER,
        phone: '9979554775',
      },
    });
  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

import Chance from 'chance';
const chance = new Chance();


// async function createDummyData() {
//   try {
//     // Create a dummy Member
//     const member = await prisma.member.create({
//       data: {
//         email_id: chance.email(),
//         Contact_no: chance.phone(),
//         Job_title: chance.pickone(['Owner', 'Manager']),
//         referal_id: null,
//         profile_picture: chance.url(),
//         Memeber_id: 'MEM001',
//         Status: chance.pickone(['active', 'pending', 'blocked']),
//         Valid_upto: chance.date({ year: chance.integer({ min: 2023, max: 2025 }) }),
//         Wallet: chance.floating({ min: 0, max: 10000, fixed: 2 }),
//       },
//     });

//     // Create a dummy Business_Profile
//     const businessProfile = await prisma.business_Profile.create({
//       data: {
//         member_id: member.id,
//         bussiness_name: chance.word(),
//         Bussiness_type: chance.pickone(['CLOTH', 'JEWELLERS']), // Use enum values
//         business_logo: chance.url(),
//         description: chance.sentence({ words: 10 }),
//         website_link: chance.url(),
//         business_hour: chance.pickone(['9:00 AM - 5:00 PM', '8:00 AM - 6:00 PM']),
//       },
//     });

//     // Create a dummy Address
//     const address = await prisma.address.create({
//       data: {
//         address_line_1: chance.address(),
//         address_line_2: chance.address({ short_suffix: true }),
//         city: chance.city(),
//         state: chance.state(),
//         country: chance.country({ full: true }),
//         pincode: chance.zip(),
//         type: 'permanent', // Use enum value
//         business_ProfileId: businessProfile.id,
//       },
//     });

//     // Create a dummy Social_Link
//     const socialLink = await prisma.social_Link.create({
//       data: {
//         business_id: businessProfile.id,
//         link: chance.url(),
//         type: chance.pickone(['Instagram', 'Facebook', 'LinkedIn', 'Twitter']),
//       },
//     });

//     // Create a dummy Interior_Exterior_Picture_Links
//     const interiorExteriorLink = await prisma.interior_Exterior_Picture_Links.create({
//       data: {
//         business_id: businessProfile.id,
//         image_url: chance.url(),
//         type: chance.pickone(['Interior', 'Exterior']),
//       },
//     });

//     // Create a dummy Product_Picture_Link
//     const productLink = await prisma.product_Picture_Link.create({
//       data: {
//         business_id: businessProfile.id,
//         image_url: chance.url(),
//       },
//     });

//     // Create a dummy Payment_History
//     const paymentHistory = await prisma.payment_History.create({
//       data: {
//         member_id: member.id,
//         amount: chance.floating({ min: 0, max: 1000, fixed: 2 }),
//         status: chance.pickone(['approved', 'pending', 'rejected']),
//       },
//     });

//     console.log('Dummy data created successfully.');
//   } catch (error) {
//     console.error('Error creating dummy data:', error);
//   } finally {
//     await prisma.$disconnect();
//   }
// }





async function insertAdditionalData() {
  try {
    const createdData = await prisma.additionalDetail.create({
      data: {
        search_limit: 30,
        Master_referall_amount: 0,
        Child_referall_amount: 0,
        SubChild_referall_amount: 0,
        discount: 0, // Generating a random BigInt within 0 to 999
        contact_no: '1234567890', // Replace with actual phone number generation method
        contact_email: 'test@example.com', // Replace with actual email generation method
      },
    });

    console.log('Inserted dummy data:', createdData );
  } catch (error) {
    console.error('Error inserting dummy data:', error);
  } finally {
    await prisma.$disconnect();
  }
}


async function addColoumValue() {
  try {
    const createdData = await prisma.bussinessAddress.updateMany({
    data:{
      area:"vesu"
    }
    });

    console.log('Inserted dummy data:', createdData);
  } catch (error) {
    console.error('Error inserting dummy data:', error);
  } finally {
    await prisma.$disconnect();
  }
}



async function updateUsername() {
  try {
    const createdData = await prisma.member.update({
    where:{id:"2b46d731-e6fc-4ff0-9bd5-10cc747f16de"},
    data:{
      memberid:"Mohit",
    }
    });

    console.log('updated member detail Sucessfully data:', createdData);
  } catch (error) {
    console.error('Error inserting dummy data:', error);
  } finally {
    await prisma.$disconnect();
  }
}


async function handlingSocialLinks() {
  try {
    const businessData = await prisma.businessProfile.findMany();
    
    for (const item of businessData) {
      console.log(item.id);
      const createdData = await prisma.socialLink.createMany({
        data: {
          linkedin: "",
          instagram: "",
          facebook: "",
          twitter: "",
          youtube: "",
          business_id: item.id
        }
      });
      console.log("created data is ", createdData);
    }
  } catch (error) {
    console.error('Error inserting dummy data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function insertBussinessAddress() {
  try {
    const businessData = await prisma.businessProfile.findMany();
    
    for (const item of businessData) {
      console.log(item.id);
      const createdData = await prisma.bussinessAddress.createMany({
        data: {
          address_line_1:"hello",
          address_line_2:"hi",
          pincode:"11111",
          state:"Andhra Pradesh",
          city:"Anantapur",
          area:"vesu",
          country:"india",
          type:"permanent",
          business_ProfileId: item.id
        }
      });
      console.log("created data is ", createdData);
    }
  } catch (error) {
    console.error('Error inserting dummy data:', error);
  } finally {
    await prisma.$disconnect();
  }
}



// insertBussinessAddress();





// handlingSocialLinks()

// createDummyData();
// updateUsername()







// createDummyData();


// Call the seedData function to insert data
// insertAdditionalData()
seedData();
// addColoumValue();
// insertDummyData()
