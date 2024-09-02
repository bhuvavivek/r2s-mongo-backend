// Import prisma instance from the centralized module
import { prisma } from '../prismaclient';

const promotionSeedData = [
    {
        promotionAmount: 100,
        membershipAmount: 2000,
        referallAmount:500
    }
]


async function seedPromotionAndMembershipAmount() {
    try {
        // Create new records from seed data
        for (const data of promotionSeedData) {
            await prisma.promotionAndMembershipAmount.create({ data });
        }
    } catch (e) {
        console.error(e);
        process.exit(1);
    } finally {
        // Ensure the Prisma client disconnects after operations are complete
        await prisma.$disconnect();
    }
}

// Call the seed function
seedPromotionAndMembershipAmount();