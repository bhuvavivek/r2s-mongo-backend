// Import prisma instance from the centralized module
import { prisma } from '../prismaclient';

async function seedBusinessTypes() {
  const businessTypes = [
    { type: 'Accounting' },
    { type: 'Financial Institution' },
    { type: 'Financial Services' },
    { type: 'Insurance' },
    { type: 'Investment Services' },
    { type: 'Loan Services' },
    { type: 'Dairy (Milk Products)' },
    { type: 'Vegetable & Fruit' },
    { type: 'Art Galleries' },
    { type: 'Filmmakers, Directors, Writers, Music Producers' },
    { type: 'Music Classes or Singers, Instrument Players' },
    { type: 'Music Instrument Stores' },
    { type: 'Auto Sales' },
    { type: 'Auto Services' },
    { type: 'Car Repair Shops' },
    { type: 'Motorcycle Sales & Services' },
    { type: 'Barber & Beauty Salons' },
    { type: 'Beauty Supplies' },
    { type: 'Dry Cleaners & Laundromats' },
    { type: 'Exercise & Fitness Centers' },
    { type: 'Hair Salons' },
    { type: 'Massage & Bodywork' },
    { type: 'Nail Salons' },
    { type: 'Spas' },
    { type: 'Bookstores & Libraries' },
    { type: 'Coaching & Training' },
    { type: 'Computer or IT Institutes' },
    { type: 'Educational Resources' },
    { type: 'Schools, Colleges, Teachers' },
    { type: 'Spoken English or Maths Classes' },
    { type: 'Advertising & Marketing Consultants' },
    { type: 'Employment Agencies' },
    { type: 'Graphic Design, Printing & Publishing' },
    { type: 'Human Resources' },
    { type: 'Legal Services' },
    { type: 'Office Supplies' },
    { type: 'Public Relations' },
    { type: 'Security Systems & Services' },
    { type: 'Architects, Landscape Architects, Engineers & Surveyors' },
    { type: 'Building Materials & Supplies' },
    { type: 'Carpenters' },
    { type: 'Construction Companies' },
    { type: 'Electricians' },
    { type: 'Handyman Services' },
    { type: 'Home Improvement & Repair' },
    { type: 'HVAC (Heating, Ventilation, Air Conditioning)' },
    { type: 'Inspectors' },
    { type: 'Plumbers' },
    { type: 'Roofers' },
    { type: 'Coffee Shops' },
    { type: 'Dosa & Cafes' },
    { type: 'Fast Food & Street Food' },
    { type: 'Farsan Stores' },
    { type: 'Grocery Stores' },
    { type: 'Ice Cream Shops' },
    { type: 'Restaurants' },
    { type: 'Cards & Gift Shops' },
    { type: 'Flowers & Gift Shops' },
    { type: 'Jewellery Stores' },
    { type: 'Party Supplies' },
    { type: 'Sporting Goods Stores' },
    { type: 'Toy Stores' },
    { type: 'Acupuncture' },
    { type: 'Assisted Living & Home Health Care' },
    { type: 'Audiologists' },
    { type: 'Chiropractors' },
    { type: 'Clinics & Medical Centers' },
    { type: 'Dental Services' },
    { type: 'Dietitians & Nutritionists' },
    { type: 'Laboratories & Diagnostic Services' },
    { type: 'Massage Therapy' },
    { type: 'Mental Health Services' },
    { type: 'Nurses' },
    { type: 'Optical Shops' },
    { type: 'Pharmacies' },
    { type: 'Physical Therapists' },
    { type: 'Physicians & Assistants' },
    { type: 'Podiatrists' },
    { type: 'Social Workers' },
    { type: 'Veterinary Services' },
    { type: 'Hotels & Motels' },
    { type: 'Transportation Services' },
    { type: 'Travel Agencies & Tour Operators' },
    { type: 'Furniture Stores' },
    { type: 'Home Decor & Interior Design' },
    { type: 'Home Furnishings' },
    { type: 'Home Goods' },
      { type: 'Landscape & Lawn Services' },
      { type: 'Pest Control' },
      { type: 'Pool Supplies & Services' },
      { type: 'Distribution & Warehousing' },
      { type: 'Manufacturing & Wholesale' },
      { type: 'Steel & Metal Supplies' },
      { type: 'Photography & Video Studios' },
      { type: 'Animal Care & Supplies' },
      { type: 'Cleaning Services' },
      { type: 'Crafts & Hobby Stores' },
      { type: 'Driving Schools' },
      { type: 'Event Planners' },
      { type: 'Funeral Services & Cemeteries' },
      { type: 'Mobile & Computer Stores' },
      { type: 'Pandit (Astrologers)' },
      { type: 'Security Services' },
      { type: 'Software Development' },
      { type: 'Utility Companies' },
      { type: 'Real Estate' },
      { type: 'Clothing & Accessories Stores' },
      { type: 'Department Stores' },
      { type: 'Electronics Stores' },
      { type: 'Gadget Stores' },
      { type: 'Shoe Stores & Repair' },
    ];  


    for (const businessType of businessTypes) {
        await prisma.bussinessType.create({
          data: businessType,
        });
      }
}

seedBusinessTypes().catch((e)=>{
    console.error(e);
    process.exit(1);
}).finally(async ()=> {
    await prisma.$disconnect();
})



async function checkBusinessTypes() {
    const allBusinessTypes = await prisma.bussinessType.findMany();
  }
  
  checkBusinessTypes().catch((e) => {
    console.error(e);
    process.exit(1);
  });

// 

  