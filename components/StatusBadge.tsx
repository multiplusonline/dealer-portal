import { Badge } from "@/components/ui/badge"
import type { FileUpload } from "@/lib/types"

interface StatusBadgeProps {
  status: FileUpload["status"]
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const variants = {
    pending: "secondary",
    approved: "default",
    rejected: "destructive",
  } as const

  const colors = {
    pending: "bg-yellow-100 text-yellow-800",
    approved: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
  }

  return (
    <Badge variant={variants[status]} className={colors[status]}>
      {status}
    </Badge>
  )
}
