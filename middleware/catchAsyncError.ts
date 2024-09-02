import { Request, Response, NextFunction } from 'express';

// const catchAsyncError = (theFunc: (req: Request, res: Response, next: NextFunction) => Promise<any>) => (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   Promise.resolve(theFunc(req, res, next)).catch(next);
// };

const catchAsyncError = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch((error) => {
    next(error);
  });
};


export default catchAsyncError;
