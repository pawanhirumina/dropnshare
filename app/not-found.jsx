'use client'

import Link from 'next/link'
import { FileQuestion, Home, ArrowLeft } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export default function NotFound() {
    return (
        <div className="container flex items-center justify-center min-h-[calc(100vh-4rem)] py-12">
            <Card className="border-dashed border-2 bg-transparent max-w-2xl w-full">
                <CardContent className="py-20 text-center flex flex-col items-center">
                    {/* Icon Container */}
                    <div className="relative mb-8">
                        <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center animate-pulse">
                            <FileQuestion className="w-12 h-12 text-primary" />
                        </div>
                        {/* Decorative elements */}
                        <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary/20 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                        <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-primary/20 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                    </div>

                    {/* 404 Text */}
                    <div className="mb-4">
                        <h1 className="text-8xl font-black text-primary/20 tracking-tighter mb-2">
                            404
                        </h1>
                        <h2 className="text-2xl font-bold mb-3">Page Not Found</h2>
                    </div>

                    {/* Description */}
                    <p className="text-muted-foreground max-w-md mb-10 text-sm leading-relaxed">
                        Oops! The page you're looking for seems to have vanished into the digital void. 
                        Let's get you back on track.
                    </p>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                        <Link
                            href="/"
                            className={cn(
                                buttonVariants({ variant: "default", size: "lg" }),
                                "px-8 font-bold group"
                            )}
                        >
                            <Home className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                            Go Home
                        </Link>
                        <Button
                            variant="outline"
                            size="lg"
                            onClick={() => window.history.back()}
                            className="px-8 font-bold group"
                        >
                            <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
                            Go Back
                        </Button>
                    </div>

                    {/* Additional Help */}
                    <div className="mt-12 pt-8 border-t border-border/50 w-full max-w-md">
                        <p className="text-sm text-muted-foreground mb-4">
                            Need help? Check out these pages:
                        </p>
                        <div className="flex flex-wrap justify-center gap-3">
                            <Link
                                href="/about"
                                className="text-sm text-primary hover:underline font-medium"
                            >
                                About
                            </Link>
                            <span className="text-muted-foreground">•</span>
                            <Link
                                href="/pricing"
                                className="text-sm text-primary hover:underline font-medium"
                            >
                                Pricing
                            </Link>
                            <span className="text-muted-foreground">•</span>
                            <Link
                                href="/contact"
                                className="text-sm text-primary hover:underline font-medium"
                            >
                                Contact
                            </Link>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
