import express from 'express';
import productRouter from './Product.routes';
import servicesRouter from './Services.routes';
import deliveryAddressRouter from './Adress.routes';
import shoppingCartRouter from './Cart.routes';
import orderRouter from './Order.routes';

const ecommerceRouter = express.Router();

ecommerceRouter.use('/product', productRouter);
ecommerceRouter.use('/service', servicesRouter);
ecommerceRouter.use('/address', deliveryAddressRouter);
ecommerceRouter.use('/cart', shoppingCartRouter);
ecommerceRouter.use('/order', orderRouter);

export default ecommerceRouter;