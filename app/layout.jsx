import './globals.css'
import { Inter } from 'next/font/google'
import Header from '@/components/Header'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
    title: 'Drop & Share - File Sharing Made Simple',
    description: 'Share files instantly with a simple 6-digit code. No login required for free tier.',
}

export default function RootLayout({ children }) {
    return (
        <html lang="en" className="dark">
            <body className={inter.className}>
                <Header />
                <main className="min-h-screen pt-16">
                    {children}
                </main>
            </body>
        </html>
    )
}
