import express from 'express';
import authRouter from './Auth.routes';
import earningRouter from './Earning.routes';
import paymentRouter from './Payment.routes';
import payoutRouter from './Payout.routes';
import promotionRouter from './Promotion.routes';
import referalRouter from './Referral.routes';
import trasactionRouter from './Transaction.routes';
import askRouter from './ask.routes';
import businessRouter from './bussiness';
import ecommerceRouter from './ecommerce';
import feedbackRouter from './review.routes';
import supportRouter from './support.routes';

const memberRouter = express.Router();

memberRouter.use('/business', businessRouter);
memberRouter.use('/auth', authRouter);
memberRouter.use('/payment', paymentRouter);
memberRouter.use('/payout', payoutRouter);
memberRouter.use('/feedback', feedbackRouter);
memberRouter.use('/promotion', promotionRouter);
memberRouter.use('/earning', earningRouter);
memberRouter.use('/referral', referalRouter);
memberRouter.use('/transaction', trasactionRouter);
memberRouter.use('/ecommerce', ecommerceRouter);
memberRouter.use('/support', supportRouter);
memberRouter.use('/ask', askRouter);

export default memberRouter;