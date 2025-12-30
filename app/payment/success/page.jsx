'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle } from 'lucide-react';

function SuccessContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const status = searchParams.get('status');
    const [isValid, setIsValid] = useState(null);

    useEffect(() => {
        if (status === 'succeeded') {
            setIsValid(true);
        } else {
            setIsValid(false);
        }
    }, [status]);

    if (isValid === null) return null; // Loading state

    if (!isValid) {
        return (
            <div className="container flex flex-col items-center justify-center min-h-[60vh] py-12 space-y-8 text-center bg-background text-foreground">
                <div className="flex flex-col items-center space-y-4">
                    <XCircle className="w-20 h-20 text-red-500 animate-in zoom-in duration-500" />
                    <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl">Payment Failed or Cancelled</h1>
                    <p className="text-xl text-muted-foreground max-w-[600px]">
                        It seems the payment didn't go through. If you think this is a mistake, please try again.
                    </p>
                </div>

                <div className="flex gap-4">
                    <Button size="lg" onClick={() => router.push('/pricing')}>
                        Try Again
                    </Button>
                    <Button size="lg" variant="outline" onClick={() => router.push('/')}>
                        Go Home
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="container flex flex-col items-center justify-center min-h-[60vh] py-12 space-y-8 text-center bg-background text-foreground">
            <div className="flex flex-col items-center space-y-4">
                <CheckCircle2 className="w-20 h-20 text-green-500 animate-in zoom-in duration-500" />
                <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl">Payment Successful!</h1>
                <p className="text-xl text-muted-foreground max-w-[600px]">
                    Thank you for upgrading to Pro. Your account has been updated with premium features.
                </p>
            </div>

            <div className="flex gap-4">
                <Button size="lg" onClick={() => router.push('/')}>
                    Go to Dashboard
                </Button>
                <Button size="lg" variant="outline" onClick={() => router.push('/account')}>
                    View Account
                </Button>
            </div>
        </div>
    );
}

export default function PaymentSuccessPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <SuccessContent />
        </Suspense>
    );
}
