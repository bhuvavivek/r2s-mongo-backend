import express from 'express';
import pictureRouter from './Picture.routes';
import socialLinkRouter from './socialLinks.routes';
import businessInitRouter from './Bussiness.routes';

const businessRouter = express.Router();

businessRouter.use('/picture', pictureRouter);
businessRouter.use('/social', socialLinkRouter);
businessRouter.use('/',businessInitRouter, );

export default businessRouter;