import type { Request, Response, NextFunction } from "express";
import { cyan, red } from "../../utils/consoleColor.js";

/**
 * Check origin
 */
export function log(
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.log(
    (req.secure ? "https" : red("http")) +
      " " +
      cyan(req.method) +
      " " +
      req.url
  );

  next();
}

/**
 * Custom 404 message
 */
export function custom404() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return function (req: Request, res: Response, next: NextFunction) {
    res.status(404).send("That couldn't be found...");
  };
}

/**
 * Custom error handler
 */
export function customError() {
  return function (
    err: unknown,
    req: Request,
    res: Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    next: NextFunction
  ) {
    if (err instanceof Error) {
      console.error(err.stack);
    }
    console.log("\n . . .\n\n");
    res.status(500).send("Something broke!");
  };
}
