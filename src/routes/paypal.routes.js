const express = require("express");
const { authenticate } = require("../middleware/auth.middleware");
const router = express.Router();
const {
  createOrder,
  captureOrder,
} = require("../controllers/paypal.controller");

router.use(authenticate);

router.post("/create-order", createOrder);
router.post("/capture/:orderId", captureOrder);

module.exports = router;
