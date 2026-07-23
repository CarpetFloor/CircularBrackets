const crypto = require("crypto");

// const passphrase = "";
// const salt = crypto.randomBytes(32).toString("hex");
// const key = crypto.scryptSync(passphrase, salt, 32);
// const buffer = Buffer.from(key);
// console.log(buffer.toString("hex"));
console.log(crypto.randomBytes(32).toString("hex"));