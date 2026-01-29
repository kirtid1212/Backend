const crypto = require("crypto");

exports.generateHash = (req, res) => {
  const {
    txnid,
    amount,
    productinfo,
    firstname,
    email
  } = req.body;

  const key = process.env.PAYU_KEY;
  const salt = process.env.PAYU_SALT;

  const hashString =
    `${key}|${txnid}|${amount}|${productinfo}|${firstname}|${email}|||||||||||${salt}`;

  const hash = crypto
    .createHash("sha512")
    .update(hashString)
    .digest("hex");

  res.json({
    key,
    txnid,
    amount,
    productinfo,
    firstname,
    email,
    hash
  });
};
