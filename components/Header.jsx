'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getCurrentUser } from '@/lib/auth'
import { Button } from '@/components/ui/button'


export default function Header() {
    const pathname = usePathname()
    const [user, setUser] = useState(null)

    useEffect(() => {
        getCurrentUser().then(setUser)
    }, [])

    const navItems = [
        { href: '/', label: 'Upload' },
        { href: '/download', label: 'Download' },
        // { href: '/pricing', label: 'Pricing' },
        { href: '/about', label: 'About' },
    ]

    return (
        <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center justify-between">
                <div className="flex items-center gap-6">
                    <Link href="/" className="flex items-center space-x-2">
                        <span className="text-xl font-bold bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
                            Drop & Share
                        </span>
                    </Link>
                    <nav className="hidden md:flex items-center gap-6">
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`text-sm font-medium transition-colors hover:text-primary ${pathname === item.href
                                        ? 'text-foreground'
                                        : 'text-muted-foreground'
                                    }`}
                            >
                                {item.label}
                            </Link>
                        ))}

                    </nav>
                </div>
                {/* #1 : Payment is not setup fix later */}
                {/* <div className="flex items-center gap-4">
                    {user ? (
                        <Button asChild variant="outline">
                            <Link href="/account">Account</Link>
                        </Button>
                    ) : (
                        <Button asChild>
                            <Link href="/login">Login</Link>
                        </Button>
                    )}
                </div> */}
            </div>
        </header>
    )
}
