'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import JSZip from 'jszip'
import { Upload, X, FileIcon, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/auth'

const CODE_LENGTH = 6

export default function UploadPage() {
    const router = useRouter()
    const [user, setUser] = useState(null)
    const [files, setFiles] = useState([])
    const [uploading, setUploading] = useState(false)
    const [progress, setProgress] = useState(0)
    const [uploadCode, setUploadCode] = useState(null)
    const [dragActive, setDragActive] = useState(false)
    const [expiration, setExpiration] = useState('forever')

    useEffect(() => {
        getCurrentUser().then(setUser)
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
        const maxSize = 50 * 1024 * 1024 // 50MB for everyone

        const validFiles = newFiles.filter(file => {
            if (file.size > maxSize) {
                alert(`${file.name} exceeds 50MB limit.`)
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
            // Create ZIP
            const zip = new JSZip()
            files.forEach(file => zip.file(file.name, file))

            const zipBlob = await zip.generateAsync(
                { type: 'blob', compression: 'DEFLATE' },
                (metadata) => setProgress(Math.round(metadata.percent / 2))
            )

            setProgress(50)

            // Generate unique code
            let code
            let isUnique = false
            let attempts = 0

            while (!isUnique && attempts < 5) {
                code = generateCode()
                attempts++
                const { data } = await supabase
                    .from('shared_files')
                    .select('code')
                    .eq('code', code)
                    .maybeSingle()
                if (!data) isUnique = true
            }

            if (!isUnique) throw new Error('Could not generate unique code')

            // Upload to Supabase
            const timestamp = Date.now()
            const fileName = `bundle_${timestamp}_${Math.random().toString(36).substring(2, 8)}.zip`
            const bucketName = user ? 'shared-files-private' : 'shared-files-public'

            const { error: uploadError } = await supabase.storage
                .from(bucketName)
                .upload(fileName, zipBlob, {
                    contentType: 'application/zip',
                })

            if (uploadError) throw uploadError

            setProgress(75)

            // Calculate expiration
            let expiresAt = null // Default null (Forever)

            if (!user) {
                // Free users always 24h
                expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
            } else if (expiration !== 'forever') {
                // Pro user selection
                const hours = parseInt(expiration)
                expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString()
            }

            // Save to database
            const { error: dbError } = await supabase
                .from('shared_files')
                .insert({
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
            alert('Upload failed: ' + error.message)
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
                            <div className="flex gap-2">
                                <Button
                                    className="flex-1"
                                    onClick={() => {
                                        navigator.clipboard.writeText(uploadCode)
                                        alert('Code copied!')
                                    }}
                                >
                                    Copy Code
                                </Button>
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => setUploadCode(null)}
                                >
                                    Upload More
                                </Button>
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
                    className={`relative border-2 border-dashed rounded-lg p-12 text-center transition-colors ${dragActive ? 'border-primary bg-primary/5' : 'border-border'
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
                    <div className="space-y-4">
                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                            <Upload className="w-8 h-8 text-primary" />
                        </div>
                        <div>
                            <p className="text-lg font-medium">Drop files here or click to upload</p>
                            <p className="text-sm text-muted-foreground mt-1">
                                {user ? 'Pro: Files kept forever (or valid until expiry)' : 'Free: Files expire in 24h'}
                            </p>

                        </div>
                    </div>
                </div>

                {user && (
                    <div className="flex justify-center mt-6 mb-2">
                        <div className="flex items-center gap-2 bg-muted/50 p-2 rounded-lg border border-border">
                            <label className="text-sm text-muted-foreground">Keep files for:</label>
                            <select
                                className="bg-background border border-border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                                value={expiration}
                                onChange={(e) => setExpiration(e.target.value)}
                            >
                                <option value="24">1 Day</option>
                                <option value="168">7 Days</option>
                                <option value="720">30 Days</option>
                                <option value="forever">Forever</option>
                            </select>
                        </div>
                    </div>
                )}

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
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeFile(index)}
                                            disabled={uploading}
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>

                            {uploading && (
                                <div className="mt-4 space-y-2">
                                    <div className="w-full bg-muted rounded-full h-2">
                                        <div
                                            className="bg-primary h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                    <p className="text-sm text-center text-muted-foreground">{progress}%</p>
                                </div>
                            )}

                            <Button
                                className="w-full mt-4"
                                onClick={handleUpload}
                                disabled={uploading}
                            >
                                {uploading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Uploading...
                                    </>
                                ) : (
                                    'Upload All Files'
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}
