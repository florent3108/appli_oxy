"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "~/lib/utils";

export function Navbar() {
    const pathname = usePathname();

    return (
        <nav className="border-b border-slate-800 bg-slate-950 sticky top-0 z-50">
            <div className="w-full pr-4 h-12 flex items-center justify-between">
                <div className="flex items-center h-full pl-2">
                    <Image
                        src="/logo_oxygen.png"
                        alt="Logo Oxygen"
                        width={120}
                        height={40}
                        style={{ height: 'auto', width: 'auto', maxHeight: '40px' }}
                        priority
                    />
                </div>
                <div className="flex space-x-8">
                    <Link
                        href="/"
                        className={cn(
                            "text-base font-medium transition-colors hover:text-[#00b3d5]",
                            "h-12 flex items-center",
                            pathname === "/" ? "text-[#00b3d5]" : "text-white"
                        )}
                    >
                        PHP
                    </Link>
                    <Link
                        href="/contacts"
                        className={cn(
                            "text-base font-medium transition-colors hover:text-[#00b3d5]",
                            "h-12 flex items-center",
                            pathname === "/contacts" ? "text-[#00b3d5]" : "text-white"
                        )}
                    >
                        Contacts
                    </Link>
                </div>
            </div>
        </nav>
    );
}
