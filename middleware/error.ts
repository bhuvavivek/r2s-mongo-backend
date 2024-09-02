import { NextFunction, Request, Response } from 'express';
import ErrorHandler from '../utils/errorhandler';
export default (err: any, req: Request, res: Response, next: NextFunction) => {
  err.statusCode = err.statusCode || 500;
  err.message = err.message || 'Internal Server Error';
  console.log(err)
  

  // Wrong Jwt token
  if (err.message === 'Validation failed') {
    let message = 'Validation error occur: ';
    
    // Check if validation details are available
    if (err.details) {
      // Iterate through each error detail
      err.details.forEach((value: any, key: any) => {
        message += `${key}: ${value.message}. `;
      });
    } else {
      message += 'Unknown validation error.';
    }

    err = new ErrorHandler(message, 400);
  }

  if (err.name === 'PrismaClientInitializationError:') {
    const message = 'Something bad happened try again later';
    err = new ErrorHandler(message, 400);
  }

  if (err.name === 'PrismaClientKnownRequestError:') {
    const message = 'Something bad happened try again later';
    err = new ErrorHandler(message, 400);
  }

  // Jwt Expire error
  if (err.name === 'TokenExpiredError') {
    const message = 'Json web token has expired, try again';
    err = new ErrorHandler(message, 400);
  }
  

  // Mongodb id error
  if (err.name === 'CastError') {
    const message = `Resource is not found. Invalid ${err.path}`;
    err = new ErrorHandler(message, 400);
  }

  res.status(err.statusCode).json({
    success: false,
    message: err.message,
  });
};
