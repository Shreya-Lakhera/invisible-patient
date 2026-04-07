"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MessageCircle, BarChart2, Users } from "lucide-react";

const links = [
  { href: "/",       label: "Home",     Icon: Home },
  { href: "/talk",   label: "Talk",     Icon: MessageCircle },
  { href: "/insights", label: "Insights", Icon: BarChart2 },
  { href: "/forum",  label: "Circle",   Icon: Users },
];

export default function Navbar() {
  const pathname = usePathname();
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#090d15]/80 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <div className="w-7 h-7 rounded-full bg-[#B2AC88]/30 flex items-center justify-center">
          <div className="w-3 h-3 rounded-full bg-[#B2AC88]" />
        </div>
        <span style={{ fontFamily: "var(--font-display)" }} className="text-[#F5F0E8] font-medium text-lg tracking-wide">
          The Invisible Patient
        </span>
      </div>
      <div className="flex items-center gap-1">
        {links.map(({ href, label, Icon }) => {
          const active = pathname === href;
          return (
            <Link key={href} href={href}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all duration-200 ${
                active
                  ? "bg-white/10 text-[#F5F0E8]"
                  : "text-[#A09890] hover:text-[#F5F0E8] hover:bg-white/5"
              }`}>
              <Icon size={15} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}