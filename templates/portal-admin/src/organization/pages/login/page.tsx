import { Globe, ShieldCheck, Sparkles } from "lucide-react"
import { ORGANIZATION_ROUTES } from "@/constants"
import { organizationLogin, organizationForgotPassword, organizationVerifyOtp } from "@organization/services/organization-auth.service"
import { LoginTemplate } from "@/components/login-template"
import { getPortalDisplayName, getPortalFooterText, portalConfig } from "@/lib/portal-config"

function highlightedHeadline(headline: string, highlightText?: string) {
    if (!highlightText) return headline
    const index = headline.toLowerCase().indexOf(highlightText.toLowerCase())
    if (index === -1) return headline

    const before = headline.slice(0, index)
    const match = headline.slice(index, index + highlightText.length)
    const after = headline.slice(index + highlightText.length)
    return (
        <>
            {before}
            <span className="gradient-text">{match}</span>
            {after}
        </>
    )
}

export default function OrganizationLoginPage() {
    const displayName = getPortalDisplayName()
    const loginPage = portalConfig.loginPage || {}
    const features = loginPage.features?.length
        ? loginPage.features
        : [
            {
                title: "Secure Access",
                description: "Enterprise-grade authentication for authorized users.",
            },
            {
                title: "Self Service",
                description: "Manage records and workflows from one dashboard.",
            },
        ]
    const featureIcons = [ShieldCheck, Globe, Sparkles]

    return (
        <LoginTemplate
            onLogin={({ email, password }) => organizationLogin({ email, password })}
            onVerifyOtp={({ otp, otpToken }) => organizationVerifyOtp({ otp, otpToken })}
            onForgotPassword={({ email }) => organizationForgotPassword({ email })}
            hero={{
                badgeText: loginPage.badge || displayName,
                title: highlightedHeadline(
                    loginPage.headline || `Sign in to ${displayName}`,
                    loginPage.highlightText,
                ),
                subtitle: loginPage.description || "Manage records, workflows, and operations from one secure portal.",
                socialProofItems: features.slice(0, 3).map((feature, index) => {
                    const Icon = featureIcons[index % featureIcons.length]
                    return {
                        icon: <Icon className="w-5 h-5 text-primary" />,
                        title: feature.title,
                        description: feature.description,
                    }
                }),
                footer: <p className="text-sm">{getPortalFooterText()}</p>,
            }}
            loginHeading={loginPage.portalName || displayName}
            loginSubheading={`Sign in to ${displayName}.`}
            auditEvents={{
                loginFailed: "ORGANIZATION_LOGIN_FAILED",
                lockout: "ORGANIZATION_LOGIN_LOCKOUT",
            }}
            routes={{
                forceReset: ORGANIZATION_ROUTES.FORCE_RESET,
                dashboard: ORGANIZATION_ROUTES.DASHBOARD,
            }}
        />
    )
}
