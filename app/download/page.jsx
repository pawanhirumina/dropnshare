'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Download, Loader2, Clock, Infinity } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase'

function DownloadContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [code, setCode] = useState(searchParams.get('code') || '')
    const [loading, setLoading] = useState(false)
    const [fileData, setFileData] = useState(null)
    const [timeLeft, setTimeLeft] = useState(null)

    const handleSearch = async () => {
        if (code.length !== 6) {
            alert('Please enter a valid 6-digit code')
            return
        }

        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('shared_files')
                .select('*')
                .eq('code', code.toUpperCase())
                .maybeSingle()

            if (error || !data) {
                alert('File not found. Check your code.')
                setLoading(false)
                return
            }

            // Check expiry
            if (data.expires_at) {
                const expiresAt = new Date(data.expires_at)
                const now = new Date()

                if (expiresAt < now) {
                    alert('This file has expired.')
                    setLoading(false)
                    return
                }

                // Calculate time left
                const diffMs = expiresAt - now
                const hours = Math.floor(diffMs / (1000 * 60 * 60))
                const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
                const days = Math.floor(hours / 24)

                setTimeLeft({ days, hours: hours % 24, minutes, isPermanent: false })
            } else {
                setTimeLeft({ isPermanent: true })
            }

            setFileData(data)
        } catch (err) {
            console.error(err)
            alert('Something went wrong.')
        } finally {
            setLoading(false)
        }
    }

    const handleDownload = async () => {
        if (!fileData) return

        const bucketName = fileData.bucket_id || 'shared-files-public'

        const { data: { publicUrl } } = supabase.storage
            .from(bucketName)
            .getPublicUrl(fileData.file_path)

        const fileName = fileData.file_name || 'download.zip'
        const downloadUrl = `${publicUrl}?download=${encodeURIComponent(fileName)}`

        const a = document.createElement('a')
        a.href = downloadUrl
        a.download = fileName
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
    }

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
    }

    return (
        <div className="container flex items-center justify-center min-h-[calc(100vh-4rem)]">
            <Card className="w-full max-w-md">
                <CardContent className="pt-6 space-y-6">
                    <div className="text-center space-y-2">
                        <h1 className="text-3xl font-bold">Download File</h1>
                        <p className="text-muted-foreground">
                            Enter the 6-digit code to access your file
                        </p>
                    </div>

                    <div className="space-y-4">
                        <Input
                            type="text"
                            placeholder="ABCDEF"
                            value={code}
                            onChange={(e) => setCode(e.target.value.toUpperCase())}
                            maxLength={6}
                            className="text-center text-2xl font-mono tracking-widest"
                        />
                        <Button
                            className="w-full"
                            onClick={handleSearch}
                            disabled={loading || code.length !== 6}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Searching...
                                </>
                            ) : (
                                'Get File'
                            )}
                        </Button>
                    </div>

                    {fileData && (
                        <div className="space-y-4 pt-4 border-t">
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Name:</span>
                                    <span className="font-medium">{fileData.file_name}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Size:</span>
                                    <span className="font-medium">{formatFileSize(fileData.file_size)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Expires:</span>
                                    <span className="font-medium flex items-center gap-1">
                                        {timeLeft?.isPermanent ? (
                                            <>
                                                <Infinity className="w-4 h-4" />
                                                Permanent
                                            </>
                                        ) : (
                                            <>
                                                <Clock className="w-4 h-4" />
                                                {timeLeft?.days > 0 && `${timeLeft.days}d `}
                                                {timeLeft?.hours}h {timeLeft?.minutes}m
                                            </>
                                        )}
                                    </span>
                                </div>
                            </div>
                            <Button className="w-full" onClick={handleDownload}>
                                <Download className="w-4 h-4 mr-2" />
                                Download Now
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

export default function DownloadPage() {
    return (
        <Suspense fallback={
            <div className="container flex items-center justify-center min-h-[calc(100vh-4rem)]">
                <Loader2 className="w-8 h-8 animate-spin" />
            </div>
        }>
            <DownloadContent />
        </Suspense>
    )
}
