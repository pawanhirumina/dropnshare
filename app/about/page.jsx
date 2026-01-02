import Link from 'next/link'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Analytics } from "@vercel/analytics/next"
import { cn } from '@/lib/utils'

export default function AboutPage() {
    return (
        <div className="container py-12">
            <Analytics />
            <div className="max-w-3xl mx-auto space-y-8">
                <div className="text-center space-y-4">
                    <h1 className="text-3xl font-bold">Why I Built Drop & Share</h1>
                </div>

                <Card>
                    <CardContent className="p-8 space-y-6 text-lg leading-relaxed">
                        <p className='text-sm'>
                            I was in the middle of my IT Diploma when a simple problem hit me - I needed to send a file to a friend, but
                            we had no pen drives and most websites wanted us to sign up first. To make things worse, we couldn't even
                            zip a folder because the lab PCs were locked - no admin access.
                        </p>

                        <p className="text-muted-foreground italic text-md">
                            It felt silly that something so basic was made so hard.
                        </p>

                        <p className='text-sm'>
                            That moment sparked <strong>Drop & Share</strong>. A simple, no-login, no-hassle tool to upload and share files
                            instantly using just a 6-digit code. Built out of real need - for people like me and you.
                        </p>

                        <div className="border-t pt-6 mt-6">
                            <h2 className="text-2xl font-bold mb-4">Growing with You</h2>
                            <p className="mb-4 text-sm">
                                While the core mission remains the same—fast, anonymous sharing—we've evolved to offer more power when you need it:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-sm text-muted-foreground">
                                <li><strong>Guest Users:</strong> Still 100% free, no login required. Files last 24 hours.</li>
                                <li><strong>Free Account:</strong> Sign up to manage your files and keep them for 48 hours.</li>
                                <li><strong>Pro Plan:</strong> Upgrade to get permanent storage and support the project.</li>
                            </ul>
                        </div>

                        <div className="pt-6">
                            <Link
                                href="/"
                                className={cn(buttonVariants({ size: "lg" }))}
                            >
                                Upload Files
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
