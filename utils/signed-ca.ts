import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { lan } from "./host.js";
import { config } from "./config.js";
import { cyan } from "./consoleColor.js";
import { promptUser } from "./prompt.js";

const hasRequiredCertificates = () => {
  if (
    fs.existsSync(path.normalize(`${cwd}/${config.ca.intermediate.key}`)) &&
    fs.existsSync(path.normalize(`${cwd}/${config.ca.intermediate.crt}`)) &&
    fs.existsSync(path.normalize(`${cwd}/${config.ca.intermediate.chain}`)) &&
    fs.existsSync(path.normalize(`${cwd}/${config.ca.server.key}`)) &&
    fs.existsSync(path.normalize(`${cwd}/${config.ca.server.crt}`))
  ) {
    return true;
  }

  return false;
};

const cwd = config.directory.ca;

const host = lan.hostname;
const ip = lan.address;
const AppName = "Nmemonica";

// #emailAddress=nobody@email.com
const commonName = `${AppName} Root Certificate Authority`;
const OU = "nmemonica";
const O = `${AppName} DEV`;
// const L="City"
// const ST="State"
const country = "US";

const fifteen_years = "5480";
const ten_years = "3650";
const one_year = "370";
const ecName = "secp384r1";

export interface CrtParameters {
  /** key */
  key: string;
  /** certificate */
  crt: string;
  /** extensions file */
  csr: string;
  /** certificate sign request */
  cnf: string;
  /** certificate+key bundle */
  bundle?: string;
  /** certificate chain */
  chain?: string;
}

/**
 * This script creates a self signed key cert pairs (**conditionally**) for:  
 * Root CA  
 * Intermediate CA  
 * Server  
 * Client  
 * DHParam  
 */
function createNeeded() {
  console.log("IP: " + ip);
  console.log("Hostname: " + host);

  // create directory if not there
  if (!fs.existsSync(cwd)) {
    fs.mkdirSync(cwd, { recursive: true });
  }

  if (!fs.existsSync(`${cwd}/${config.ca.dhParam.name}`)) {
    buildDHParam();
  }

  if (
    !fs.existsSync(path.normalize(`${cwd}/${config.ca.root.key}`)) ||
    !fs.existsSync(path.normalize(`${cwd}/${config.ca.root.crt}`))
  ) {
    return createRoot();
  } else if (
    !fs.existsSync(path.normalize(`${cwd}/${config.ca.intermediate.key}`)) ||
    !fs.existsSync(path.normalize(`${cwd}/${config.ca.intermediate.crt}`))
  ) {
    return createIntermediate();
  }

  else {
    return createServer().then(() => get());
  }
}

/**
 * This script creates a self signed key cert pairs for:  
 * Root CA  
 * Intermediate CA  
 * Server  
 * Client  
 */
function createRoot() {
  // create directory if not there
  if (!fs.existsSync(cwd)) {
    fs.mkdirSync(cwd, { recursive: true });
  }

  let delFileP: Promise<unknown>[] = [];

  // Delete old files
  Object.values(config.ca.root).forEach((file) => {
    delFileP = [
      ...delFileP,
      new Promise((resolve) => {
        fs.rm(`${cwd}/${file}`, resolve);
      }),
    ];
  });

  return Promise.all(delFileP).then(async () => {
    buildRootCertificate();
    buildIntermediateCertificate();
    buildServerCertificate();
    await buildClientCertificate();

    return get();
  });
}

/**
 * This script creates a self signed key cert pairs for:  
 * Intermediate CA  
 * Server  
 * Client  
 */
function createIntermediate() {
  // create directory if not there
  if (!fs.existsSync(cwd)) {
    fs.mkdirSync(cwd, { recursive: true });
  }

  let delFileP: Promise<unknown>[] = [];

  // Delete old files
  Object.values(config.ca.intermediate).forEach((file) => {
    delFileP = [
      ...delFileP,
      new Promise((resolve) => {
        fs.rm(`${cwd}/${file}`, resolve);
      }),
    ];
  });

  return Promise.all(delFileP).then(async () => {
    buildIntermediateCertificate();
    buildServerCertificate();
    await buildClientCertificate();

    return get();
  });
}

