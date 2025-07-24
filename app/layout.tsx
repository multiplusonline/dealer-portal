import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Navigation } from "@/components/Navigation"
import { I18nProvider } from "@/components/I18nProvider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Dealer Portaal",
  description: "Modern dealer management platform",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="nl">
      <body className={inter.className}>
        <I18nProvider>
          <Navigation />
          <main className="min-h-screen bg-gray-50">{children}</main>
        </I18nProvider>
      </body>
    </html>
  )
}
