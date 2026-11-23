import { useCallback, useEffect, useState } from "react"
import { Link } from "react-router"
import { useAuth } from "../../auth/hooks/useAuth"
import { createProOrder, getBillingStatus, verifyProPayment } from "../services/platform.api"
import "../style/platform.scss"
import "../style/billing.scss"

const RAZORPAY_CHECKOUT_URL = "https://checkout.razorpay.com/v1/checkout.js"

function loadRazorpayCheckout() {
    if (window.Razorpay) return Promise.resolve(true)
    return new Promise((resolve, reject) => {
        const existing = document.querySelector(`script[src="${RAZORPAY_CHECKOUT_URL}"]`)
        if (existing) {
            existing.addEventListener("load", () => resolve(true), { once: true })
            existing.addEventListener("error", () => reject(new Error("Could not load secure checkout.")), { once: true })
            return
        }
        const script = document.createElement("script")
        script.src = RAZORPAY_CHECKOUT_URL
        script.async = true
        script.onload = () => resolve(true)
        script.onerror = () => reject(new Error("Could not load secure checkout."))
        document.body.appendChild(script)
    })
}

const PricingPage = () => {
    const { user } = useAuth()
    const [status, setStatus] = useState(null)
    const [loading, setLoading] = useState(true)
    const [paying, setPaying] = useState(false)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState("")

    const refreshStatus = useCallback(async () => {
        const current = await getBillingStatus()
        setStatus(current)
        return current
    }, [])

    useEffect(() => {
        refreshStatus()
            .catch(loadError => setError(loadError?.response?.data?.message || loadError.message || "Could not load plans."))
            .finally(() => setLoading(false))
    }, [refreshStatus])

    const handleUpgrade = async () => {
        setError("")
        setSuccess("")
        setPaying(true)
        try {
            const order = await createProOrder()
            await loadRazorpayCheckout()
            const checkout = new window.Razorpay({
                key: order.keyId,
                amount: order.amount,
                currency: order.currency,
                name: "AI Prep",
                description: `AI Prep Pro · ${order.planDays} days`,
                order_id: order.orderId,
                prefill: { email: user?.email || "", name: user?.username || "" },
                theme: { color: "#4f46e5" },
                handler: async payment => {
                    try {
                        await verifyProPayment(payment)
                        await refreshStatus()
                        setSuccess("Payment verified. Pro is active for your account.")
                    } catch (verifyError) {
                        setError(verifyError?.response?.data?.message || verifyError.message || "Payment could not be verified yet. Refresh your plan status in a moment.")
                    } finally {
                        setPaying(false)
                    }
                },
                modal: { ondismiss: () => setPaying(false) }
            })
            checkout.on("payment.failed", response => {
                setError(response?.error?.description || "Payment was not completed. You have not been charged by this page.")
                setPaying(false)
            })
            checkout.open()
        } catch (checkoutError) {
            setError(checkoutError?.response?.data?.message || checkoutError?.message || "Could not open checkout.")
            setPaying(false)
        }
    }

    const price = status ? new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: status.currency || "INR",
        maximumFractionDigits: 0
    }).format(status.pricePaise / 100) : "₹199"

    return (
        <div className="platform-page billing-page">
            <header className="platform-header">
                <span className="billing-eyebrow">SIMPLE PLANS</span>
                <h1>Choose your preparation plan</h1>
                <p className="platform-subtitle">Start free. Upgrade when you want more tailored resume feedback.</p>
            </header>

            {error && <div className="error-banner" role="alert">{error}</div>}
            {success && <div className="success-banner" role="status">{success}</div>}

            <div className="billing-plans">
                <section className="billing-plan">
                    <div className="billing-plan__top">
                        <span className="billing-plan__icon">🌱</span>
                        <h2>Free</h2>
                        <p>For getting started</p>
                    </div>
                    <div className="billing-plan__price">₹0 <span>/ forever</span></div>
                    <ul>
                        <li>2 ATS resume checks each month</li>
                        <li>Interview prep and existing tools</li>
                        <li>Resume feedback for one job at a time</li>
                    </ul>
                    <Link className="platform-btn platform-btn--secondary billing-plan__button" to="/ats-checker">Use free ATS check</Link>
                </section>

                <section className={`billing-plan billing-plan--pro ${status?.isPro ? "billing-plan--active" : ""}`}>
                    <div className="billing-plan__ribbon">PRO</div>
                    <div className="billing-plan__top">
                        <span className="billing-plan__icon">⚡</span>
                        <h2>Pro</h2>
                        <p>For focused job applications</p>
                    </div>
                    <div className="billing-plan__price">{price} <span>/ 30 days</span></div>
                    <ul>
                        <li>Unlimited ATS resume checks</li>
                        <li>Detailed role-specific feedback</li>
                        <li>Secure Razorpay checkout</li>
                        <li>One-time payment; no auto-renewal</li>
                    </ul>
                    {status?.isPro ? (
                        <div className="billing-active-state">
                            Pro active through {new Date(status.proExpiresAt).toLocaleDateString()}
                        </div>
                    ) : (
                        <button
                            className="platform-btn platform-btn--primary billing-plan__button"
                            type="button"
                            onClick={handleUpgrade}
                            disabled={loading || paying || !status?.paymentsEnabled}
                        >
                            {paying ? "Opening checkout…" : loading ? "Loading…" : status?.paymentsEnabled ? `Get Pro for ${price}` : "Payments not configured"}
                        </button>
                    )}
                    {!status?.paymentsEnabled && !status?.isPro && (
                        <p className="billing-setup-note">Checkout will activate after the Razorpay keys are added to the backend hosting environment.</p>
                    )}
                    <p className="billing-plan__fineprint">One payment gives 30 days of Pro. It does not renew automatically.</p>
                </section>
            </div>

            {loading && <p className="billing-loading">Loading your plan status…</p>}
        </div>
    )
}

export default PricingPage
