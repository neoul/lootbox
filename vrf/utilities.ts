import * as fs from "fs";

export function toNumberArray(s: string, encode = "hex"): number[] {
  return Array.from(Buffer.from(s, "hex"));
}

export function toHexString(arr: number[]): string {
  return Buffer.from(arr).toString("hex");
}

// export function loadPrivateKey(filepath: string): Ed25519PrivateKey {
//   const keyStr = fs.readFileSync(filepath, "utf8");
//   return new Ed25519PrivateKey(keyStr);
// }

// export function getPublicKey(privateKey: Ed25519PrivateKey) {
//   return privateKey.publicKey();
// }