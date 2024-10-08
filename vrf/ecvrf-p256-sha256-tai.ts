/*
https://tools.ietf.org/pdf/draft-irtf-cfrg-vrf-08.pdf
ECVRF-P256-SHA256-TAI
n=16
qLen=32
cofactor=1
ptLen=33

B = EC.g
q = EC.n
point_to_string = Point.encode('array', true)
string_to_int = new BN(str)
int_to_string = n.toArray('be', len)
*/

// Need to check https://datatracker.ietf.org/doc/html/rfc9381

import BN from "bn.js";
import { sha256 } from "js-sha256";
import * as elliptic from "elliptic";
import { toHexString, toNumberArray } from "./utilities";

type Point = elliptic.curve.base.BasePoint;

export const EC = new elliptic.ec("p256");
const suite = [0x01];

export function to_point(s: number[]): Point | "INVALID" {
  try {
    return EC.curve.decodePoint(s);
  } catch {
    return "INVALID";
  }
}

function arbitrary_string_to_point(s: number[]): Point | "INVALID" {
  if (s.length !== 32) {
    throw new Error("s should be 32 byte");
  }
  return to_point([2, ...s]);
}

function hash_to_curve(public_key: Point, alpha: number[]) {
  let hash: Point | "INVALID" = "INVALID";
  let ctr = 0;
  while ((hash == "INVALID" || hash.isInfinity()) && ctr < 256) {
    const hash_string = sha256
      .create()
      .update(suite)
      .update([0x01])
      .update(public_key.encode("array", true))
      .update(alpha)
      .update([ctr])
      .update([0x00])
      .digest();
    hash = arbitrary_string_to_point(hash_string); // cofactor = 1, skip multiply
    ctr += 1;
  }
  if (hash == "INVALID") {
    throw new Error("hash_to_curve failed");
  }
  return hash;
}

function nonce_generation(secret_key: BN, h_string: number[]) {
  const h1 = sha256.array(h_string);
  let K = new Array(32)
    .fill(0)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  let V = new Array(32)
    .fill(1)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  K = sha256.hmac
    .create(K)
    .update(V)
    .update([0x00])
    .update(secret_key.toArray())
    .update(h1)
    .hex();
  V = sha256.hmac.create(K).update(V).hex();
  K = sha256.hmac
    .create(K)
    .update(V)
    .update([0x01])
    .update(secret_key.toArray())
    .update(h1)
    .hex();
  V = sha256.hmac.create(K).update(V).hex();
  V = sha256.hmac.create(K).update(V).hex(); // qLen = hLen = 32, skip loop
  return new BN(V, "hex");
}

function hash_points(...points: Point[]) {
  const str = [...suite, 0x02];
  for (const point of points) {
    str.push(...point.encode("array", true));
  }
  str.push(0);

  const c_string = sha256.digest(str);
  const truncated_c_string = c_string.slice(0, 16);
  const c = new BN(truncated_c_string);

  return c;
}

function decode_proof(pi: number[]) {
  const gamma_string = pi.slice(0, 33);
  const c_string = pi.slice(33, 33 + 16);
  const s_string = pi.slice(33 + 16, 33 + 16 + 32);
  const Gamma = to_point(gamma_string);
  if (Gamma == "INVALID") {
    return "INVALID";
  }

  const c = new BN(c_string);
  const s = new BN(s_string);

  return {
    Gamma,
    c,
    s,
  };
}

export function _prove(secret_key: BN, alpha: number[]): number[] {
  const public_key = EC.keyFromPrivate(secret_key.toArray()).getPublic();
  const H = hash_to_curve(public_key, alpha);
  const h_string = H.encode("array", true);
  const Gamma = H.mul(secret_key);
  const k = nonce_generation(secret_key, h_string);
  const c = hash_points(H, Gamma, EC.g.mul(k), H.mul(k));
  if (!EC.n) {
    throw new Error("Invalid curve");
  }
  const s = k.add(c.mul(secret_key)).umod(EC.n);
  const pi = [
    ...Gamma.encode("array", true),
    ...c.toArray("be", 16),
    ...s.toArray("be", 32),
  ];
  return pi;
}

export function _proof_to_hash(pi: number[]): number[] {
  const D = decode_proof(pi);
  if (D == "INVALID") {
    throw new Error("Invalid proof");
  }
  const { Gamma } = D;
  const beta = sha256
    .create()
    .update(suite)
    .update([0x03])
    .update(Gamma.encode("array", false))
    .update([0x00])
    .digest();

  return beta;
}

export function _verify(public_key: Point, pi: number[], alpha: number[]) {
  const D = decode_proof(pi);
  if (D == "INVALID") {
    throw new Error("Invalid proof");
  }
  const { Gamma, c, s } = D;
  const H = hash_to_curve(public_key, alpha);
  const U = EC.g.mul(s).add(public_key.mul(c).neg());
  const V = H.mul(s).add(Gamma.mul(c).neg());
  const c2 = hash_points(H, Gamma, U, V);
  if (!c.eq(c2)) {
    throw new Error("Invalid proof");
  }
  return _proof_to_hash(pi);
}

export function _validate_key(public_key_string: number[]) {
  const public_key = to_point(public_key_string);
  if (public_key == "INVALID" || public_key.isInfinity()) {
    throw new Error("Invalid public key");
  }
  return public_key;
}

export function keygen() {
  const keypair = EC.genKeyPair();
  const secret_key = keypair.getPrivate("hex");
  const public_key = keypair.getPublic("hex");
  return {
    secret_key,
    public_key,
  };
}

export function genKeygen() {
  const keypair = EC.genKeyPair();
  const secret_key = keypair.getPrivate();
  const public_key = keypair.getPublic("array");
  return {
    secret_key,
    public_key,
  };
}



export function prove(secret_key: string, alpha: string): string {
  const pi = _prove(new BN(secret_key, "hex"), toNumberArray(alpha, "hex"));
  return toHexString(pi);
}

export function proof_to_hash(pi: string): string {
  const beta = _proof_to_hash(toNumberArray(pi, "hex"));
  return toHexString(beta);
}

export function verify(public_key: string, pi: string, alpha: string): string {
  const beta = _verify(
    EC.curve.decodePoint(public_key, "hex"),
    toNumberArray(pi, "hex"),
    toNumberArray(alpha, "hex")
  );
  return toHexString(beta);
}

export function validate_key(public_key: string) {
  _validate_key(toNumberArray(public_key, "hex"));
  return;
}
