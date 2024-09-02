import { Request, Response, NextFunction } from 'express';
import * as Joi from 'joi';

type Schema = Joi.ObjectSchema<any>;

const validateSchema = (schema: Schema) => (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const result = schema.validate({
    ...req.body,
    ...req.query,
    ...req.params,
  });

  if (result.error) {
    return res.status(400).json({ error: result.error.details[0].message });
  }
  next();
};

export default validateSchema;
