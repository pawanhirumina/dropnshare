"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

function Select({ children, ...props }) {
  return (
    <div className="relative">
      <select
        className={cn(
          "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
          props.className
        )}
        {...props}
      >
        {children}
      </select>
    </div>
  )
}

function SelectGroup({ children, ...props }) {
  return <optgroup {...props}>{children}</optgroup>
}

function SelectValue({ placeholder, ...props }) {
  return null // Native select doesn't use this the same way
}

function SelectTrigger({ children, ...props }) {
  return children
}

function SelectContent({ children, ...props }) {
  return children
}

function SelectLabel({ children, ...props }) {
  return <option disabled {...props}>{children}</option>
}

function SelectItem({ children, ...props }) {
  return <option {...props}>{children}</option>
}

function SelectSeparator() {
  return <hr className="my-1 border-muted" />
}

function SelectScrollUpButton() { return null }
function SelectScrollDownButton() { return null }

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
}