/**
 * This script creates a self signed key cert pairs for:  
 * Server
 */
function createServer() {
  // create directory if not there
  if (!fs.existsSync(cwd)) {
    fs.mkdirSync(cwd, { recursive: true });
  }

  let delFileP: Promise<unknown>[] = [];

  // Delete old files
  Object.values(config.ca.server).forEach((file) => {
    delFileP = [
      ...delFileP,
      new Promise((resolve) => {
        fs.rm(`${cwd}/${file}`, resolve);
      }),
    ];
  });

  return Promise.all(delFileP).then(() => {
    buildServerCertificate();
  });
}

/**
 * This script creates a self signed key cert pairs for:  
 * Client
 */
function createClient() {
  // create directory if not there
  if (!fs.existsSync(cwd)) {
    fs.mkdirSync(cwd, { recursive: true });
  }

  return buildClientCertificate();
}

function get() {
  return new Promise<{
    intermediate: { key: string; crt: string; chain: string };
    server: { key: string; crt: string };
    dhparam: string;
  }>((resolve, reject) => {
    if (hasRequiredCertificates()) {
      const intermediateKey = fs.readFileSync(
        path.normalize(
        `${cwd}/${config.ca.intermediate.key}`),
        { encoding: "utf-8" }
      );
      const intermediateCrt = fs.readFileSync(
        path.normalize(
        `${cwd}/${config.ca.intermediate.crt}`),
        { encoding: "utf-8" }
      );
      const intermediateChain = fs.readFileSync(
        path.normalize(
        `${cwd}/${config.ca.intermediate.chain}`),
        { encoding: "utf-8" }
      );

      const serverKey = fs.readFileSync(path.normalize(`${cwd}/${config.ca.server.key}`), {
        encoding: "utf-8",
      });
      const serverCrt = fs.readFileSync(path.normalize(`${cwd}/${config.ca.server.crt}`), {
        encoding: "utf-8",
      });

      const intermediate = {
        key: intermediateKey,
        crt: intermediateCrt,
        chain: intermediateChain,
      };
      const server = { key: serverKey, crt: serverCrt };

      if (!fs.existsSync(`${cwd}/${config.ca.dhParam.name}`)) {
        buildDHParam();
      }

      const dhparam = fs.readFileSync(`${cwd}/${config.ca.dhParam.name}`, {
        encoding: "utf-8",
      });

      resolve({ intermediate, server, dhparam });
    }
    reject(new Error("Self signed CA has not been created"));
  });
}

/**
 * Root Certificate Authority
 */
function buildRootCertificate() {
  // generate root.key.pem
  spawnSync(
    "openssl",
    ["ecparam", "-out", config.ca.root.key, "-name", ecName, "-genkey"],
    { cwd }
  );

  // generate root.csr
  spawnSync(
    "openssl",
    [
      "req",
      "-new",
      "-key",
      config.ca.root.key,
      "-days",
      fifteen_years,
      "-extensions",
      "v3_ca",
      "-batch",
      "-out",
      config.ca.root.csr,
      "-utf8",
      "-subj",
      `/C=${country}/O=${O}/CN=${commonName}`,
    ],
    { cwd }
  );

  // create Root extensions file root.openssl.cnf
  const rootCNFString = `basicConstraints = critical, CA:TRUE\n
  keyUsage = keyCertSign, cRLSign\n
  subjectKeyIdentifier = hash`;
  // nameConstraints = permitted;IP:${ip}/255.255.255.0,permitted;DNS:${host}`;

  fs.writeFileSync(path.normalize(`${cwd}/${config.ca.root.cnf}`), rootCNFString, {
    encoding: "utf-8",
  });

  // generate ROOT signed CSR (root.crt.pem) w/ root.openssl.cnf
  spawnSync(
    "openssl",
    [
      "x509",
      "-req",
      "-sha384",
      "-days",
      ten_years,
      "-in",
      config.ca.root.csr,
      "-signkey",
      config.ca.root.key,
      "-extfile",
      config.ca.root.cnf,
      "-out",
      config.ca.root.crt,
    ],
    { cwd }
  );
}

