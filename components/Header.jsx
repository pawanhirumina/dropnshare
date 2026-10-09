'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getCurrentUser } from '@/lib/auth'
import { Button, buttonVariants } from '@/components/ui/button'
import { Menu, Github, Sun, Moon, User } from 'lucide-react'
import { useTheme } from "next-themes"
import { cn } from '@/lib/utils'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet'
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar"


export default function Header() {
    const pathname = usePathname()
    const [user, setUser] = useState(null)
    const [isOpen, setIsOpen] = useState(false)
    const { setTheme, theme } = useTheme()

    useEffect(() => {
        getCurrentUser().then(setUser)
    }, [])

    const navItems = [
        { href: '/', label: 'Upload' },
        { href: '/download', label: 'Download' },
        { href: '/about', label: 'About' },
    ]

    return (
        <header className="fixed top-0 left-0 right-0 z-50  bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container relative flex h-16 items-center justify-between">
                <div className="flex items-center">
                    <Link href="/" className="flex items-center space-x-2">
                        <span className="text-xl font-bold bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
                            Drop & Share
                        </span>
                    </Link>
                </div>

                <nav className="hidden md:flex items-center gap-6 absolute left-1/2 -translate-x-1/2">
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

                <div className="md:hidden">
                    <Sheet open={isOpen} onOpenChange={setIsOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <Menu className="h-6 w-6" />
                                <span className="sr-only">Toggle menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="flex flex-col h-full w-[280px] p-0">
                            <SheetHeader className="px-6 pt-6 pb-4 border-b">
                                <SheetTitle className="text-left font-bold text-lg bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
                                    Drop & Share
                                </SheetTitle>
                            </SheetHeader>
                            <div className="flex-1 flex flex-col gap-1 px-4 py-4 overflow-y-auto">
                                {navItems.map((item) => (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setIsOpen(false)}
                                        className={`text-sm font-medium transition-colors hover:text-primary px-3 py-2.5 rounded-md hover:bg-muted/50 ${pathname === item.href
                                            ? 'text-primary bg-muted/50'
                                            : 'text-muted-foreground'
                                            }`}
                                    >
                                        {item.label}
                                    </Link>
                                ))}
                                <div className="h-px bg-border my-2" />
                                <Link
                                    href="https://github.com/pawanhirumina/dropnshare"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm font-medium transition-colors hover:text-primary flex items-center gap-2.5 text-muted-foreground px-3 py-2.5 rounded-md hover:bg-muted/50"
                                >
                                    <Github className="h-4 w-4" />
                                    GitHub Repo
                                </Link>
                                <button
                                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                                    className="text-sm font-medium transition-colors hover:text-primary flex items-center gap-2.5 text-muted-foreground text-left px-3 py-2.5 rounded-md hover:bg-muted/50"
                                >
                                    <div className="relative w-4 h-4 flex items-center justify-center">
                                        <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 absolute" />
                                        <Moon className="h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 absolute" />
                                    </div>
                                    Switch Theme
                                </button>
                            </div>

                            <div className="mt-auto border-t px-4 py-3">
                                {user ? (
                                    <Link
                                        href="/account"
                                        onClick={() => setIsOpen(false)}
                                        className="flex items-center gap-2.5 p-2 rounded-md hover:bg-muted/50 transition-colors"
                                    >
                                        <Avatar className="h-8 w-8 border border-border">
                                            <AvatarImage src={user.user_metadata?.avatar_url} />
                                            <AvatarFallback className="text-xs">{user.email?.charAt(0).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col min-w-0 flex-1">
                                            <span className="font-medium text-xs">Account</span>
                                            <span className="text-[10px] text-muted-foreground truncate">{user.email}</span>
                                        </div>
                                    </Link>
                                ) : (
                                    <Link
                                        href="/login"
                                        onClick={() => setIsOpen(false)}
                                        className={cn(buttonVariants({ variant: "default", size: "sm" }), "w-full justify-center")}
                                    >
                                        Login
                                    </Link>
                                )}
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>

                <div className="hidden md:flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                        className="text-muted-foreground hover:text-primary"
                    >
                        <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 absolute" />
                        <Moon className="h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 absolute" />
                        <span className="sr-only">Toggle theme</span>
                    </Button>
                    <Link
                        href="https://github.com/pawanhirumina/dropnshare"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "text-muted-foreground hover:text-primary")}
                    >
                        <Github className="h-5 w-5" />
                        <span className="sr-only">GitHub Repository</span>
                    </Link>
                    {user ? (
                        <Link
                            href="/account"
                            className="flex items-center justify-center transition-opacity hover:opacity-80"
                        >
                            <Avatar className="h-8 w-8 border border-border/50">
                                <AvatarImage src={user.user_metadata?.avatar_url} />
                                <AvatarFallback className="text-xs">{user.email?.charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                        </Link>
                    ) : (
                        <Link
                            href="/login"
                            className={cn(buttonVariants({ variant: "default", size: "sm" }))}
                        >
                            Login
                        </Link>
                    )}
                </div>
            </div>
        </header >
    )
}
