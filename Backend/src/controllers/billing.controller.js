const billingService = require("../services/billing.service")

async function getBillingStatusController(req, res) {
    try {
        const status = await billingService.getBillingStatus(req.user.id)
        res.status(200).json({ status })
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message || "Could not load plan status." })
    }
}

async function createProOrderController(req, res) {
    try {
        const order = await billingService.createProOrder(req.user.id)
        res.status(201).json({ order })
    } catch (error) {
        console.error("[Billing] Order creation failed:", error.message)
        res.status(error.status || 500).json({ message: error.message || "Could not start checkout." })
    }
}

async function verifyProPaymentController(req, res) {
    try {
        const status = await billingService.verifyProPayment(req.user.id, req.body || {})
        res.status(200).json({ message: "Pro access is active.", status })
    } catch (error) {
        console.error("[Billing] Payment verification failed:", error.message)
        res.status(error.status || 500).json({ message: error.message || "Could not verify payment." })
    }
}

async function razorpayWebhookController(req, res) {
    try {
        const result = await billingService.handleRazorpayWebhook(
            req.rawBody,
            req.get("X-Razorpay-Signature")
        )
        res.status(200).json(result)
    } catch (error) {
        console.error("[Billing] Webhook rejected:", error.message)
        res.status(error.status || 400).json({ message: error.message || "Webhook rejected." })
    }
}

module.exports = {
    getBillingStatusController,
    createProOrderController,
    verifyProPaymentController,
    razorpayWebhookController
}
