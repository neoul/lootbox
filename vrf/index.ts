import * as p256 from "./ecvrf-p256-sha256-tai";

interface IVRF {
  hash(alpha: Uint8Array): Uint8Array; // beta = VRF_hash(SK, alpha)
  prove(secret_key: Uint8Array, alpha: Uint8Array): Uint8Array; // pi = VRF_prove(SK, alpha)
  proofToHash(pi: Uint8Array): Uint8Array; // beta = VRF_proof_to_hash(pi)
  verify(public_key: Uint8Array, alpha: Uint8Array, pi: Uint8Array): boolean; // valid = VRF_verify(PK, alpha, pi)
}

class VRF implements IVRF {
  private secretKey: Uint8Array | null = null;
  private publicKey: Uint8Array | null = null;

  constructor(secretKey?: Uint8Array) {
    if (secretKey) {
      this.setSecretKey(secretKey);
    }
  }

  private static toHex(array: Uint8Array): string {
    return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
      ""
    );
  }

  private static fromHex(hex: string): Uint8Array {
    return new Uint8Array(
      hex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
    );
  }

  setSecretKey(secretKey: Uint8Array): void {
    this.secretKey = secretKey;
    // Derive public key from secret key
    const { public_key } = p256.keygen();
    this.publicKey = VRF.fromHex(public_key);
  }

  getPublicKey(): Uint8Array {
    if (!this.publicKey) {
      throw new Error("Secret key not set");
    }
    return this.publicKey;
  }

  hash(alpha: Uint8Array): Uint8Array {
    if (!this.secretKey) {
      throw new Error("Secret key not set");
    }
    const pi = this.prove(this.secretKey, alpha);
    return this.proofToHash(pi);
  }

  prove(secretKey: Uint8Array, alpha: Uint8Array): Uint8Array {
    const secretKeyHex = VRF.toHex(secretKey);
    const alphaHex = VRF.toHex(alpha);
    const piHex = p256.prove(secretKeyHex, alphaHex);
    return VRF.fromHex(piHex);
  }

  proofToHash(pi: Uint8Array): Uint8Array {
    const piHex = VRF.toHex(pi);
    const betaHex = p256.proof_to_hash(piHex);
    return VRF.fromHex(betaHex);
  }

  verify(publicKey: Uint8Array, alpha: Uint8Array, pi: Uint8Array): boolean {
    const publicKeyHex = VRF.toHex(publicKey);
    const alphaHex = VRF.toHex(alpha);
    const piHex = VRF.toHex(pi);
    try {
      p256.verify(publicKeyHex, piHex, alphaHex);
      return true;
    } catch (error) {
      return false;
    }
  }

  static validatePublicKey(publicKey: Uint8Array): boolean {
    const publicKeyHex = VRF.toHex(publicKey);
    try {
      p256.validate_key(publicKeyHex);
      return true;
    } catch (error) {
      return false;
    }
  }
}

export default VRF;
