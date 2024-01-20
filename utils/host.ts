import os from "os";
import { yellow } from "./consoleColor.js";

// Get OS's external facing ip
const n = os.networkInterfaces();
const hostname = os.hostname();
const ip = Object.values(n)
  .flat()
  //@ts-expect-error
  .find(({ family, internal }) => family === "IPv4" && !internal);

let host = null;
let prettyHostname = null;
switch (true) {
  case hostname.length > 0:
    host = hostname;
    prettyHostname = hostname.endsWith(".local")
      ? hostname
      : hostname + ".local";
    break;
  case ip?.address && ip?.address?.length > 0:
    console.log(yellow("Couldn't get host Name"));

    host = ip?.address;
    break;

  default:
    throw new Error("Couldn't get host IP");
}

// console.log("host: " + blue(host));

export const lan = { address: ip?.address, hostname: prettyHostname };

