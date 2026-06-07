import type { ComponentType, ReactNode } from "react"
import { Outlet } from "react-router-dom"

interface AppLayoutProps {
    provider: ComponentType<{ children: ReactNode }>
    sidebar: ComponentType
    topbar: ComponentType
    sidebarInset: ComponentType<{ children: ReactNode }>
}

export function AppLayout({ provider: Provider, sidebar: Sidebar, topbar: Topbar, sidebarInset: SidebarInset }: AppLayoutProps) {
    return (
        <Provider>
            <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:ring-2 focus:ring-ring"
            >
                Skip to main content
            </a>
            <div className="min-h-screen bg-background">
                <Sidebar />
                <Topbar />
                <SidebarInset>
                    <main id="main-content" tabIndex={-1} className="h-full outline-none">
                        <Outlet />
                    </main>
                </SidebarInset>
            </div>
        </Provider>
    )
}
