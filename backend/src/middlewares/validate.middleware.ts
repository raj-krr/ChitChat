import { Request, Response, NextFunction } from "express";

export interface ValidationSchema {
  body?: (data: any) => { error?: string };
  params?: (data: any) => { error?: string };
  query?: (data: any) => { error?: string };
}

/**
 * Generic Request Validation Middleware.
 * Validates request body, params, or queries against lightweight schema checkers.
 */
export const validate = (schema: {
  body?: (data: any) => { error?: string };
  params?: (data: any) => { error?: string };
  query?: (data: any) => { error?: string };
}) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (schema.body) {
      const { error } = schema.body(req.body);
      if (error) {
        return res.status(400).json({ success: false, msg: error });
      }
    }

    if (schema.params) {
      const { error } = schema.params(req.params);
      if (error) {
        return res.status(400).json({ success: false, msg: error });
      }
    }

    if (schema.query) {
      const { error } = schema.query(req.query);
      if (error) {
        return res.status(400).json({ success: false, msg: error });
      }
    }

    next();
  };
};
