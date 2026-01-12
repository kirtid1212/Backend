const express = require("express");
const router = express.Router();
const auth = require("../controllers/auth.controller");
const { generateToken } = require("../middleware/auth.middleware.js");

router.post("/send-otp", auth.sendOTP);
router.post("/verify-otp", auth.verifyOTP);
router.post("/set-password", auth.setPassword);
router.post("/login", auth.login);
router.post("/login-otp", auth.loginWithOTP);
router.post("/reset-otp", auth.resendOTP); 
router.post("/logout", auth.logout);

module.exports = router;
