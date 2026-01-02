'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import JSZip from 'jszip'
import { Upload, X, FileIcon, Loader2, Link as LinkIcon, Settings2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { getCurrentUser, getUserProfile } from '@/lib/auth'
import { Analytics } from "@vercel/analytics/next"
import { toast } from 'sonner'

const CODE_LENGTH = 6

export default function UploadPage() {
    const router = useRouter()
    const [user, setUser] = useState(null)
    const [profile, setProfile] = useState(null)
    const [files, setFiles] = useState([])
    const [uploading, setUploading] = useState(false)
    const [progress, setProgress] = useState(0)
    const [uploadCode, setUploadCode] = useState(null)
    const [dragActive, setDragActive] = useState(false)
    const [expiration, setExpiration] = useState('forever')

    useEffect(() => {
        const loadUser = async () => {
            const currentUser = await getCurrentUser()
            setUser(currentUser)
            if (currentUser) {
                const userProfile = await getUserProfile(currentUser.id)
                setProfile(userProfile)
            }
        }
        loadUser()
    }, [])

    const handleDrag = (e) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true)
        } else if (e.type === "dragleave") {
            setDragActive(false)
        }
    }

    const handleDrop = (e) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFiles(Array.from(e.dataTransfer.files))
        }
    }

    const handleChange = (e) => {
        e.preventDefault()
        if (e.target.files && e.target.files[0]) {
            handleFiles(Array.from(e.target.files))
        }
    }

    const handleFiles = (newFiles) => {
        const maxSize = 50 * 1024 * 1024
        const validFiles = newFiles.filter(file => {
            if (file.size > maxSize) {
                toast.error("File too large", { description: `${file.name} exceeds 50MB limit.` })
                return false
            }
            return true
        })
        setFiles(prev => [...prev, ...validFiles])
    }

    const removeFile = (index) => {
        setFiles(prev => prev.filter((_, i) => i !== index))
    }

    const generateCode = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
        let code = ''
        for (let i = 0; i < CODE_LENGTH; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length))
        }
        return code
    }

    const handleUpload = async () => {
        if (files.length === 0) return
        setUploading(true)
        setProgress(0)
        try {
            const zip = new JSZip()
            files.forEach(file => zip.file(file.name, file))
            const zipBlob = await zip.generateAsync(
                { type: 'blob', compression: 'DEFLATE' },
                (metadata) => setProgress(Math.round(metadata.percent / 2))
            )
            setProgress(50)

            let code
            let isUnique = false
            let attempts = 0
            while (!isUnique && attempts < 5) {
                code = generateCode()
                attempts++
                const { data } = await supabase.from('shared_files').select('code').eq('code', code).maybeSingle()
                if (!data) isUnique = true
            }
            if (!isUnique) throw new Error('Could not generate unique code')

            const timestamp = Date.now()
            const fileName = `bundle_${timestamp}_${Math.random().toString(36).substring(2, 8)}.zip`
            const bucketName = user ? 'shared-files-private' : 'shared-files-public'

            const { error: uploadError } = await supabase.storage.from(bucketName).upload(fileName, zipBlob, { contentType: 'application/zip' })
            if (uploadError) throw uploadError
            setProgress(75)

            let expiresAt = null
            if (!user) {
                expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
            } else {
                if (profile?.plan === 'pro') {
                    if (expiration !== 'forever') {
                        const hours = parseInt(expiration)
                        expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString()
                    }
                } else {
                    expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
                }
            }

            const { error: dbError } = await supabase.from('shared_files').insert({
                code,
                file_name: `Dropnshare-${timestamp}.zip`,
                file_path: fileName,
                file_size: zipBlob.size,
                user_id: user?.id || null,
                bucket_id: bucketName,
                expires_at: expiresAt
            })
            if (dbError) throw dbError

            setProgress(100)
            setUploadCode(code)
            setFiles([])
        } catch (error) {
            console.error('Upload error:', error)
            toast.error("Upload failed", { description: error.message })
        } finally {
            setUploading(false)
        }
    }

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
    }

    if (uploadCode) {
        return (
            <div className="container flex items-center justify-center min-h-[calc(100vh-4rem)]">
                <Analytics />
                <Card className="w-full max-w-md">
                    <CardContent className="pt-6">
                        <div className="text-center space-y-4">
                            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                                <Upload className="w-8 h-8 text-primary" />
                            </div>
                            <h2 className="text-2xl font-bold">Upload Complete!</h2>
                            <div className="bg-muted p-6 rounded-lg">
                                <p className="text-sm text-muted-foreground mb-2">Share this code:</p>
                                <p className="text-4xl font-mono font-bold tracking-wider">{uploadCode}</p>
                            </div>
                            <div className="flex flex-col gap-2">
                                <Button
                                    className="w-full"
                                    onClick={() => {
                                        const link = `${window.location.origin}/download?code=${uploadCode}`
                                        navigator.clipboard.writeText(link)
                                        toast.success("Link copied")
                                    }}
                                >
                                    <LinkIcon className="w-4 h-4 mr-2" />
                                    Copy Share Link
                                </Button>
                                <div className="flex gap-2">
                                    <Button variant="outline" className="flex-1" onClick={() => {
                                        navigator.clipboard.writeText(uploadCode)
                                        toast.success("Code copied")
                                    }}>Copy Code</Button>
                                    <Button variant="outline" className="flex-1" onClick={() => setUploadCode(null)}>Upload More</Button>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="container py-12">
            <div className="max-w-3xl mx-auto space-y-8">
                <div className="text-center space-y-2">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
                        Drop & Share
                    </h1>
                    <p className="text-muted-foreground">
                        Drag & drop your files below or click to upload. Share with a simple 6-digit code.
                    </p>
                </div>

                <div
                    className={`relative border-2 border-dashed rounded-lg p-16 text-center transition-colors ${dragActive ? 'border-primary bg-primary/5' : 'border-border'
                        }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                >
                    <input
                        type="file"
                        multiple
                        onChange={handleChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />

                    {/* Top Right Control for Pro Users */}
                    {user && profile?.plan === 'pro' && (
                        <div className="absolute top-4 right-4 z-10">
                            <div
                                className="flex items-center gap-2 bg-background border border-border px-3 py-1.5 rounded-md shadow-sm hover:border-primary/50 transition-colors pointer-events-auto group"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                    <Settings2 className="w-3.5 h-3.5" />
                                    <span className="text-[10px] font-bold uppercase tracking-wider">Expiry:</span>
                                </div>
                                <select
                                    className="bg-transparent border-none text-xs font-bold focus:ring-0 cursor-pointer appearance-none pr-4 outline-none"
                                    value={expiration}
                                    onChange={(e) => setExpiration(e.target.value)}
                                    style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'currentColor\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\' /%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right center', backgroundSize: '12px' }}
                                >
                                    <option value="24">24h</option>
                                    <option value="168">7d</option>
                                    <option value="720">30d</option>
                                    <option value="forever">Forever</option>
                                </select>
                            </div>
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                            <Upload className="w-8 h-8 text-primary" />
                        </div>
                        <div>
                            <p className="text-lg font-medium">Drop files here or click to upload</p>
                            <p className="text-sm text-muted-foreground mt-1">
                                {!user && 'Free: Files expire in 24h'}
                                {user && profile?.plan !== 'pro' && 'Free Account: Files expire in 48h'}
                                {user && profile?.plan === 'pro' && 'Pro: Custom expiration enabled'}
                            </p>
                        </div>
                    </div>
                </div>

                {files.length > 0 && (
                    <Card>
                        <CardContent className="p-6">
                            <div className="space-y-2">
                                {files.map((file, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <FileIcon className="w-5 h-5 text-muted-foreground" />
                                            <div>
                                                <p className="text-sm font-medium">{file.name}</p>
                                                <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="icon" onClick={() => removeFile(index)} disabled={uploading}>
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                            {uploading && (
                                <div className="mt-4 space-y-2">
                                    <div className="w-full bg-muted rounded-full h-2">
                                        <div className="bg-primary h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
                                    </div>
                                    <p className="text-sm text-center text-muted-foreground">{progress}%</p>
                                </div>
                            )}
                            <Button className="w-full mt-4" onClick={handleUpload} disabled={uploading}>
                                {uploading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Uploading...</> : 'Upload All Files'}
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}
