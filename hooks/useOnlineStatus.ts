"use client"

import { useEffect, useState } from "react"
import { DealerModel } from "@/models/dealerModel"

export function useOnlineStatus(userId: string) {
  const [onlineDealers, setOnlineDealers] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!userId) return

    // Update user's last login immediately
    DealerModel.updateLastLogin(userId)

    // Set up interval to update last login every minute
    const updateInterval = setInterval(() => {
      DealerModel.updateLastLogin(userId)
    }, 60000) // 1 minute

    // Set up interval to fetch online dealers every 30 seconds
    const fetchInterval = setInterval(async () => {
      try {
        const dealers = await DealerModel.getOnlineDealers()
        const onlineIds = new Set(dealers.map((d) => d.id))
        setOnlineDealers(onlineIds)
      } catch (error) {
        console.error("Failed to fetch online dealers:", error)
      }
    }, 30000) // 30 seconds

    // Initial fetch
    const fetchOnlineDealers = async () => {
      try {
        const dealers = await DealerModel.getOnlineDealers()
        const onlineIds = new Set(dealers.map((d) => d.id))
        setOnlineDealers(onlineIds)
      } catch (error) {
        console.error("Failed to fetch online dealers:", error)
      }
    }

    fetchOnlineDealers()

    return () => {
      clearInterval(updateInterval)
      clearInterval(fetchInterval)
    }
  }, [userId])

  const isOnline = (dealerId: string): boolean => {
    return onlineDealers.has(dealerId)
  }

  return { isOnline, onlineDealers }
}
