const crypto = require("crypto")
const userModel = require("../models/user.model")
const paymentModel = require("../models/payment.model")
const atsUsageModel = require("../models/atsUsage.model")

const FREE_ATS_CHECKS_PER_MONTH = 2
const PRO_DAYS = 30

function getMonthKey(date = new Date()) {
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`
}

function getProPricePaise() {
    const configured = Number(process.env.PRO_MONTHLY_PRICE_PAISE || 19900)
    return Number.isSafeInteger(configured) && configured >= 100 ? configured : 19900
}

function isRazorpayConfigured() {
    return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET)
}

function getRazorpayAuthHeader() {
    return `Basic ${Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString("base64")}`
}

function secureCompareHex(expectedHex, suppliedHex) {
    if (typeof suppliedHex !== "string" || !/^[a-f0-9]{64}$/i.test(suppliedHex)) return false
    const expected = Buffer.from(expectedHex, "hex")
    const supplied = Buffer.from(suppliedHex, "hex")
    return expected.length === supplied.length && crypto.timingSafeEqual(expected, supplied)
}

function requireRazorpayConfig() {
    if (!isRazorpayConfigured()) {
        const error = new Error("Online payments are not configured yet. Please try again later.")
        error.status = 503
        throw error
    }
}

async function getAtsUsage(userId, month = getMonthKey()) {
    const record = await atsUsageModel.findOne({ user: userId, month }).lean()
    return record?.checks || 0
}

async function getBillingStatus(userId) {
    const user = await userModel.findById(userId).select("proExpiresAt username email").lean()
    if (!user) {
        const error = new Error("User account not found.")
        error.status = 404
        throw error
    }

    const used = await getAtsUsage(userId)
    const proExpiresAt = user.proExpiresAt && new Date(user.proExpiresAt) > new Date() ? user.proExpiresAt : null
    const isPro = Boolean(proExpiresAt)

    return {
        plan: isPro ? "pro" : "free",
        isPro,
        proExpiresAt,
        usage: {
            used,
            limit: isPro ? null : FREE_ATS_CHECKS_PER_MONTH,
            remaining: isPro ? null : Math.max(0, FREE_ATS_CHECKS_PER_MONTH - used),
            month: getMonthKey()
        },
        paymentsEnabled: isRazorpayConfigured(),
        razorpayKeyId: isRazorpayConfigured() ? process.env.RAZORPAY_KEY_ID : null,
        pricePaise: getProPricePaise(),
        currency: "INR",
        planDays: PRO_DAYS
    }
}

async function reserveAtsCheck(userId) {
    const user = await userModel.findById(userId).select("proExpiresAt").lean()
    if (!user) {
        const error = new Error("User account not found.")
        error.status = 404
        throw error
    }

    const month = getMonthKey()
    const isPro = user.proExpiresAt && new Date(user.proExpiresAt) > new Date()
    if (isPro) {
        return { isPro: true, usage: await getAtsUsage(userId, month), limit: null }
    }

    let record
    try {
        record = await atsUsageModel.findOneAndUpdate(
            { user: userId, month },
            { $inc: { checks: 1 }, $setOnInsert: { user: userId, month } },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        )
    } catch (error) {
        // Two first-time checks can race to create the unique user/month record.
        if (error.code !== 11000) throw error
        record = await atsUsageModel.findOneAndUpdate(
            { user: userId, month },
            { $inc: { checks: 1 } },
            { new: true }
        )
    }

    if (record.checks > FREE_ATS_CHECKS_PER_MONTH) {
        await atsUsageModel.updateOne({ _id: record._id, checks: { $gt: 0 } }, { $inc: { checks: -1 } })
        const error = new Error("You have used your 2 free ATS checks this month. Upgrade to Pro for unlimited checks.")
        error.status = 402
        error.code = "ATS_LIMIT_REACHED"
        throw error
    }

    return {
        isPro: false,
        usage: record.checks,
        limit: FREE_ATS_CHECKS_PER_MONTH
    }
}

async function releaseAtsCheck(userId) {
    await atsUsageModel.updateOne(
        { user: userId, month: getMonthKey(), checks: { $gt: 0 } },
        { $inc: { checks: -1 } }
    )
}

async function createProOrder(userId) {
    requireRazorpayConfig()
    const amount = getProPricePaise()
    const receipt = `pro_${String(userId).slice(-10)}_${crypto.randomBytes(5).toString("hex")}`
    const response = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: {
            Authorization: getRazorpayAuthHeader(),
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            amount,
            currency: "INR",
            receipt,
            notes: { userId: String(userId), plan: "pro-30-days" }
        })
    })
    const order = await response.json().catch(() => ({}))
    if (!response.ok || !order.id) {
        console.error("[Billing] Razorpay order creation failed:", order?.error?.code || response.status)
        const error = new Error("Could not start checkout. Please try again shortly.")
        error.status = 502
        throw error
    }

    await paymentModel.create({
        user: userId,
        razorpayOrderId: order.id,
        amount,
        currency: "INR",
        status: "created"
    })

    return {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
        planDays: PRO_DAYS
    }
}

async function grantProForPaidOrder({ payment, paymentId }) {
    const userUpdate = await userModel.updateOne(
        { _id: payment.user, proGrantOrderIds: { $ne: payment.razorpayOrderId } },
        [{
            $set: {
                proExpiresAt: {
                    $dateAdd: {
                        startDate: {
                            $cond: [
                                { $gt: [{ $ifNull: ["$proExpiresAt", new Date()] }, new Date()] },
                                { $ifNull: ["$proExpiresAt", new Date()] },
                                new Date()
                            ]
                        },
                        unit: "day",
                        amount: PRO_DAYS
                    }
                },
                proGrantOrderIds: {
                    $setUnion: [{ $ifNull: ["$proGrantOrderIds", []] }, [payment.razorpayOrderId]]
                }
            }
        }]
    )
    if (!userUpdate.matchedCount) {
        const userExists = await userModel.exists({ _id: payment.user })
        if (!userExists) {
            const error = new Error("User account not found for this payment.")
            error.status = 404
            throw error
        }
    }

    await paymentModel.updateOne(
        { _id: payment._id, status: { $ne: "paid" } },
        { $set: { status: "paid", razorpayPaymentId: paymentId, paidAt: new Date() } }
    )
}

async function recordCapturedPayment({ orderId, paymentId, amount, currency }) {
    const payment = await paymentModel.findOne({ razorpayOrderId: orderId })
    if (!payment) return false
    if (payment.status === "paid") return true
    if (Number(amount) !== payment.amount || currency !== payment.currency) {
        throw new Error("Captured payment amount did not match the Pro plan order.")
    }

    await grantProForPaidOrder({ payment, paymentId })
    return true
}

async function verifyProPayment(userId, { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature }) {
    requireRazorpayConfig()
    if (!orderId || !paymentId || !signature) {
        const error = new Error("Payment verification details are incomplete.")
        error.status = 400
        throw error
    }

    const payment = await paymentModel.findOne({ user: userId, razorpayOrderId: orderId })
    if (!payment) {
        const error = new Error("This payment order does not belong to your account.")
        error.status = 404
        throw error
    }
    if (payment.status !== "paid") {
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(`${payment.razorpayOrderId}|${paymentId}`)
            .digest("hex")
        if (!secureCompareHex(expectedSignature, signature)) {
            const error = new Error("Payment signature is invalid.")
            error.status = 400
            throw error
        }

        const response = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}`, {
            headers: { Authorization: getRazorpayAuthHeader() }
        })
        const captured = await response.json().catch(() => ({}))
        if (!response.ok || captured.order_id !== payment.razorpayOrderId || captured.status !== "captured") {
            const error = new Error("Payment is not captured yet. If money was deducted, wait a moment and refresh your plan status.")
            error.status = 409
            throw error
        }
        await recordCapturedPayment({
            orderId: captured.order_id,
            paymentId: captured.id,
            amount: captured.amount,
            currency: captured.currency
        })
    }

    return getBillingStatus(userId)
}

async function handleRazorpayWebhook(rawBody, suppliedSignature) {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET
    if (!webhookSecret || !Buffer.isBuffer(rawBody)) {
        const error = new Error("Webhook is not configured.")
        error.status = 503
        throw error
    }
    const expected = crypto.createHmac("sha256", webhookSecret).update(rawBody).digest("hex")
    if (!secureCompareHex(expected, suppliedSignature)) {
        const error = new Error("Invalid webhook signature.")
        error.status = 400
        throw error
    }

    const event = JSON.parse(rawBody.toString("utf8"))
    if (event.event === "payment.captured") {
        const captured = event.payload?.payment?.entity
        if (captured?.order_id && captured?.id && captured.status === "captured") {
            await recordCapturedPayment({
                orderId: captured.order_id,
                paymentId: captured.id,
                amount: captured.amount,
                currency: captured.currency
            })
        }
    }

    return { accepted: true, event: event.event || "unknown" }
}

module.exports = {
    FREE_ATS_CHECKS_PER_MONTH,
    getBillingStatus,
    reserveAtsCheck,
    releaseAtsCheck,
    createProOrder,
    verifyProPayment,
    handleRazorpayWebhook
}
