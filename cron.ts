import prisma from "./controller/member/auth.controller";

const moment = require("moment");
const cron = require("node-cron");

export const  resetSearchCount = () => {
    try {
      cron.schedule("04 17 * * *", async function () {
      
        var date = moment();
        var currentDate = date.format("D/MM/YYYY");
        // console.log(currentDate);
        let date_components = currentDate.split("/");
        let day = date_components[0];
        let month = date.format("MMMM").toLowerCase();
        let year = date_components[2];
        console.log("running cron algo ");
        await prisma.member.updateMany({
          data:{
            search_count:0
          }
        }
        ).then(()=>{
          console.log('updated sucessfully')
        })

      });
    } catch (error) {
      console.log(error);
    }
  };


export const updatePromotionStatus = () => {
  try{
    cron.schedule('0 */6 * * *', async () => {
      try {
        const twentyFourHoursAgo = new Date();
        twentyFourHoursAgo.setTime(twentyFourHoursAgo.getTime() - 24 * 60 * 60 * 1000); // 24 hours ago
    
        // Update promotions that are no longer active
        await prisma.promotion.updateMany({
          where: {
            from: { lte: twentyFourHoursAgo },
            is_active: true,
            is_deleted: false,
          },
          data: {
            is_deleted: true,
          },
        });
    
        // Also update related promotionRequests
        const updatedPromotionIds = await prisma.promotion.findMany({
          where: {
            is_deleted: true,
          },
          select: {
            promotion_id: true,
          },
        });
    
        const promotionIds = updatedPromotionIds.map(promotion => promotion.promotion_id);
    
        await prisma.promotionRequest.updateMany({
          where: {
            id: { in: promotionIds },
          },
          data: {
            is_deleted: true,
            status:'expired'
          },
        });
    
        console.log(`Updated promotions and related promotion requests successfully.`);
      } catch (error) {
        console.error('Error updating promotions and promotion requests:', error);
      }
    });
    
  }catch(error){
    console.log(error , "promotion status update corn error occurs");
  }

}