export interface Country {
    name: string
    iso: string
    dialCode: string
    flag: string
}

export const COUNTRIES: Country[] = [
    { name: "United States", iso: "US", dialCode: "+1", flag: "🇺🇸" },
    { name: "Canada", iso: "CA", dialCode: "+1", flag: "🇨🇦" },
    { name: "United Kingdom", iso: "GB", dialCode: "+44", flag: "🇬🇧" },
    { name: "Australia", iso: "AU", dialCode: "+61", flag: "🇦🇺" },
    { name: "Germany", iso: "DE", dialCode: "+49", flag: "🇩🇪" },
    { name: "France", iso: "FR", dialCode: "+33", flag: "🇫🇷" },
    { name: "India", iso: "IN", dialCode: "+91", flag: "🇮🇳" },
    { name: "Japan", iso: "JP", dialCode: "+81", flag: "🇯🇵" },
    { name: "Brazil", iso: "BR", dialCode: "+55", flag: "🇧🇷" },
    { name: "Mexico", iso: "MX", dialCode: "+52", flag: "🇲🇽" },
    { name: "Singapore", iso: "SG", dialCode: "+65", flag: "🇸🇬" },
    { name: "Netherlands", iso: "NL", dialCode: "+31", flag: "🇳🇱" },
    { name: "Sweden", iso: "SE", dialCode: "+46", flag: "🇸🇪" },
    { name: "Switzerland", iso: "CH", dialCode: "+41", flag: "🇨🇭" },
    { name: "South Korea", iso: "KR", dialCode: "+82", flag: "🇰🇷" },
    { name: "Italy", iso: "IT", dialCode: "+39", flag: "🇮🇹" },
    { name: "Spain", iso: "ES", dialCode: "+34", flag: "🇪🇸" },
    { name: "China", iso: "CN", dialCode: "+86", flag: "🇨🇳" },
    { name: "New Zealand", iso: "NZ", dialCode: "+64", flag: "🇳🇿" },
    { name: "Ireland", iso: "IE", dialCode: "+353", flag: "🇮🇪" },
    { name: "Norway", iso: "NO", dialCode: "+47", flag: "🇳🇴" },
    { name: "Denmark", iso: "DK", dialCode: "+45", flag: "🇩🇰" },
    { name: "Finland", iso: "FI", dialCode: "+358", flag: "🇫🇮" },
    { name: "Austria", iso: "AT", dialCode: "+43", flag: "🇦🇹" },
    { name: "Belgium", iso: "BE", dialCode: "+32", flag: "🇧🇪" },
    { name: "Portugal", iso: "PT", dialCode: "+351", flag: "🇵🇹" },
    { name: "Israel", iso: "IL", dialCode: "+972", flag: "🇮🇱" },
    { name: "United Arab Emirates", iso: "AE", dialCode: "+971", flag: "🇦🇪" },
    { name: "Saudi Arabia", iso: "SA", dialCode: "+966", flag: "🇸🇦" },
    { name: "South Africa", iso: "ZA", dialCode: "+27", flag: "🇿🇦" },
    { name: "Argentina", iso: "AR", dialCode: "+54", flag: "🇦🇷" },
    { name: "Colombia", iso: "CO", dialCode: "+57", flag: "🇨🇴" },
    { name: "Chile", iso: "CL", dialCode: "+56", flag: "🇨🇱" },
    { name: "Philippines", iso: "PH", dialCode: "+63", flag: "🇵🇭" },
    { name: "Thailand", iso: "TH", dialCode: "+66", flag: "🇹🇭" },
    { name: "Malaysia", iso: "MY", dialCode: "+60", flag: "🇲🇾" },
    { name: "Indonesia", iso: "ID", dialCode: "+62", flag: "🇮🇩" },
    { name: "Vietnam", iso: "VN", dialCode: "+84", flag: "🇻🇳" },
    { name: "Poland", iso: "PL", dialCode: "+48", flag: "🇵🇱" },
    { name: "Czech Republic", iso: "CZ", dialCode: "+420", flag: "🇨🇿" },
    { name: "Romania", iso: "RO", dialCode: "+40", flag: "🇷🇴" },
    { name: "Turkey", iso: "TR", dialCode: "+90", flag: "🇹🇷" },
    { name: "Egypt", iso: "EG", dialCode: "+20", flag: "🇪🇬" },
    { name: "Nigeria", iso: "NG", dialCode: "+234", flag: "🇳🇬" },
    { name: "Kenya", iso: "KE", dialCode: "+254", flag: "🇰🇪" },
    { name: "Pakistan", iso: "PK", dialCode: "+92", flag: "🇵🇰" },
    { name: "Bangladesh", iso: "BD", dialCode: "+880", flag: "🇧🇩" },
    { name: "Russia", iso: "RU", dialCode: "+7", flag: "🇷🇺" },
    { name: "Ukraine", iso: "UA", dialCode: "+380", flag: "🇺🇦" },
    { name: "Greece", iso: "GR", dialCode: "+30", flag: "🇬🇷" },
]

export const COUNTRY_SELECT_OPTIONS = COUNTRIES.map((c) => ({
    value: c.name,
    label: `${c.flag}  ${c.name}`,
}))

export const COUNTRY_DIAL_CODES = COUNTRIES.map((c) => ({
    code: c.dialCode,
    flag: c.flag,
}))
