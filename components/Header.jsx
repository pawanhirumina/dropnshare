'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getCurrentUser } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Menu, Github } from 'lucide-react'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet'


export default function Header() {
    const pathname = usePathname()
    // eslint-disable-next-line no-unused-vars
    const [user, setUser] = useState(null)
    const [isOpen, setIsOpen] = useState(false)

    useEffect(() => {
        getCurrentUser().then(setUser)
    }, [])

    const navItems = [
        { href: '/', label: 'Upload' },
        { href: '/download', label: 'Download' },
        { href: '/pricing', label: 'Pricing' },
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

                {/* Mobile Sidebar */}
                <div className="md:hidden">
                    <Sheet open={isOpen} onOpenChange={setIsOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <Menu className="h-6 w-6" />
                                <span className="sr-only">Toggle menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left">
                            <SheetHeader>
                                <SheetTitle className="text-left font-bold text-xl bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
                                    Drop & Share
                                </SheetTitle>
                            </SheetHeader>
                            <div className="flex flex-col gap-4 mt-8">
                                {navItems.map((item) => (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setIsOpen(false)}
                                        className={`text-lg font-medium transition-colors hover:text-primary ${pathname === item.href
                                            ? 'text-primary'
                                            : 'text-muted-foreground'
                                            }`}
                                    >
                                        {item.label}
                                    </Link>
                                ))}
                                <Link
                                    href="https://github.com/pawanhirumina/drop-n-share"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-lg font-medium transition-colors hover:text-primary flex items-center gap-2"
                                >
                                    <Github className="h-5 w-5" />
                                    GitHub Repo
                                </Link>
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>

                <div className="hidden md:flex items-center gap-4">
                    <Button asChild variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
                        <Link href="https://github.com/pawanhirumina/drop-n-share" target="_blank" rel="noopener noreferrer">
                            <Github className="h-5 w-5" />
                            <span className="sr-only">GitHub Repository</span>
                        </Link>
                    </Button>
                    {user ? (
                        <Button asChild variant="outline">
                            <Link href="/account">Account</Link>
                        </Button>
                    ) : (
                        <Button asChild>
                            <Link href="/login">Login</Link>
                        </Button>
                    )}
                </div>
            </div>
        </header >
    )
}
