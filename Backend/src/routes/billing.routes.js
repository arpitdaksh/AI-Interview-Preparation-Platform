const express = require("express")
const authMiddleware = require("../middlewares/auth.middleware")
const {
    getBillingStatusController,
    createProOrderController,
    verifyProPaymentController,
    razorpayWebhookController
} = require("../controllers/billing.controller")

const billingRouter = express.Router()

billingRouter.get("/status", authMiddleware.authUser, getBillingStatusController)
billingRouter.post("/orders/pro", authMiddleware.authUser, createProOrderController)
billingRouter.post("/verify", authMiddleware.authUser, verifyProPaymentController)
billingRouter.post("/webhook", razorpayWebhookController)

module.exports = billingRouter
