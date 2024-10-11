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
  private publicKeyHex: string;
  private publickey: number[];
  private secretKey: BN;

  constructor(secretKey?: string) {
    if (!secretKey) {
      const keypair = p256.EC.genKeyPair();
      this.secretKey = keypair.getPrivate();
      this.publicKeyHex = keypair.getPublic("hex");
      this.publickey = keypair.getPublic(true, "array");
    } else {
      this.secretKey = new BN(secretKey, "hex");
      const derivedPublicKey = p256.EC.keyFromPrivate(
        this.secretKey.toBuffer()
      ).getPublic();
      this.publickey = derivedPublicKey.encode("array", true);
      this.publicKeyHex = derivedPublicKey.encode("hex", true);
      p256._validate_key(this.publickey);
    }
  }

  getPrivateKey() {
    return this.secretKey.toString("hex");
  }

  private compressPublicKey(publicKeyRaw: Buffer): Buffer {
    const prefix = publicKeyRaw[64] % 2 === 0 ? 0x02 : 0x03;
    return Buffer.concat([Buffer.from([prefix]), publicKeyRaw.slice(1, 33)]);
  }

  getPublicKey() {
    return this.publicKeyHex;
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
    const publickey = p256.to_point(this.publickey);
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
