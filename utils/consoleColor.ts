export const COLORS = Object.freeze({
  black: "\x1b[30m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  reset: "\x1b[0m",
});

export const STYLE = Object.freeze({
  bold: "\x1b[1m",
});

// https://gist.github.com/abritinthebay/d80eb99b2726c83feb0d97eab95206c4
export const black = (msg: string) => COLORS.black + msg + COLORS.reset;
export const red = (msg: string) => COLORS.red + msg + COLORS.reset;
export const green = (msg: string) => COLORS.green + msg + COLORS.reset;
export const yellow = (msg: string) => COLORS.yellow + msg + COLORS.reset;
export const blue = (msg: string) => COLORS.blue + msg + COLORS.reset;
export const magenta = (msg: string) => COLORS.magenta + msg + COLORS.reset;
export const cyan = (msg: string) => COLORS.cyan + msg + COLORS.reset;
export const white = (msg: string) => COLORS.white + msg + COLORS.reset;

export const bold = (msg: string) => STYLE.bold + msg + COLORS.reset;
