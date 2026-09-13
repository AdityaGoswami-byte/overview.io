import { cn } from "@/lib/utils"
import React from "react"

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("bg-white/80 backdrop-blur-2xl border border-gray-200/60 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)]", className)} {...props} />
  )
}
