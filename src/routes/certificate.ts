import fs from "node:fs";
import { sep } from "node:path";
import type { Request, Response, NextFunction } from "express";
import { config } from "../../utils/config.js";
import { isBundleId } from "../../utils/signed-ca.js";
import { red } from "../../utils/console.js";

export function getCA(req: Request, res: Response, next: NextFunction) {
  res.set("Content-Type", "application/pkcs10");

  const certificateDir = config.directory.ca;
  const intermediateCertFile = config.ca.intermediate.crt;

  const readStream = fs.createReadStream(
    `${certificateDir}${sep}${intermediateCertFile}`
  );
  readStream.on("error", (err) => {
    console.log(`${red("Read failed")} for ${intermediateCertFile}`);
    next(err);
  });
  res.set(
    "Content-Disposition",
    `attachment; filename=${intermediateCertFile}`
  );
  readStream.pipe(res);
}

export function getClient(req: Request, res: Response, next: NextFunction) {
  res.set("Content-Type", "application/pkcs12");

  const { uid } = req.body;
  const clientId = uid?.toString();

  if (!clientId || !isBundleId(clientId)) {
    res.sendStatus(400);
    return;
  }

  const certificateDir = config.directory.ca;
  const clientFile = config.ca.client.bundle?.replace(
    ".bundle.",
    `.${clientId}.`
  );

  const readStream = fs.createReadStream(
    `${certificateDir}${sep}${clientFile}`
  );
  readStream.on("error", (err) => {
    console.log(`${red("Read failed")} for ${clientFile}`);
    next(err);
  });
  res.set("Content-Disposition", `attachment; filename=${clientFile}`);

  readStream.on("end", () => {
    const d = new Date().toJSON();
    const newname = config.ca.client.bundle?.replace(
      ".bundle.",
      `.${clientId}.${d}.`
    );
    readStream.close();
    try {
      fs.renameSync(
        `${certificateDir}/${clientFile}`,
        `${certificateDir}/${newname}`
      );
    } catch (e) {
      console.log(`${red("Rename failed")} for ${newname}`);
      next(e);
    }
  });
  readStream.pipe(res);
}
