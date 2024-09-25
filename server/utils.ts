// JSON.stringify for BigInt
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};