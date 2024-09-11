// import * as pino from "pino";
import pino from "pino";
export const loggingConfig: { [key: string]: pino.LoggerOptions | boolean } = {
  development: {
    transport: {
      level: "debug",
      target: "pino-pretty",
      options: {
        colorize: true,
        // timestamp: pino.stdTimeFunctions.isoTime, // - not working
        translateTime: 'yyyy-mm-dd\'T\'HH:MM:ss.l\'Z\'',
        ignore: "pid,hostname",
      },
    },
  },
  production: true,
  test: false,
};
