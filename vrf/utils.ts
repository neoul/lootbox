export function toNumberArray(s: string, encode = "hex"): number[] {
  return Array.from(Buffer.from(s, "hex"));
}

export function toHexString(arr: number[]): string {
  return Buffer.from(arr).toString("hex");
}
