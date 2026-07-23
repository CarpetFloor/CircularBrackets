const crypto = require("crypto");

const passphrase = "";
const salt = crypto.randomBytes(16);
const key = crypto.scryptSync(passphrase, salt, 32);
const buffer = Buffer.from(key);
console.log(buffer.toString("hex"));
