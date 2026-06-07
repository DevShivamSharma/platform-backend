import * as React from "react"
import { ChevronRight, Home } from "lucide-react"
import { Link, useLocation } from "react-router-dom"

export function Breadcrumbs() {
    const location = useLocation()
    const pathnames = location.pathname.split("/").filter((x) => x)

    if (pathnames.length === 0) return null

    const getLabel = (name: string) =>
        name.charAt(0).toUpperCase() + name.slice(1).replace(/-/g, " ")

    const renderSegments = () => {
        if (pathnames.length <= 3) {
            return pathnames.map((name, index) => {
                const routeTo = `/${pathnames.slice(0, index + 1).join("/")}`
                const isLast = index === pathnames.length - 1
                const label = getLabel(name)

                return (
                    <React.Fragment key={name}>
                        <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-50" />
                        {isLast ? (
                            <span
                                className="font-medium text-foreground px-1 max-w-[150px] truncate"
                                aria-current="page"
                                title={label}
                            >
                                {label}
                            </span>
                        ) : (
                            <Link
                                to={routeTo}
                                className="hover:text-foreground transition-colors px-1 py-0.5 rounded-md hover:bg-muted/50 max-w-[150px] truncate"
                                title={label}
                            >
                                {label}
                            </Link>
                        )}
                    </React.Fragment>
                )
            })
        }

        // More than 3 segments: Home > First > ... > Second-to-last > Last
        const first = pathnames[0]
        const secondToLast = pathnames[pathnames.length - 2]
        const last = pathnames[pathnames.length - 1]

        const firstRoute = `/${first}`
        const secondToLastRoute = `/${pathnames.slice(0, pathnames.length - 1).join("/")}`

        return (
            <>
                {/* First segment */}
                <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-50" />
                <Link
                    to={firstRoute}
                    className="hover:text-foreground transition-colors px-1 py-0.5 rounded-md hover:bg-muted/50 max-w-[150px] truncate"
                    title={getLabel(first)}
                >
                    {getLabel(first)}
                </Link>

                {/* Ellipsis */}
                <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-50" />
                <span className="px-1 text-muted-foreground">...</span>

                {/* Second-to-last segment */}
                <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-50" />
                <Link
                    to={secondToLastRoute}
                    className="hover:text-foreground transition-colors px-1 py-0.5 rounded-md hover:bg-muted/50 max-w-[150px] truncate"
                    title={getLabel(secondToLast)}
                >
                    {getLabel(secondToLast)}
                </Link>

                {/* Last segment */}
                <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-50" />
                <span
                    className="font-medium text-foreground px-1 max-w-[150px] truncate"
                    aria-current="page"
                    title={getLabel(last)}
                >
                    {getLabel(last)}
                </span>
            </>
        )
    }

    return (
        <nav aria-label="Breadcrumb" className="flex items-center space-x-1 text-sm text-muted-foreground animate-fade-in">
            <Link
                to="/dashboard/analytics"
                className="hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted/50"
            >
                <Home className="h-4 w-4" />
            </Link>
            {renderSegments()}
        </nav>
    )
}
