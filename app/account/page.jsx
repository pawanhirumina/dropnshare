'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, FileIcon, Copy, ExternalLink, Calendar, HardDrive, Trash2 } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { getCurrentUser, getUserProfile, signOut } from '@/lib/auth'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

export default function AccountPage() {
    const router = useRouter()
    const [user, setUser] = useState(null)
    const [profile, setProfile] = useState(null)
    const [files, setFiles] = useState([])
    const [loading, setLoading] = useState(true)
    const [deletingId, setDeletingId] = useState(null)
    const [fileToDelete, setFileToDelete] = useState(null)

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        const currentUser = await getCurrentUser()
        if (!currentUser) {
            router.push('/login')
            return
        }

        setUser(currentUser)
        const userProfile = await getUserProfile(currentUser.id)
        setProfile(userProfile)

        const { data: userFiles } = await supabase
            .from('shared_files')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false })

        setFiles(userFiles || [])
        setLoading(false)
    }

    const formatFileSize = (bytes) => {
        if (!bytes) return '0 Bytes'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
    }

    const copyLink = (code) => {
        const link = `${window.location.origin}/download?code=${code}`
        navigator.clipboard.writeText(link)
        toast.success("Link copied", {
            description: "Shareable link is ready to paste."
        })
    }

    const handleDelete = async () => {
        if (!fileToDelete) return
        const file = fileToDelete
        setFileToDelete(null)
        setDeletingId(file.id)

        try {
            // 1. Delete from Database first
            const { error: dbError } = await supabase
                .from('shared_files')
                .delete()
                .match({ id: file.id, user_id: user.id })

            if (dbError) throw new Error(dbError.message)

            // 2. Cleanup Storage (best-effort)
            if (file.bucket_id && file.file_path) {
                const { error: storageError } = await supabase.storage
                    .from(file.bucket_id)
                    .remove([file.file_path])

                if (storageError) {
                    console.warn('Storage cleanup failed:', storageError)
                }
            }

            // 3. Update State
            setFiles(prev => prev.filter(f => f.id !== file.id))
            toast.success("File deleted successfully")
        } catch (error) {
            console.error('Delete error:', error)
            toast.error("Delete failed", {
                description: error.message || "You might not have permission to delete this file."
            })
        } finally {
            setDeletingId(null)
        }
    }

    const handleSignOut = async () => {
        await signOut()
        router.push('/')
    }

    if (loading) {
        return (
            <div className="container flex items-center justify-center min-h-[calc(100vh-4rem)]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="container py-12 text-foreground">
            <div className="max-w-4xl mx-auto space-y-8">
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-2xl font-bold">{user?.email}</CardTitle>
                            <div className="mt-2">
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase ${profile?.plan === 'pro'
                                    ? 'bg-primary/10 text-primary border border-primary/20'
                                    : 'bg-muted text-muted-foreground border border-border/50'
                                    }`}>
                                    {profile?.plan === 'pro' ? 'Pro Plan' : 'Free Plan'}
                                </span>
                            </div>
                        </div>
                        <Button variant="outline" size="sm" onClick={handleSignOut} className="hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition-colors">
                            Logout
                        </Button>
                    </CardHeader>
                </Card>

                <div>
                    <div className="flex items-center justify-between mb-6 px-1">
                        <h2 className="text-2xl font-bold">My Uploads</h2>
                        <span className="text-sm text-muted-foreground bg-muted/50 px-3 py-1 rounded-full border border-border/50">
                            {files.length} {files.length === 1 ? 'file' : 'files'}
                        </span>
                    </div>

                    {files.length === 0 ? (
                        <Card className="border-dashed border-2 bg-transparent">
                            <CardContent className="py-20 text-center flex flex-col items-center">
                                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                                    <FileIcon className="w-8 h-8 text-muted-foreground/40" />
                                </div>
                                <h3 className="text-xl font-semibold mb-2">No files yet</h3>
                                <p className="text-muted-foreground max-w-sm mb-8">
                                    Your sharing history will appear here once you start uploading files.
                                </p>
                                <Link
                                    href="/"
                                    className={cn(buttonVariants({ variant: "default" }), "px-8")}
                                >
                                    Upload Now
                                </Link>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-4">
                            {files.map((file) => (
                                <div
                                    key={file.id}
                                    className="group relative flex items-center justify-between p-5 bg-card/40 hover:bg-card/60 border border-border/50 hover:border-primary/30 rounded-2xl transition-all duration-300"
                                >
                                    <div className="flex items-center gap-5 overflow-hidden">
                                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                                            <FileIcon className="w-6 h-6 text-primary" />
                                        </div>
                                        <div className="min-w-0 pr-4">
                                            <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                                                <p className="font-bold truncate text-base md:text-lg tracking-tight">{file.file_name}</p>
                                                <div className="px-2 py-0.5 rounded-md text-[10px] font-black bg-primary/10 text-primary border border-primary/20 uppercase tracking-widest">
                                                    {file.code}
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
                                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                                                    <Calendar className="w-3.5 h-3.5 opacity-70" />
                                                    {new Date(file.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                                                    <HardDrive className="w-3.5 h-3.5 opacity-70" />
                                                    {formatFileSize(file.file_size)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0">
                                        <div className="flex items-center gap-1 bg-muted/30 p-1 rounded-lg border border-border/30 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-background"
                                                onClick={() => copyLink(file.code)}
                                                title="Copy Link"
                                            >
                                                <Copy className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                onClick={() => setFileToDelete(file)}
                                                disabled={deletingId === file.id}
                                                title="Delete File"
                                            >
                                                {deletingId === file.id ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <Trash2 className="w-4 h-4" />
                                                )}
                                            </Button>
                                        </div>
                                        <Link
                                            href={`/download?code=${file.code}`}
                                            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "px-5 font-bold bg-background/50 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-300 rounded-xl")}
                                        >
                                            <ExternalLink className="w-4 h-4 mr-2" />
                                            View
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {profile?.plan !== 'pro' && (
                    <Card className="border-primary/50 bg-primary/5 border-2 rounded-2xl overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-8 opacity-5">
                            <Upload className="w-24 h-24 text-primary" />
                        </div>
                        <CardContent className="p-8">
                            <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                                <div>
                                    <h3 className="font-black text-2xl mb-1 tracking-tight">Level up to Pro</h3>
                                    <p className="text-muted-foreground font-medium">Get permanent storage and higher limits for your files.</p>
                                </div>
                                <Link
                                    href="/pricing"
                                    className={cn(buttonVariants({ variant: "default", size: "lg" }), "px-10 font-black tracking-wide transition-all hover:scale-105 active:scale-95")}
                                >
                                    Upgrade Now
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                )}

                <Dialog open={!!fileToDelete} onOpenChange={(open) => !open && setFileToDelete(null)}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Delete File</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to delete <span className="font-semibold text-foreground">{fileToDelete?.file_name}</span>? This action cannot be undone.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button
                                variant="outline"
                                onClick={() => setFileToDelete(null)}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleDelete}
                                className="bg-destructive hover:bg-destructive/90"
                            >
                                Delete Permanently
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    )
}

function Upload(props) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" x2="12" y1="3" y2="15" />
        </svg>
    )
}
