import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import TestnetFaucetButton from "./TestNetFaucetButton";
import { FaucetButton, RainbowKitCustomConnectButton } from "./scaffold-eth";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "./ui/sheet";
import { BarChart3, Briefcase, Menu, Search, TrendingUp } from "lucide-react";
import { hardhat } from "viem/chains";
import { useTargetNetwork } from "~~/hooks/scaffold-eth";
import useMedia from "~~/hooks/useMedia";

const navItems = [
  { to: "/", label: "Home", icon: TrendingUp },
  { to: "/markets", label: "Markets", icon: Search },
  { to: "/portfolio", label: "Portfolio", icon: Briefcase },
  // { to: "/dashboard/admin-portal", label: "Admin", icon: Shield },
];
const Navbar = () => {
  const pathname = usePathname();
  const { targetNetwork } = useTargetNetwork();
  const isLocalNetwork = targetNetwork.id === hardhat.id;
  const [open, setOpen] = useState(false);
  const { isMobile } = useMedia();
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-xl">
      <div className="container flex h-14 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold tracking-tight">PredictX</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
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
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-3">
          <RainbowKitCustomConnectButton />
          {isLocalNetwork && !isMobile && <FaucetButton />}
          {!isLocalNetwork && !isMobile && <TestnetFaucetButton />}
          {/* Mobile menu */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button className="md:hidden rounded-md p-2 text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors">
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64" showCloseButton={false}>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  PredictX
                </SheetTitle>
              </SheetHeader>
              <nav className="mt-6 flex flex-col gap-1 px-5">
                {navItems.map(item => {
                  const active = pathname === item.to || (item.to !== "/" && pathname.startsWith(item.to));
                  return (
                    <Link
                      key={item.to}
                      href={item.to}
                      onClick={() => setOpen(false)}
                      className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                        active
                          ? "bg-secondary text-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                      }`}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  );
                })}
                <TestnetFaucetButton />
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
