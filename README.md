# @nmemonica/utils
>Certificate Exchange Service (for development) for [@nmemonica/snservice](https://github.com/bryanjimenez/snservice)

[![npm version](https://img.shields.io/npm/v/@nmemonica/utils.svg)](https://www.npmjs.org/package/@nmemonica/utils)
[![npm pkg](https://github.com/bryanjimenez/nmemonica-utils/actions/workflows/npm-publish.yml/badge.svg)](https://github.com/bryanjimenez/nmemonica-utils/actions/workflows/npm-publish.yml)

Creates required client and server certificates for mTLS  
Serves a download page for the client certificates (CA and pkcs12).

Includes other utilities like console color and network information

## Prerequisites

- A server (Device running this service) with
  - [Git](https://git-scm.com/)
  - [Node](https://nodejs.org)
  - [OpenSSL](https://openssl.org)
- A client (Device with browser viewing Nmemonica)
  - Internet access
  - Network access to the server

## Service Install and start
This will be installed as a dependency, but can be ran standalone:

```bash
# clone repo
git clone https://github.com/bryanjimenez/nmemonica-utils.git
cd ceservice
# install dependencies
npm install
# build service
npm run build
# run service
node ./dist/esm
```
As a dependency the certificate exchange service can be ran:
```
node ./node_modules/@nmemonica/utils
```

During the first time run the service will create server certificates and will ask user for client certificate password and provide `client_id`.

```bash
# Certificates' default location: https/selfSignedCA:
$ ls ./data/selfSignedCA
client.66866.crt.pem        intermediate.crt.pem      root.openssl.cnf
client.6de71.csr            intermediate.csr          server.crt.pem
client.6de71.key.pem        intermediate.key.pem      server.csr
client.6de71.pfx            intermediate.openssl.cnf  server.key.pem
client.openssl.6de71.cnf    root.crt.pem              server.openssl.cnf
dh-param.pem                root.csr
intermediate.chain.crt.pem  root.key.pem
```

## Install Self Signed CA

### Chrome Desktop

1. **Navigate** to chrome:settings/certificates  
1. **Authorities** tab  
1. **Import** (data/selfSignedCA/intermediate.crt.pem)

### Chrome Mobile

1. **Navigate** to http://`service_ip`:`http_port`/  
   (Downloads intermediate.crt.pem)  
1. **Install** intermediate.crt.pem from browser
1. Name your CA (optional)

## Install Client Certificate

1. **Navigate** to to http://`service_ip`:`http_port`/  
1. **Input** `client_id` in client id field
1. press **Download** or hit enter
1. **Open** and extract certificate using your password
1. Name your client certificate (optional)

