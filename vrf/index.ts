import * as p256 from "./ecvrf-p256-sha256-tai";
import BN from "bn.js";
import * as crypto from "crypto";

// rfc9381
interface IVRF {
  hash(alpha: Uint8Array): { beta: Uint8Array; pi: Uint8Array }; // {beta, pi} = VRF_hash(SK, alpha)
  prove(alpha: Uint8Array): Uint8Array; // pi = VRF_prove(SK, alpha)
  proofToHash(pi: Uint8Array): Uint8Array; // beta = VRF_proof_to_hash(pi)
  verify(alpha: Uint8Array, pi: Uint8Array, beta: Uint8Array): boolean; // valid = VRF_verify(PK, alpha, pi)
}

export class VRF implements IVRF {
  private privateKey: number[];
  private publicKey: number[];
  private secretKey: BN;

  constructor(secretKey: string) {
    const privateKeyBuf = this.extractRawPrivateKey(secretKey);
    // const privateKeyBuf = Buffer.from(secretKey, "hex");
    this.privateKey = Array.from(privateKeyBuf);
    this.secretKey = new BN(this.privateKey);
    const privateKey = crypto.createPrivateKey({
      key: privateKeyBuf,
      format: "der",
      type: "pkcs8",
    });
    const publicKey = crypto.createPublicKey(privateKey);
    const publicKeyRaw = publicKey.export({ format: "der", type: "spki" });
    this.publicKey = Array.from(this.compressPublicKey(publicKeyRaw));
    console.log("Public key", this.publicKey.toString());
    p256._validate_key(this.publicKey);
  }

  private compressPublicKey(publicKeyRaw: Buffer): Buffer {
    const prefix = publicKeyRaw[64] % 2 === 0 ? 0x02 : 0x03;
    return Buffer.concat([Buffer.from([prefix]), publicKeyRaw.slice(1, 33)]);
  }

  extractRawPrivateKey(pemPrivateKey: string): Buffer {
    // Remove PEM headers and decode base64
    console.log("pemPrivateKey", pemPrivateKey);
    // const pemContent = pemPrivateKey
    //   .replace(/-----BEGIN PRIVATE KEY-----/, '')
    //   .replace(/-----END PRIVATE KEY-----/, '')
    //   .replace(/\n/g, '');
    // console.log("pemContent", pemContent);
    // const derBuffer = Buffer.from(pemContent, 'base64');
    const cleanedPemPrivateKey = pemPrivateKey
    .replace(/\n/g, '') // Remove all newlines
    .replace(/-----BEGIN PRIVATE KEY-----/, '-----BEGIN PRIVATE KEY-----\n')
    .replace(/-----END PRIVATE KEY-----/, '\n-----END PRIVATE KEY-----\n');
    // Parse the DER-encoded key
    const parsedKey = crypto.createPrivateKey({
      key: cleanedPemPrivateKey,
      format: 'pem',
      type: 'pkcs8'
    });
  
    // Export the key in DER format
    const derKey = parsedKey.export({
      format: 'der',
      type: 'sec1'
    });
  
    // Decode the ASN.1 structure
    const decoded = derKey.subarray(7, 39);
  
    // Extract the raw private key
    return decoded;
  }

  getPublicKey() {
    return Buffer.from(this.publicKey).toString("hex");
  }

  prove(alpha: Uint8Array): Uint8Array {
    if (!this.secretKey) {
      throw new Error("Secret key not set");
    }
    const pi = p256._prove(this.secretKey, Array.from(alpha));
    return Buffer.from(pi);
  }

  proofToHash(pi: Uint8Array): Uint8Array {
    const beta = p256._proof_to_hash(Array.from(pi));
    return Buffer.from(beta);
  }

  hash(alpha: Uint8Array): { beta: Uint8Array; pi: Uint8Array } {
    if (!this.secretKey) {
      throw new Error("Secret key not set");
    }
    const pi = p256._prove(this.secretKey, Array.from(alpha));
    const beta = p256._proof_to_hash(pi);
    return { beta: Buffer.from(beta), pi: Buffer.from(pi) };
  }

  verify(pi: Uint8Array, alpha: Uint8Array, beta: Uint8Array): boolean {
    const publickey = p256.to_point(this.publicKey);
    if (publickey === "INVALID") {
      throw new Error("Invalid public key");
    }
    const _beta = p256._verify(publickey, Array.from(pi), Array.from(alpha));
    return (
      beta.length === _beta.length &&
      beta.every((value, index) => value === _beta[index])
    );
  }
}
export default VRF;
