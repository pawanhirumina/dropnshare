'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, FileIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { getCurrentUser, getUserProfile, signOut } from '@/lib/auth'

export default function AccountPage() {
    const router = useRouter()
    const [user, setUser] = useState(null)
    const [profile, setProfile] = useState(null)
    const [files, setFiles] = useState([])
    const [loading, setLoading] = useState(true)

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
        <div className="container py-12">
            <div className="max-w-4xl mx-auto space-y-8">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-2xl">{user?.email}</CardTitle>
                            <div className="mt-2">
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${profile?.plan === 'pro'
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted text-muted-foreground'
                                    }`}>
                                    {profile?.plan === 'pro' ? 'Pro Plan' : 'Free Plan'}
                                </span>
                            </div>
                        </div>
                        <Button variant="outline" onClick={handleSignOut}>
                            Logout
                        </Button>
                    </CardHeader>
                </Card>

                <div>
                    <h2 className="text-2xl font-bold mb-4">My Uploads</h2>
                    {files.length === 0 ? (
                        <Card>
                            <CardContent className="py-12 text-center">
                                <p className="text-muted-foreground">No uploads yet. Start sharing!</p>
                                <Button asChild className="mt-4">
                                    <Link href="/">Upload Files</Link>
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-3">
                            {files.map((file) => (
                                <Card key={file.id}>
                                    <CardContent className="p-4 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <FileIcon className="w-5 h-5 text-muted-foreground" />
                                            <div>
                                                <p className="font-medium">{file.file_name}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {new Date(file.created_at).toLocaleDateString()} • Code: <span className="font-mono font-bold">{file.code}</span>
                                                </p>
                                            </div>
                                        </div>
                                        <Button asChild variant="outline" size="sm">
                                            <Link href={`/download?code=${file.code}`}>View</Link>
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>

                {profile?.plan !== 'pro' && (
                    <Card className="border-primary">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-bold text-lg">Upgrade to Pro</h3>
                                    <p className="text-sm text-muted-foreground">Get permanent storage for your files</p>
                                </div>
                                <Button asChild>
                                    <Link href="/pricing">Upgrade</Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}
