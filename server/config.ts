import * as yaml from "js-yaml";
import * as fs from "fs";
import * as dotenv from "dotenv";

/**
 * This class represents the basic configuration required
 */
export class Config {
  constructor(
    public node_env: string,
    public host: string,
    public port: number,
    public database_host: string,
    public database_port: number,
    public database_username: string,
    public database_password: string,
    public database_dbname: string,
    public database_synchronize: boolean
  ) {}

  public static from_yaml_file(path: string): Config {
    const contents = fs.readFileSync(path, "utf8");
    return yaml.load(contents) as Config;
  }

  public static from_env(): Config {
    if (
      !process.env.DATABASE_HOST ||
      !process.env.DATABASE_USERNAME ||
      !process.env.DATABASE_PASSWORD ||
      !process.env.DATABASE_DBNAME
    ) {
      throw new Error("Missing required environment variables");
    }
    const environment = process.env.NODE_ENV || "development";
    dotenv.config({ path: [`.env.${environment}`] });
    return new Config(
      environment,
      process.env.HOST || "0.0.0.0",
      parseInt(process.env.PORT || "8282"),
      process.env.DATABASE_HOST,
      parseInt(process.env.DATABASE_PORT || "5432"),
      process.env.DATABASE_USERNAME,
      process.env.DATABASE_PASSWORD,
      process.env.DATABASE_DBNAME,
      process.env.DATABASE_SYNCHRONIZE === "true"
    );
  }
}

import * as crypto from "crypto";
// export function loadPrivateKey(filepath: string): Ed25519PrivateKey {
//   const keyStr = fs.readFileSync(filepath, "utf8");
//   return new Ed25519PrivateKey(keyStr);
// }

export const generateP256KeyPair = () => {
  const { privateKey, publicKey } = crypto.generateKeyPairSync("ec", {
    namedCurve: "P-256", // This is secp256r1
    publicKeyEncoding: {
      type: "spki",
      format: "pem",
    },
    privateKeyEncoding: {
      type: "pkcs8",
      format: "pem",
    },
  });
  console.log("Private Key:", privateKey);
  console.log("Public Key:", publicKey);

  // If you need the public key in raw format (65 bytes: 0x04 | X | Y)
  const publicKeyObject = crypto.createPublicKey(publicKey);
  const rawPublicKey = publicKeyObject.export({ type: "spki", format: "der" });
  console.log("Raw Public Key (Base64):", rawPublicKey.toString("base64"));
  console.log("Raw Public Key (Hex):", rawPublicKey.toString("hex"));

  return { privateKey, publicKey };
};

function compressPublicKey(publicKeyRaw: Buffer): Buffer {
  const prefix = publicKeyRaw[64] % 2 === 0 ? 0x02 : 0x03;
  return Buffer.concat([Buffer.from([prefix]), publicKeyRaw.slice(1, 33)]);
}

export function convertPemToNumberArray(pemKey: string): number[] {
  // Remove PEM headers and newlines, then decode from base64
  const pemContents = pemKey.replace(/-----BEGIN PRIVATE KEY-----/, '')
                            .replace(/-----END PRIVATE KEY-----/, '')
                            .replace(/\n/g, '');
  const keyBuffer = Buffer.from(pemContents, 'base64');

  // Extract the actual key material from the ASN.1 structure
  // For secp256r1, the private key is typically at offset 7 for 32 bytes
  const privateKeyBuffer = keyBuffer.slice(7, 39);

  // Convert to number array
  return Array.from(privateKeyBuffer);
}

function derivePublicKey(privateKeyArray: number[]): { x: number[], y: number[] } {
  // Convert the number array back to a Buffer
  const privateKeyBuffer = Buffer.from(privateKeyArray);

  // Create a KeyObject from the private key
  const privateKey = crypto.createPrivateKey({
    key: privateKeyBuffer,
    format: 'der',
    type: 'pkcs8',
  });

  // Derive the public key
  const publicKey = crypto.createPublicKey(privateKey);

  // Export the public key in raw format
  const publicKeyRaw = publicKey.export({ format: 'der', type: 'spki' });
  compressPublicKey(publicKeyRaw);

  // Extract x and y coordinates (skip the first byte which is the format byte)
  const x = Array.from(publicKeyRaw.slice(1, 33));
  const y = Array.from(publicKeyRaw.slice(33, 65));

  return { x, y };
}

export function generateSecp256r1KeyPair(): { privateKey: string, publicKey: string } {
  // Generate the key pair
  const { privateKey, publicKey } = crypto.generateKeyPairSync('ec', {
    namedCurve: 'P-256', // This is secp256r1
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem'
    }
  });

  // // Convert the private key to hex string
  // const privateKeyHex = privateKey.subarray(7, 39).toString('hex');
  // const publicKeyHex = compressPublicKey(publicKey).toString('hex');
  // console.log('Private Key:', privateKeyHex);
  // console.log('Public Key:', publicKeyHex);

  // // // Extract the raw public key from the DER-encoded public key
  // // const publicKeyObject = crypto.createPublicKey({ key: publicKey, format: 'der', type: 'spki' });
  // // const publicKeyRaw = publicKeyObject.export({ format: 'der', type: 'spki' });
  
  // // // The raw public key includes a prefix byte (0x04 for uncompressed) followed by the x and y coordinates
  // // // We'll include this prefix in our hex string
  // // const publicKeyHex = publicKeyRaw.toString('hex');

  return { privateKey, publicKey };
}

