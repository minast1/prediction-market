import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { RainbowKitCustomConnectButton } from "./scaffold-eth";
import { BarChart3, Briefcase, Search, Shield, TrendingUp } from "lucide-react";

const navItems = [
  { to: "/", label: "Home", icon: TrendingUp },
  { to: "/markets", label: "Markets", icon: Search },
  { to: "/portfolio", label: "Portfolio", icon: Briefcase },
  { to: "/dashboard/admin-portal", label: "Admin", icon: Shield },
];
const Navbar = () => {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-xl">
      <div className="container flex h-14 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold tracking-tight">PredictX</span>
        </Link>

        <nav className="flex items-center gap-1">
          {navItems.map(item => {
            const active = pathname === item.to || (item.to !== "/" && pathname.startsWith(item.to));
            return (
              <Link
                key={item.to}
                href={item.to}
                className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                }`}
              >
                <item.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <RainbowKitCustomConnectButton />
      </div>
    </header>
  );
};

export default Navbar;
