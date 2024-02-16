// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require("fs");

const cli = Object.freeze({
  // commands
  CERT_ANY: {
    cmd: ["--certificates", "-c"],
    desc: "Create all needed certificates",
  },
  CERT_SERVICE: {
    cmd: ["--service", "-s"],
    desc: "Only create server certificate",
  },
  CERT_USER: { cmd: ["--user", "-u"], desc: "Only create client certificates" },
  LAN_HOST: { cmd: ["--host", "-h"], desc: "Display host ip information" },
});

function showUsage(name: string, version: string) {
  console.log(`\n${name} ${version}`);
  const tab = 10;

  console.log(`\nUsage:`);
  const node = "node ./node_modules";
  console.log(`${" ".repeat(tab - 5)}${node}/${name} [command] [option]`);

  console.log(`\nExample:`);
  const serviceEx = `${name}`;
  console.log(
    `${" ".repeat(tab - 5)}${node}/${serviceEx}${" ".repeat(
      30 - serviceEx.length
    )} start service`
  );

  const clientEx = `${name} -u`;
  console.log(
    `${" ".repeat(tab - 5)}${node}/${clientEx}${" ".repeat(
      30 - clientEx.length
    )} create user certs`
  );

  const hostEx = `${name} -h`;
  console.log(
    `${" ".repeat(tab - 5)}${node}/${hostEx}${" ".repeat(
      30 - hostEx.length
    )} display hostname and ip`
  );

  console.log("\nCommands:");
  void import("./utils/console.js")
    .then(({ bold }) => {
      Object.values(cli).forEach((commands) => {
        const tab = 10;

        if ("cmd" in commands) {
          const cmd = commands.cmd.join("\n" + " ".repeat(tab - 5));
          console.log(
            `${" ".repeat(tab - 5)}${bold(cmd)}\n${" ".repeat(tab)}${
              commands.desc
            }`
          );
        }
      });
    })
    .then(() => {
      process.exit();
    });
}

function getPkgRoot() {
  let pkgRoot;
  switch (true) {
    case process.argv[1].endsWith("/dist/cjs/"):
      pkgRoot = process.argv[1].replace("/dist/cjs/", "");
      break;
    case process.argv[1].endsWith("/dist/cjs"):
      pkgRoot = process.argv[1].replace("/dist/cjs", "");
      break;
    case process.argv[1].endsWith("/dist/cjs/index.js"):
      pkgRoot = process.argv[1].replace("/dist/cjs/index.js", "");
      break;
    case process.argv[1].endsWith("@nmemonica/utils"):
      pkgRoot = process.argv[1];
      break;
    default:
      throw new Error("Unexpected cwd");
  }

  return pkgRoot;
}

void import("./src/app.js").then(({ default: startService }) => {
  if (
    (require.main?.loaded === true &&
      require.main.filename === `${process.argv[1]}/index.cjs`) ||
    (require.main?.loaded === true &&
      require.main.filename === `${process.argv[1]}index.cjs`) ||
    (require.main?.loaded === true &&
      require.main.filename === `${process.argv[1]}/dist/cjs/index.cjs`) ||
    (require.main?.loaded === true &&
      require.main.filename === `${process.argv[1]}`)
  ) {
    // running from cli

    switch (process.argv[2]) {
      case cli.CERT_ANY.cmd[0]:
      case cli.CERT_ANY.cmd[1]:
        void import("./utils/signed-ca.js").then(({ ca }) => {
          // running from cli
          void ca
            .get()
            .then(() => {
              console.log("CA already exists");
            })
            .catch(() => {
              return ca.createNeeded();
            })
            .then(() => {
              process.exit();
            });
        });
        break;

      case cli.CERT_SERVICE.cmd[0]:
      case cli.CERT_SERVICE.cmd[1]:
        void import("./utils/signed-ca.js").then(({ ca }) =>
          ca.createServer().then(() => {
            process.exit();
          })
        );
        break;

      case cli.CERT_USER.cmd[0]:
      case cli.CERT_USER.cmd[1]:
        void import("./utils/signed-ca.js").then(({ ca }) =>
          ca.createClient().then(() => {
            process.exit();
          })
        );
        break;

      case cli.LAN_HOST.cmd[0]:
      case cli.LAN_HOST.cmd[1]:
        void import("./utils/host.js").then(({ lan }) => {
          console.log(JSON.stringify(lan));
        });
        break;

      case undefined:
        startService();
        break;

      default:
        {
          console.log(`\nUnknown flag '${process.argv[2]}'`);

          const { name, version } = JSON.parse(
            fs.readFileSync(getPkgRoot() + "/package.json", {
              encoding: "utf-8",
            }) as string
          ) as { name: string; version: string };

          showUsage(name, version);
        }
        break;
    }
  }
});
