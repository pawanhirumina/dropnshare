'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Check, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/auth'

export default function PricingPage() {
    const router = useRouter()
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        getCurrentUser().then(setUser)
    }, [])

    const handleUpgrade = async () => {
        if (!user) {
            router.push('/login?redirect=pricing')
            return
        }

        setLoading(true)

        try {
            const response = await fetch('/api/payment/create', {
                method: 'POST',
            });

            const data = await response.json();

            if (data.url) {
                window.location.href = data.url;
            } else {
                alert('Error creating payment session: ' + (data.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Payment error:', error);
            alert('Failed to initiate payment.');
        }

        setLoading(false)
    }

    const plans = [
        {
            name: 'Free',
            price: '$0',
            period: 'forever',
            features: [
                { text: '50MB Upload Limit', included: true },
                { text: '24-Hour Storage', included: true },
                { text: '6-Digit Share Codes', included: true },
                { text: 'No Account Required', included: false },
            ],
            cta: 'Get Started',
            onClick: () => router.push('/'),
        },
        {
            name: 'Pro',
            price: '$3',
            period: 'one-time',
            popular: true,
            features: [
                { text: '50MB Upload Limit', included: true },
                { text: 'Permanent Storage', included: true },
                { text: 'Management Dashboard', included: true },
                { text: 'Priority Support', included: true },
            ],
            cta: 'Upgrade to Pro',
            onClick: handleUpgrade,
        },
    ]

    return (
        <div className="container py-12">
            <div className="max-w-5xl mx-auto space-y-8">
                <div className="text-center space-y-2">
                    <h1 className="text-4xl font-bold">Simple Pricing</h1>
                    <p className="text-muted-foreground text-lg">
                        Choose the plan that's right for you. Pro users keep files forever.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    {plans.map((plan) => (
                        <Card
                            key={plan.name}
                            className={plan.popular ? 'border-primary shadow-lg shadow-primary/20' : ''}
                        >
                            {plan.popular && (
                                <div className="bg-primary text-primary-foreground text-center py-1 text-sm font-medium rounded-t-lg">
                                    RECOMMENDED
                                </div>
                            )}
                            <CardHeader>
                                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl font-bold">{plan.price}</span>
                                    <span className="text-muted-foreground">/{plan.period}</span>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <ul className="space-y-3">
                                    {plan.features.map((feature, i) => (
                                        <li key={i} className="flex items-center gap-2">
                                            {feature.included ? (
                                                <Check className="w-5 h-5 text-primary flex-shrink-0" />
                                            ) : (
                                                <X className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                                            )}
                                            <span className={feature.included ? '' : 'text-muted-foreground'}>
                                                {feature.text}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                                <Button
                                    className="w-full"
                                    variant={plan.popular ? 'default' : 'outline'}
                                    onClick={plan.onClick}
                                    disabled={loading}
                                >
                                    {loading && plan.popular ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        plan.cta
                                    )}
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    )
}
