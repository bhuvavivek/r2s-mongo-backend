import { celebrate, Joi } from 'celebrate';
// import { PaymentMethod } from '@prisma/client';
// import { url } from '../utils/const';
const url = /^https?:\/\/(www\.)?[a-zA-Z\d-]+\.[\w\d\-.~:/?#[\]@!$&'()*+,;=]{2,}#?$/;


export const validateCreateUser = celebrate({
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    password: Joi.string().required(),
    name: Joi.string().required().min(2).max(30),
  }),
});


const getHeaders = {
  headers: Joi.object({
    authorization: Joi.string().required()
  }).options({ allowUnknown: true }),
}


// *******************************AUTH**************************

export const validateLogin = celebrate({
  body: Joi.object().keys({
    phone: Joi.string().required(),
    password: Joi.string().required().min(8).max(15)
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



// ***********************************BUSINESS > BUSINESS ***********************************

export const getSingleBusiness = celebrate({
  ...getHeaders,
});


export const getmyBusiness = celebrate({
  ...getHeaders,
  params: Joi.object().keys({
    bussiness_id: Joi.string().default(1),
  }),
});

export const postBusinessSearch = celebrate({
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



export const getTopratedBusiness = celebrate({
  ...getHeaders,
  query: Joi.object().keys({
    page: Joi.number().integer().min(1).default(1),
    pageSize: Joi.number().integer().min(1).max(30).default(20),
    orderBy: Joi.string().valid('desc').default('desc'),
   }),
});

export const putUpdateBusinessDetail = celebrate({
  ...getHeaders,
  body: Joi.object().keys({
   
      name: Joi.string().required(),
      type: Joi.string().required(),
      hour: Joi.string().required(),
      description: Joi.string().required(),
      short_description: Joi.string().required(),

  }).required(),
});



export const putverifyingBussinessUpdateData = celebrate({
  ...getHeaders,
  body: Joi.alternatives().try(
    Joi.object().keys({
      address: Joi.string().required(),
      business: Joi.string().forbidden()
    }),
    Joi.object().keys({
      business: Joi.string().required(),
      address: Joi.string().forbidden()
    })
  ).required(),
});


// export const putverifyingBussinessUpdateData = celebrate({
//   // Spread the headers
//   ...getHeaders,
//   // Specify the body schema
//   body: Joi.object({
//     property: Joi.string().min(4).required(),
//     business: Joi.alternatives().try(
//       Joi.string().required(),
//       Joi.string().required()
//     ).required().xor('address', 'business')
//   })
// });

// ***********************************BUSINESS > SOCIAL***********************************

export const putUpdateSocialLinks = celebrate({
  ...getHeaders,
  params: Joi.object().keys({
    bussiness_id: Joi.string().default(1),
  }),
  
});


// ***********************************BUSINESS > PICTURES***********************************

export const postAddBusinessPicture = celebrate({
  ...getHeaders,
  // params: Joi.object().keys({
  //   bussiness_id: Joi.string().default(1),
    
  // }),
  body: Joi.object().keys({
    type: Joi.string().default(1).required,
    imageUrl: Joi.string().default(1).required,
    imageKey: Joi.string().default(1).required,
    
  }),
  
});




// ***********************************ORDER***********************************

export const postCreateOrder = Joi.object({
  products: Joi.array()
    .items(
      Joi.object({
        productId: Joi.string().guid({ version: 'uuidv4' }).required(),
        quantity: Joi.number().integer().min(1).required()
      })
    )
    .unique((a, b) => a.productId === b.productId) // Ensure productId is unique
    .min(1)
    .required(),
  addressId: Joi.string().guid({ version: 'uuidv4' }).required(), // Ensure addressId is a valid UUID
  // paymentMethod: Joi.string().valid().required() // Assuming payment method is restricted to 'ONLINE'
});