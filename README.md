# @nmemonica/utils
>Certificate Exchange Service (for development) for [@nmemonica/snservice](https://github.com/bryanjimenez/snservice)

[![npm version](https://img.shields.io/npm/v/@nmemonica/utils.svg)](https://www.npmjs.org/package/@nmemonica/utils)
[![npm pkg](https://github.com/bryanjimenez/nmemonica-utils/actions/workflows/npm-publish.yml/badge.svg)](https://github.com/bryanjimenez/nmemonica-utils/actions/workflows/npm-publish.yml)

Generates required client and server certificates for mTLS authentication  
Serves a download page for the generated client certificates (CA and pkcs12).

Includes other utilities like console color and network information



## Service Install and Start
### *Prerequisites*
- A server (device running this service) with
  - [Git](https://git-scm.com/)
  - [Node](https://nodejs.org)
  - [OpenSSL](https://openssl.org)
- A client (device with browser viewing Nmemonica)
  - Internet access
  - Network access to the server

This package will be installed as a dependency, but can be installed independently:
```bash
# clone repo
git clone https://github.com/bryanjimenez/nmemonica-utils.git
cd nmemonica-utils
# install dependencies
npm install
# build
npm run build
# run service
node ./dist/esm
```

or as a dependency the certificate exchange service can be ran:
```bash
# after being installed as a dependency
node ./node_modules/@nmemonica/utils
```

## Generating Certificates
During the first time run the service will create server certificates and will prompt user for client certificate password and provide `client_id`.

```bash
# Certificates' default location: ./app/https/selfSignedCA:
$ ls ./app/https/selfSignedCA
client.66866.crt.pem        intermediate.crt.pem      root.openssl.cnf
client.66866.csr            intermediate.csr          server.crt.pem
client.66866.key.pem        intermediate.key.pem      server.csr
client.66866.pfx            intermediate.openssl.cnf  server.key.pem
client.openssl.66866.cnf    root.crt.pem              server.openssl.cnf
dh-param.pem                root.csr
intermediate.chain.crt.pem  root.key.pem
```

## 1. Install Self Signed CA
`service_ip`: 127.0.0.1,  localhost or your ip.  
`http_port`: default is 3000 unless set in **snservice.conf.json** (`conf.cert.http`)  
`client_id`: provided by the utils cli on initial run (or after running with `--service`)

### Chrome Desktop

1. **Navigate** to chrome:settings/certificates  
1. **Authorities** tab  
1. **Import** (./app/https/selfSignedCA/intermediate.crt.pem)

### Mobile

1. **Navigate** to http://`service_ip`:`http_port`/  
1. Click **Download** button under Certificate Authority
1. **Install** intermediate.crt.pem from browser.
1. Name your CA (optional).

## 2. Install Client Certificate

### Chrome Desktop
1. **Your certificates** tab
1. Click **Import** (./app/https/selfSignedCA/client.`client_id`.crt.pem)

### Mobile
1. After installing CA on the same page.
1. **Input** `client_id` in client id field.
1. Press **Download** or hit enter.
1. **Open** and extract certificate using *password* provided for `client_id`.
1. Name your client certificate (optional).

## Configuration file

Configurations will be set from **snservice.conf.json** which should be located at the project's root directory.

```js
// snservice.conf.json
{
  cert: {
    port: {
      http:   /*number;*/ 3000,   // default
      https:  /*number;*/ 3443,   // default
    };
  };

  directory: {
    ca:       /*string;*/ "app/https/selfSignedCA",
  };
}
```