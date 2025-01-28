"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function RFIDCheckIn() {
  const [checkInStatus, setCheckInStatus] = useState<"idle" | "success" | "error">("idle")

  useEffect(() => {
    if (checkInStatus !== "idle") {
      const timer = setTimeout(() => setCheckInStatus("idle"), 3000)
      return () => clearTimeout(timer)
    }
  }, [checkInStatus])

  const handleCheckIn = () => {
    // Simulate RFID scan
    setCheckInStatus(Math.random() > 0.2 ? "success" : "error")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>RFID Meal Check-In</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center space-y-4">
        <div
          className={`w-32 h-32 rounded-full flex items-center justify-center text-4xl
          ${checkInStatus === "idle" ? "bg-gray-200 dark:bg-gray-700" : ""}
          ${checkInStatus === "success" ? "bg-green-200 dark:bg-green-700" : ""}
          ${checkInStatus === "error" ? "bg-red-200 dark:bg-red-700" : ""}
        `}
        >
          {checkInStatus === "idle" && "🍽️"}
          {checkInStatus === "success" && "✅"}
          {checkInStatus === "error" && "❌"}
        </div>
        <Button onClick={handleCheckIn} disabled={checkInStatus !== "idle"}>
          Simulate RFID Scan
        </Button>
        {checkInStatus === "success" && <p className="text-green-600 dark:text-green-400">Check-in successful!</p>}
        {checkInStatus === "error" && (
          <p className="text-red-600 dark:text-red-400">Check-in failed. Please try again.</p>
        )}
      </CardContent>
    </Card>
  )
}