/**
 * Intermediate Certificate
 */
function buildIntermediateCertificate() {
  const { key, crt, csr, cnf, chain } = config.ca.intermediate;

  // generate intermediate.key.pem
  spawnSync("openssl", ["ecparam", "-out", key, "-name", ecName, "-genkey"], {
    cwd,
  });

  // generate intermediate Certificate Signing Request (csr)
  spawnSync(
    "openssl",
    [
      "req",
      "-new",
      "-key",
      key,
      "-days",
      ten_years,
      "-batch",
      "-out",
      csr,
      "-utf8",
      "-subj",
      `/O=${O}/CN=${AppName} Intermediate CA`,
    ],
    { cwd }
  );

  // create intermediate extensions file intermediate.openssl.cnf
  const myCNFString = `basicConstraints = critical, CA:TRUE, pathlen:0\n
  keyUsage = critical, digitalSignature, cRLSign, keyCertSign`;

  fs.writeFileSync(path.normalize(`${cwd}/${cnf}`), myCNFString, { encoding: "utf-8" });

  // generate intermediate signed CSR (ee.pem) w/ intermediate.openssl.cnf
  spawnSync(
    "openssl",
    [
      "x509",
      "-req",
      "-sha384",
      "-days",
      ten_years,
      "-in",
      csr,
      "-CAkey",
      config.ca.root.key,
      "-CA",
      config.ca.root.crt,
      "-extfile",
      cnf,
      "-out",
      crt,
    ],
    { cwd }
  );

  // create certificate chain (intermediate+root)
  if (chain) {
    const intermediateCrtStr = fs.readFileSync(path.normalize(`${cwd}/${crt}`), {
      encoding: "utf-8",
    });
    const rootCrtStr = fs.readFileSync(path.normalize(`${cwd}/${config.ca.root.crt}`), {
      encoding: "utf-8",
    });

    fs.writeFileSync(path.normalize(`${cwd}/${chain}`), intermediateCrtStr + rootCrtStr, {
      encoding: "utf-8",
    });
  }
}

/**
 * Server Certificate
 */
function buildServerCertificate() {
  const { key, crt, csr, cnf } = config.ca.server;
  // generate server.key.pem
  spawnSync("openssl", ["ecparam", "-out", key, "-name", ecName, "-genkey"], {
    cwd,
  });

  // generate server Certificate Signing Request (csr)
  spawnSync(
    "openssl",
    [
      "req",
      "-new",
      "-key",
      key,
      "-days",
      one_year,
      "-batch",
      "-out",
      csr,
      "-utf8",
      "-subj",
      `/O=${O}/CN=${AppName} dev Server`,
    ],
    { cwd }
  );

  // create server extensions file server.openssl.cnf
  const myCNFString = `basicConstraints = CA:FALSE\n
  subjectAltName = IP:${ip}, DNS:${host}\n
  nsCertType = server\n
  keyUsage = critical, nonRepudiation, digitalSignature, keyEncipherment\n
  extendedKeyUsage = serverAuth`;
  
  fs.writeFileSync(path.normalize(`${cwd}/${cnf}`), myCNFString, { encoding: "utf-8" });

  // generate server signed CSR (server.pem) w/ server.openssl.cnf
  spawnSync(
    "openssl",
    [
      "x509",
      "-req",
      "-sha384",
      "-days",
      one_year,
      "-in",
      csr,
      "-CAkey",
      config.ca.intermediate.key,
      "-CA",
      config.ca.intermediate.crt,
      "-extfile",
      cnf,
      "-out",
      crt,
    ],
    { cwd }
  );
}

