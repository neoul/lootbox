import {
  AccountAddress,
  AccountAddressInput,
  Hex,
  Account,
  Ed25519PrivateKey,
  GenerateAccount,
  Ed25519Account,
  Serializer,
  KeylessAccount,
} from "@aptos-labs/ts-sdk";
import * as fs from "fs";

export function toNumberArray(s: string, encode = "hex"): number[] {
  return Array.from(Buffer.from(s, "hex"));
}

export function toHexString(arr: number[]): string {
  return Buffer.from(arr).toString("hex");
}

export function loadSecretKey(filepath: string): Ed25519PrivateKey {
  const keyStr = fs.readFileSync(filepath, "utf8");
  return new Ed25519PrivateKey(keyStr);
}
