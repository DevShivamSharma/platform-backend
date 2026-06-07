import { ShieldCheck, Globe } from "lucide-react"
import { ORGANIZATION_ROUTES } from "@/constants"
import { organizationLogin, organizationForgotPassword, organizationVerifyOtp } from "@organization/services/organization-auth.service"
import { LoginTemplate } from "@/components/login-template"

export default function OrganizationLoginPage() {
    return (
        <LoginTemplate
            onLogin={({ email, password }) => organizationLogin({ email, password })}
            onVerifyOtp={({ otp, otpToken }) => organizationVerifyOtp({ otp, otpToken })}
            onForgotPassword={({ email }) => organizationForgotPassword({ email })}
            hero={{
                badgeText: "Organization Portal",
                title: <>Manage your <span className="gradient-text">patients & claims</span> with ease.</>,
                subtitle: "Access your organization's patient records, submit claims, and manage your team — all in one place.",
                socialProofItems: [
                    {
                        icon: <ShieldCheck className="w-5 h-5 text-primary" />,
                        title: "HIPAA Compliant",
                        description: "End-to-end encryption and audit trails for protected health information.",
                    },
                    {
                        icon: <Globe className="w-5 h-5 text-primary" />,
                        title: "Self-Service",
                        description: "Manage patients, claims, users, and accounts directly from your portal.",
                    },
                ],
                footer: <p className="text-sm">Powered by AidiN Health</p>,
            }}
            loginHeading="Organization Portal"
            loginSubheading="Sign in to your organization's portal."
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
