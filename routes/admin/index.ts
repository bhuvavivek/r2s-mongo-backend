import express from 'express';
import additionalRouter from './Additional.routes';
import authRouter from './Auth.routes';
import businessTypeRouter from './BusinessType.routes';
import businessRouter from './Bussiness.routes';
import ManageAmountRouter from './ManageAmount.routes';
import memberRouter from './Member.routes';
import paymentRouter from './Payment.routes';
import payoutRouter from './Payout.routes';
import promotionRouter from './Promotion.routes';
import supportRouter from './support.routes';


const adminRouter = express.Router();
  
adminRouter.use('/additional', additionalRouter);
adminRouter.use('/business', businessRouter);
adminRouter.use('/member', memberRouter);
adminRouter.use('/auth', authRouter);
adminRouter.use('/payment', paymentRouter);
adminRouter.use('/payout', payoutRouter);
adminRouter.use('/promotion', promotionRouter);
adminRouter.use('/support', supportRouter);
adminRouter.use('/manageamounts',ManageAmountRouter)
adminRouter.use('/businesstypes',businessTypeRouter)

export default adminRouter;