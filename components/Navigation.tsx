"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTranslation } from "react-i18next"
import { LanguageSwitcher } from "./LanguageSwitcher"
import { Button } from "@/components/ui/button"
import { Home, Upload, Download, MessageCircle, Settings } from "lucide-react"

export function Navigation() {
  const { t } = useTranslation()
  const pathname = usePathname()

  const navItems = [
    { href: "/dashboard", label: t("nav.dashboard"), icon: Home },
    { href: "/uploads", label: t("nav.uploads"), icon: Upload },
    { href: "/downloads", label: t("nav.downloads"), icon: Download },
    { href: "/chat", label: t("nav.chat"), icon: MessageCircle },
    { href: "/admin", label: t("nav.admin"), icon: Settings },
  ]

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/dashboard" className="text-xl font-bold text-primary">
              Dealer Portaal
            </Link>

            <div className="hidden md:flex space-x-4">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href

                return (
                  <Link key={item.href} href={item.href}>
                    <Button variant={isActive ? "default" : "ghost"} className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Button>
                  </Link>
                )
              })}
            </div>
          </div>

          <div className="flex items-center">
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </nav>
  )
}
