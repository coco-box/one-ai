import { Response } from 'express';

interface IResponse {
  success: boolean;
  message: string;
  data: any;
  code: number;
}

export const sendResponse = (res: Response, statusCode: number, message: string, data: any = null, success: boolean = true) => {
  const response: IResponse = {
    success,
    message,
    data,
    code: statusCode,
  };
  res.status(statusCode).json(response);
};

export const success = (res: Response, message: string = 'Success', data: any = null) => {
  sendResponse(res, 200, message, data, true);
};

export const created = (res: Response, message: string = 'Created', data: any = null) => {
  sendResponse(res, 201, message, data, true);
};

export const badRequest = (res: Response, message: string = 'Bad Request', data: any = null) => {
  sendResponse(res, 400, message, data, false);
};

export const unauthorized = (res: Response, message: string = 'Unauthorized', data: any = null) => {
  sendResponse(res, 401, message, data, false);
};

export const notFound = (res: Response, message: string = 'Not Found', data: any = null) => {
  sendResponse(res, 404, message, data, false);
};

export const serverError = (res: Response, message: string = 'Internal Server Error', data: any = null) => {
  sendResponse(res, 500, message, data, false);
}; 