import express from 'express';
import adminRouter from './admin';
import memberRouter from './member';
import commonRouter from './common.routes';

const Router = express.Router();

Router.use('/admin', adminRouter);
Router.use('/member', memberRouter);
Router.use('/common', commonRouter);

export default Router;

// http://locahost:808/api/admin/login => Post