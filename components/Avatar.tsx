"use client"

import { useState } from "react"
import { User } from "lucide-react"

interface AvatarProps {
  src?: string
  alt: string
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
}

const sizeClasses = {
  sm: "w-8 h-8",
  md: "w-10 h-10",
  lg: "w-12 h-12",
  xl: "w-16 h-16",
}

export function Avatar({ src, alt, size = "md", className = "" }: AvatarProps) {
  const [imageError, setImageError] = useState(false)

  const handleImageError = () => {
    setImageError(true)
  }

  return (
    <div
      className={`${sizeClasses[size]} rounded-full overflow-hidden bg-gray-200 flex items-center justify-center ${className}`}
    >
      {src && !imageError ? (
        <img
          src={src || "/placeholder.svg"}
          alt={alt}
          className="w-full h-full object-cover"
          onError={handleImageError}
        />
      ) : (
        <User
          className={`${size === "sm" ? "w-4 h-4" : size === "md" ? "w-5 h-5" : size === "lg" ? "w-6 h-6" : "w-8 h-8"} text-gray-400`}
        />
      )}
    </div>
  )
}
