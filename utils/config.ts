import fs from "node:fs";
import path from "node:path";
import { CrtParameters } from "./signed-ca.js";

const utilDefault = <const>{ port: { http: 3000, https: 3443 } };

interface ServiceConfiguration {
  port: {
    ui: number;
    http: number;
    https: number;
    cert: {
      http: number;
      https: number;
      defaultHttp: typeof utilDefault.port.http;
      defaultHttps: typeof utilDefault.port.https;
    };
  };

  ca: {
    root: CrtParameters;
    intermediate: CrtParameters;
    server: CrtParameters;
    client: CrtParameters & { bundle: string };
    dhParam: { bits: number; name: string };
  };

  directory: {
    root: string;
    ca: string;
  };

  route: {
    getCa: string;
    getClient: string;
  };
}

const projectRoot = path.resolve();

function getConfig() {
  const configPath = "/snservice.conf.json";
  if (!fs.existsSync(projectRoot + configPath)) {
    console.log(projectRoot);
    throw new Error("Missing config file " + projectRoot);
  }
  const config = JSON.parse(
    fs.readFileSync(projectRoot + configPath, { encoding: "utf-8" })
  ) as ServiceConfiguration;

  if (config.port.https === undefined) {
    throw new Error("Missing App service https port in config file");
  }

  config.port.cert = {
    ...config.port.cert ?? {http: utilDefault.port.http, https: utilDefault.port.https},
  };

  if (config.directory.ca === undefined) {
    throw new Error("Missing CA directory path in config file");
  }

  const root = {
    key: "root.key.pem",
    crt: "root.crt.pem",
    csr: "root.csr",
    cnf: "root.openssl.cnf",
  };
  const intermediate = {
    key: "intermediate.key.pem",
    crt: "intermediate.crt.pem",
    csr: "intermediate.csr",
    cnf: "intermediate.openssl.cnf",
    chain: "intermediate.chain.crt.pem",
  };
  const server = {
    key: "server.key.pem",
    crt: "server.crt.pem",
    csr: "server.csr",
    cnf: "server.openssl.cnf",
  };
  const client = {
    key: "client.key.pem",
    crt: "client.crt.pem",
    csr: "client.csr",
    cnf: "client.openssl.cnf",
    bundle: "client.bundle.pfx",
  };

  const dhParam = { bits: 2048, name: "dh-param.pem" };

  config.ca = { root, intermediate, server, client, dhParam };

  {
    // service routes/paths
    const getCa = "/getCA";
    const getClient = "/getClient";

    config.route = {
      getCa,
      getClient,
    };
  }

  {
    // normalize paths
    const projectRoot = path.resolve();
    const ca = path.normalize(`${projectRoot}/${config.directory.ca}`);

    config.directory = { root: projectRoot, ca };
  }

  return config;
}

export const config = getConfig();