/**
 * Generage DH param for longer bit key
 */
function buildDHParam() {
  // https://security.stackexchange.com/questions/94390/whats-the-purpose-of-dh-parameters

  spawnSync(
    "openssl",
    ["dhparam", "-out", config.ca.dhParam.name, String(config.ca.dhParam.bits)],
    { cwd }
  );
}

/**
 * Client Certificate
 */
async function buildClientCertificate() {
  console.log("\nClient certificate");
  const pw = await promptUser(cyan("password:"));
  const pwCheck = await promptUser(cyan("again:"));

  if (pw !== pwCheck) {
    throw new Error("Client certificate password didn't match");
  }

  const id = crypto.randomBytes(20).toString("hex").slice(-5);
  const key = config.ca.client.key.replace(".key.", `.${id}.key.`);
  const crt = config.ca.client.crt.replace(".crt.", `.${id}.crt.`);
  const csr = config.ca.client.csr.replace(".csr", `.${id}.csr`);
  const cnf = config.ca.client.cnf.replace(".cnf", `.${id}.cnf`);
  const pfx = config.ca.client.bundle.replace(".bundle.", `.${id}.`);

  // commonName can be anything except same as Root or Intermediate names
  const commonName = `${AppName} Client`;

  // generate clientkey.pem
  spawnSync("openssl", ["ecparam", "-out", key, "-name", ecName, "-genkey"], {
    cwd,
  });

  // generate client Certificate Signing Request (csr)
  spawnSync(
    "openssl",
    [
      "req",
      "-new",
      "-key",
      key,
      "-days",
      one_year,
      "-batch",
      "-out",
      csr,
      "-utf8",
      "-subj",
      `/O=${O}/CN=${commonName}`,
    ],
    { cwd }
  );

  // create client extensions file client.openssl.cnf
  const myCNFString = `basicConstraints = CA:FALSE\n
  nsCertType = client\n
  keyUsage = critical, nonRepudiation, digitalSignature, keyEncipherment\n
  extendedKeyUsage = clientAuth`;
  // subjectAltName = IP:${ip}, DNS:${host}\n
  fs.writeFileSync(path.normalize(`${cwd}/${cnf}`), myCNFString, { encoding: "utf-8" });

  // generate client signed CSR (client.crt.pem) w/ client.openssl.cnf
  spawnSync(
    "openssl",
    [
      "x509",
      "-req",
      "-sha384",
      "-days",
      one_year,
      "-in",
      csr,
      "-CAkey",
      config.ca.intermediate.key,
      "-CA",
      config.ca.intermediate.crt,
      "-extfile",
      cnf,
      "-out",
      crt,
    ],
    { cwd }
  );

  // working ...
  // spawnSync(
  //   "openssl",
  //   ["pkcs12", "-export", "-out", bundle, "-inkey", key, "-in", crt,  "-certfile", intermediate.crt, "-certfile", config.ca.ro ot.crt, "-password", "pass:0"],
  //   {cwd}
  // )

  console.log("Your client certificate id is: " + cyan(id));

  spawnSync(
    "openssl",
    [
      "pkcs12",
      "-export",
      "-out",
      pfx,
      "-inkey",
      key,
      "-in",
      crt,
      "-clcerts",
      "-password",
      `pass:${pw}`,
    ],
    { cwd }
  );
}

/**
 * Test id is 5 character alphanumeric string
 * @param id
 */
export function isBundleId(id: string) {
  const bundleId = new RegExp(/^[a-z0-9A-Z]{5}$/);

  return bundleId.test(id);
}

export const ca = {
  /** If it has been previously created */
  exists: hasRequiredCertificates,
  createNeeded,
  createRoot,
  createIntermediate,
  createServer,
  createClient,
  get,
};
