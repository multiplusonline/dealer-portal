"use client"

import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Globe } from "lucide-react"

export function LanguageSwitcher() {
  const { i18n } = useTranslation()
  const [currentLang, setCurrentLang] = useState<string>("nl")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (i18n.language) {
      setCurrentLang(i18n.language)
    }
  }, [i18n.language])

  const toggleLanguage = () => {
    const newLang = currentLang === "nl" ? "en" : "nl"
    i18n.changeLanguage(newLang)
    setCurrentLang(newLang)
  }

  if (!mounted) {
    return (
      <Button variant="outline" size="sm" className="flex items-center gap-2 bg-transparent">
        <Globe className="h-4 w-4" />
        NL
      </Button>
    )
  }

  return (
    <Button variant="outline" size="sm" onClick={toggleLanguage} className="flex items-center gap-2 bg-transparent">
      <Globe className="h-4 w-4" />
      {currentLang?.toUpperCase() || "NL"}
    </Button>
  )
}
