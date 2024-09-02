// app.ts

import bodyParser from 'body-parser';
import { errors } from 'celebrate';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { NextFunction, Request, Response } from 'express';
import fileUpload from 'express-fileupload';
import { resetSearchCount, updatePromotionStatus } from './cron';
import errorHandlingMiddleware from './middleware/error';
import routes from './routes';
import swaggerDoc from './swagger';
import ErrorHandler from './utils/errorhandler';
import { celebrateErrorHandler } from './validations/admin.validation';

import path from 'path';



const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(
  fileUpload({
    useTempFiles: true,
  })
);

resetSearchCount();
updatePromotionStatus();

app.use((err: ErrorHandler, req: Request, res: Response, next: NextFunction) => {
  res.status(err.statusCode || 500).json({
    message: err.message,
  });
});

const corsOptions: cors.CorsOptions = {
  origin: '*',
  methods: ['POST', 'PUT', 'GET', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors({}));

app.use('/api', routes);
swaggerDoc(app)
app.use(express.static(path.join(__dirname, 'public')))

app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
});

app.get('/checkout', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/health', (req: Request, res: Response, next: NextFunction) => {
  res.send('OK');
});

app.get('/test', (req: Request, res: Response, next: NextFunction) => {
  res.send('This is a test route.');
});


app.use(errorHandlingMiddleware);
app.use(celebrateErrorHandler);
app.use(errors());



export default app;
