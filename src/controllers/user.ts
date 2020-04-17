import { Request, Response, NextFunction } from "express";

/**
 * GET /login
 * 用户登陆
 */
export const getLogin = (req: Request, res: Response) => {
  if (req.user) {
      return res.redirect("/");
  }
  res.send('hello user');
};