import express from 'express';

import feedbackRouter from './Feedback.routes';


const reviewRouter = express.Router();


reviewRouter.use('/business', feedbackRouter);


export default reviewRouter;