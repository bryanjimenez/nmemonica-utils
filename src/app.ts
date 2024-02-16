import express from "express";
import http from "node:http";
import https from "node:https";
import { lan } from "../utils/host.js";
import { ca } from "../utils/signed-ca.js";
import { custom404, customError, log } from "./helper/utilHandlers.js";
import { getCA, getClient } from "./routes/certificate.js";
import { magenta, yellow } from "../utils/console.js";
import { config } from "../utils/config.js";

const httpPort = config.cert.port.http;
const httpsPort = config.cert.port.https;

if (!lan.address) {
  throw new Error("Could not get host IP");
}

const localhost = lan.address; // or "localhost"
export const serviceIP = lan.address; // or lan.hostname

export default function runService() {
  const app = express();

  app.disable("x-powered-by");
  app.use(log);

  app.get("/", (req, res) => {
    const secureDownload = `client id: <input type="text" name="uid" size="5" />&nbsp;<input type="submit" value="download"/>`;

    const routeToSecure = `<input onclick="document.location='https://${serviceIP}:${httpsPort}'" type="button" value="next"/>`;

    res.send(`
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="viewport" content="width=device-width,user-scalable=no" />
      </head>
      <body>
        <br /><br />
        <ol>
          <li>
            Certificate Authority
            <br />
            <form
              action="http${req.secure ? "s" : ""}://${serviceIP}:${httpPort}${config.route.getCa}"
              method="post"
            >
              <input type="submit" value="download" />
            </form>
            <br />
          </li>
    
          <li>
            Client Certificate
            <br />
            <form
              action="https://${serviceIP}:${httpsPort}${config.route.getClient}"
              method="post"
            >
              ${req.secure ? secureDownload : routeToSecure}
            </form>
            <br />
          </li>
    
          <li>
            <div>App configuration</div>
    
            <p>
              In the <b>External Data Source</b> section in the Nmemonica App
              Settings.
            </p>
            <ol>
              <li>
                Enter <b>${serviceIP}</b>:<b>${config.service.port}</b>
                <br />
                Points app to use local service
              </li>
              <li>Browser will prompt a client certificate selection</li>
              <li>Select your certificate and click ALLOW or OK</li>
            </ol>
          </li>
        </ol>
      </body>
    </html>
    `);
  });

  app.post(config.route.getCa, getCA);
  app.get(config.route.getCa, getCA);

  app.post(
    config.route.getClient,
    express.urlencoded({ extended: true }),
    getClient
  );
  app.get(config.route.getClient, (req, res) => {
    res.send(`
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="viewport" content="width=device-width,user-scalable=no" />
      </head>
      <body>
        <br /><br />
        <form
          action="https://${serviceIP}:${httpsPort}${config.route.getClient}"
          method="post"
        >
          client id: <input type="text" name="uid" size="5" />&nbsp;<input
            type="submit"
            value="download"
          />
        </form>
      </body>
    </html>
    `);
  });

  app.use(custom404);
  app.use(customError);

  void ca
    .get()
    .then(async ({ intermediate, server, dhparam }) => {
      await ca.createServer();

      return { intermediate, server, dhparam };
    })
    .catch(() => {
      return ca.createNeeded();
    })
    .then(({ intermediate, server, dhparam }) => {
      const httpSever = http.createServer(app);
      httpSever.listen(httpPort, localhost, 0, () => {
        console.log("\nCA http service");
        console.log(
          yellow("http://") + localhost + yellow(":" + httpPort + "/getCA")
        );
      });

      if (!("chain" in intermediate) || !intermediate.chain) {
        throw new Error("Intermediate cert missing chain");
      }
      const credentials = {
        key: server.key,
        cert: server.crt,
        dhparam,
      };

      const httpsServer = https.createServer(
        {
          ...credentials,
          ca: [intermediate.chain],
        },
        app
      );
      httpsServer.listen(httpsPort, serviceIP, 0, () => {
        console.log("\nClient Cert https service");
        console.log(
          magenta("https://") +
            serviceIP +
            magenta(":" + httpsPort + "/getClient")
        );
        console.log("\n");
      });
    });
}
