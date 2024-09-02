import { celebrate, Joi, errors } from 'celebrate';
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import ErrorHandler from '../utils/errorhandler';
// import { url } from '../utils/const';
const url = /^https?:\/\/(www\.)?[a-zA-Z\d-]+\.[\w\d\-.~:/?#[\]@!$&'()*+,;=]{2,}#?$/;

/**************************COMMON**********************************/

const getHeaders = {
  headers: Joi.object({
    authorization: Joi.string().required()
  }).options({ allowUnknown: true }),
}


interface DecodedUser {
  userId: string;
}

//   export const validate = (schema: any) => celebrate({
//     headers: Joi.object({
//       authorization: Joi.string().required(),
//     }).options({ allowUnknown: true }), // Allow other headers to pass through
//   });




// *******************************AUTH**************************

export const loggedIn = celebrate({
  ...getHeaders,
});

export const postLogin = celebrate({
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    password: Joi.string().required().min(8).max(15)
  }),
});

export const putUpdatePicture = celebrate({
  ...getHeaders,
  body: Joi.object().keys({
    image: Joi.string().required(),
    image_key: Joi.string().required(),
    type: Joi.string().required().equal('profile')
  }),
});


export const putAdminDetail = celebrate({
  ...getHeaders,
  body: Joi.object().keys({
    name: Joi.string().required().min(2).max(20),
    contact: Joi.string().required(),
  }),
});


export const patchPassword = celebrate({
  ...getHeaders,
  body: Joi.object().keys({
    password: Joi.string().required().min(6),
    confirm_password: Joi.string().valid(Joi.ref('password')).required(),
    current_password: Joi.string().required(),
  }),
});



// ************************************ADDITIONAL**********************************


export const putAdditionalData = celebrate({
  ...getHeaders,
  body: Joi.object().keys({
    search_limit: Joi.number().required().min(6),
    Master_referall_amount: Joi.number().required(),
    Child_referall_amount: Joi.number().required(),
    SubChild_referall_amount: Joi.number().required(),
    discount: Joi.number().required(),
    contact_no: Joi.string().required(),
    contact_email: Joi.string().required(),
  }),
});

export const getBusinessSearch = celebrate({
  ...getHeaders,
  query: Joi.object().keys({
    member_name: Joi.string().allow('').optional(),
    bussiness_name: Joi.string().allow('').optional(),
    sort_by: Joi.string().valid('Created_at', 'Updated_at', 'Status').default('Created_at'),
    status: Joi.string().allow('').optional(),
    order_by: Joi.string().valid('asc', 'desc').default('asc'),
    perpage: Joi.number().integer().min(1).max(20).default(20),
    page: Joi.number().integer().min(1).default(1)
  }),
});

export const getAllMemberProfile = celebrate({
  ...getHeaders,
  query: Joi.object().keys({
    page: Joi.number().integer().min(1).default(1),
    perpage: Joi.number().integer().min(1).max(20).default(20),
    sortOrder: Joi.string().valid('asc', 'desc').default('asc'),
    sortBy: Joi.string().valid('Created_at', 'Updated_at').default('Created_at'),
    status: Joi.string().valid('pending', 'active', 'blocked').allow('').optional(),
    full_name: Joi.string().allow('').optional(),
    memberid: Joi.string().allow('').optional(),
    email_id: Joi.string().allow('').optional(),
    Contact_no: Joi.string().allow('').optional(),
    bussiness_name: Joi.string().allow('').optional(),
  }),
});


export const getSingleMember = celebrate({
  ...getHeaders,
  params: Joi.object().keys({
    memberId: Joi.string().default(1),
  }),
});

export const putSingleMember = celebrate({
  ...getHeaders,
  params: Joi.object().keys({
    memberId: Joi.string().default(1),
  }),
  body: Joi.object().keys({
    status: Joi.string().required().valid('pending', 'active', 'blocked'),
  }),
});



export const getPayment = celebrate({
  ...getHeaders,
  query: Joi.object().keys({
    page: Joi.number().integer().min(1).default(1),
    perpage: Joi.number().integer().min(1).max(20).default(20),
    sortOrder: Joi.string().valid('asc', 'desc').default('asc'),
    sortBy: Joi.string().valid('created_at', 'updated_at', 'status').default('created_at'),
    status: Joi.string().valid('pending', 'completed', 'failed').allow('').optional(), // Assuming PaymentStatus is a valid enum or string type
  }),
});

export const patchPaymentStatus = celebrate({
  ...getHeaders,
  params: Joi.object().keys({
    id: Joi.string().default(1),
  }),
  body: Joi.object().keys({
    status: Joi.string().required().valid('pending', 'approved', 'rejected','refunded'),
  }),
});


// *******************************PAYOUT*************************************************************


export const getPayout = celebrate({
  ...getHeaders,
  query: Joi.object().keys({
    page: Joi.number().integer().min(1).default(1),
    perpage: Joi.number().integer().min(1).max(20).default(20),
    sortOrder: Joi.string().valid('asc', 'desc').default('asc'),
    sortBy: Joi.string().valid('created_at', 'updated_at', 'status').default('created_at'),
    status: Joi.string().valid('pending', 'completed', 'failed').allow('').optional(), // Assuming PaymentStatus is a valid enum or string type
  }),
});


export const patchPayoutStatus = celebrate({
  ...getHeaders,
  params: Joi.object().keys({
    id: Joi.string().default(1),
  }),
  body: Joi.object().keys({
    status: Joi.string().required().valid('pending', 'approved', 'rejected'),
    transaction_id: Joi.string().required(),
  }),
});


// *******************************Promotion*************************************************************


export const getPromotions = celebrate({
  ...getHeaders,
  query: Joi.object().keys({
    page: Joi.number().integer().min(1).default(1),
    perpage: Joi.number().integer().min(1).max(20).default(20),
    sortOrder: Joi.string().valid('asc', 'desc').default('asc'),
    sortBy: Joi.string().valid('created_at', 'updated_at', 'status').default('created_at'),
    status: Joi.string().valid('pending', 'approved', 'rejected').allow('').optional(), // Assuming PaymentStatus is a valid enum or string type
  }),
});

export const putPromotion = celebrate({
  ...getHeaders,
  params: Joi.object().keys({
    id: Joi.string().default(1),
  }),
  body: Joi.object().keys({
    status: Joi.string().required().valid('pending', 'approved', 'rejected'),
  }),
});



export const validateUserId = celebrate({
  params: Joi.object().keys({
    userId: Joi.string().length(24).hex().required(),
  }),
});

export const validateUserInfo = celebrate({
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    name: Joi.string().required().min(2).max(30),
  }),
});

export const validateCreateMovie = celebrate({
  body: Joi.object().keys({
    country: Joi.string().required(),
    director: Joi.string().required(),
    duration: Joi.number().required(),
    year: Joi.string().required(),
    description: Joi.string().required(),
    image: Joi.string().required().regex(url),
    trailerLink: Joi.string().required().regex(url),
    thumbnail: Joi.string().required().regex(url),
    nameRU: Joi.string().required(),
    nameEN: Joi.string().required(),
    movieId: Joi.number().required(),
  }),
});

export const validateMovieId = celebrate({
  params: Joi.object().keys({
    movieId: Joi.string().alphanum().length(24).hex(),
  }),
});


export const celebrateErrorHandler = errors();
