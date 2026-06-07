import { Link, useLocation, useNavigate } from "react-router-dom";
import { ChevronDown, LogOut, Moon, Sun, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/core/theme/theme.context";
import { useAuth } from "@/core/auth/auth.context";
import {
  config,
  getGeneratedModules,
  getHomePath,
  getReadPermission,
  isDashboardEnabled,
  isProfileEnabled,
  modulePath,
  routes,
} from "@/lib/config";
import { getIcon } from "./icons";
import { cn, initials } from "@/lib/utils";

interface NavItem {
  label: string;
  path: string;
  icon: ReturnType<typeof getIcon>;
  permission?: string;
}

function isActive(pathname: string, path: string): boolean {
  return pathname === path || pathname.startsWith(`${path}/`);
}

export function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { user, logout, hasPermission } = useAuth();

  const navItems: NavItem[] = [
    ...(isDashboardEnabled()
      ? [
          {
            label: config.dashboard.label,
            path: routes.dashboardPath,
            icon: getIcon(config.dashboard.icon),
            permission: undefined,
          },
        ]
      : []),
    ...getGeneratedModules().map((module) => ({
      label: module.pluralName,
      path: modulePath(module),
      icon: getIcon(module.icon),
      permission: getReadPermission(module),
    })),
  ].filter((item) => hasPermission(item.permission));

  const handleLogout = async () => {
    await logout();
    navigate(routes.loginPath);
  };

  const logoContent = config.logo ? (
    <img src={config.logo} alt="" className="h-8 w-8 rounded-xl object-cover" />
  ) : (
    <span
      className="flex h-8 w-8 items-center justify-center rounded-xl text-sm font-bold text-primary-foreground shadow"
      style={{ background: "var(--primary-gradient, var(--primary))" }}
    >
      {config.logoInitials || initials(config.appName)}
    </span>
  );

  const userInitials = initials(user?.name ?? user?.email ?? "");

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center gap-4 px-4 md:px-6">
        <Link to={navItems[0]?.path ?? getHomePath()} className="flex items-center gap-2">
          {logoContent}
          <span className="hidden text-sm font-semibold tracking-tight sm:inline">{config.appName}</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => {
            const active = isActive(location.pathname, item.path);
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={cn(
                  "relative px-3 py-2 text-sm transition-colors",
                  active ? "font-medium text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {item.label}
                {active && (
                  <span
                    className="absolute inset-x-2 -bottom-px h-0.5 rounded-full"
                    style={{ background: "var(--primary-gradient, var(--primary))" }}
                  />
                )}
              </button>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-9 w-9" title="Toggle theme">
            {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-auto gap-2 rounded-full py-1 pl-1 pr-2">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt="" className="h-7 w-7 rounded-full object-cover" />
                ) : (
                  <span
                    className="flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold text-primary-foreground"
                    style={{ background: "var(--primary)" }}
                  >
                    {userInitials}
                  </span>
                )}
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem disabled>
                <span className="text-xs text-muted-foreground">{user?.email}</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {isProfileEnabled() && (
                <DropdownMenuItem onClick={() => navigate(routes.profilePath)}>
                  <User className="mr-2 h-4 w-4" /> Profile
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" /> Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-50 flex border-t bg-background/95 backdrop-blur md:hidden">
        {navItems.slice(0, 5).map((item) => {
          const active = isActive(location.pathname, item.path);
          const Icon = item.icon;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px]",
                active ? "text-foreground" : "text-muted-foreground"
              )}
              style={active ? { color: "var(--primary)" } : undefined}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </button>
          );
        })}
      </nav>
    </header>
  );
}
