import { Response } from 'express';

class SuccessHandler {
  static sendSuccessResponse(res: Response, message: string, data?: any): Response {
    // Define responseData object with basic fields
    let responseData: { success: boolean, message: string, data?: any } = {
      success: true,
      message: message
    };

    // Include data in response if it's provided
    if (data !== undefined) {
      responseData.data = data;
    }

    return res.status(200).json(responseData);
  }
}

export default SuccessHandler;
