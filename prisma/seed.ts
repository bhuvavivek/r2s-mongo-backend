// import { PrismaClient,} from '@prisma/client';

// async function main() {
//   const prisma = new PrismaClient();

//   try {
//     const email: string = typeof process.env.ADMIN_MAIL === 'string' ? process.env.ADMIN_MAIL : 'superadmin@snapeat.co.uk';
//     await prisma.admin.deleteMany({
//       where: {
//         email
//       },
//     });
//     const hashedPassword: string = await bcrypt.hash(typeof process.env.ADMIN_PASS === 'string' ? process.env.ADMIN_PASS.trim() : 'password', 10);
//     if (!hashedPassword) throw new Error('Error in Creating Hashed Password');

//     const superAdmin: AdminCreateInput = await prisma.admin.create({
//       data: {
//         role: 'super_admin',
//         name: 'Super Admin',
//         email,
//         country_code: '+44',
//         mobile: '999999999',
//         password: hashedPassword,
//         is_active: true,
//       },
//     });
//     if (!superAdmin) throw new Error('Super Admin Not Created');

//     // Delete and create Email Templates
//     await prisma.emailTemplate.deleteMany({});
//     const emailTemplates = emailTemplateData.map((data: any) => {
//       data.created_by = superAdmin.id;
//       return data;
//     });
//     await prisma.emailTemplate.createMany({
//       data: emailTemplates,
//     });

//     // Delete and create SMS Templates
//     await prisma.smsTemplate.deleteMany({});
//     const smsTemplates = smsTemplateData.map((data: any) => {
//       data.created_by = superAdmin.id;
//       return data;
//     });
//     await prisma.smsTemplate.createMany({
//       data: smsTemplates,
//     });

//     // Configs seeding
//     await prisma.config.deleteMany({});
//     const configs = configData.map((data: any) => { data.created_by = superAdmin.id; return data; });
//     await prisma.config.createMany({ data: configs });

//     // Pages seeding
//     await prisma.page.deleteMany({});
//     const pages = pageData.map((data: any) => { data.created_by = superAdmin.id; return data; });
//     await prisma.page.createMany({ data: pages });

//     // Menus seeding
//     await prisma.menu.deleteMany({});
//     const menus = menuData.map((data: any) => { data.created_by = superAdmin.id; return data; });
//     await prisma.menu.createMany({ data: menus });

//     // Permission seeding
//     await prisma.permission.deleteMany({});
//     const permissions = permissionData.map((data: any) => { data.created_by = superAdmin.id; return data; });
//     await prisma.permission.createMany({ data: permissions });

//   } catch (e) {
//     console.error(e);
//     process.exit(1);
//   } finally {
//     await prisma.$disconnect();
//   }
// }

// main();
