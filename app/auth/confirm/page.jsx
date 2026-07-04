"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import Link from "next/link";

function ConfirmContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState("loading"); // loading, success, error

  useEffect(() => {
    // In a real flow, this page might be reachable after a redirect from auth/callback
    // For now, we'll just show a success message if they land here,
    // or we could check for a session.
    const timer = setTimeout(() => {
      setStatus("success");
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="container flex items-center justify-center min-h-[calc(100vh-4rem)]">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            {status === "loading" ? (
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            ) : status === "success" ? (
              <CheckCircle2 className="w-8 h-8 text-primary" />
            ) : (
              <XCircle className="w-8 h-8 text-destructive" />
            )}
          </div>
          <CardTitle className="text-2xl font-bold">
            {status === "loading"
              ? "Verifying..."
              : status === "success"
              ? "Account Confirmed!"
              : "Verification Failed"}
          </CardTitle>
          <CardDescription>
            {status === "loading"
              ? "Please wait while we confirm your account details."
              : status === "success"
              ? "Your account has been successfully verified. You can now access all features."
              : "We could not verify your account. The link may have expired."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {status === "success" && (
            <div className="bg-muted p-4 rounded-lg text-sm text-center">
              Welcome to Dragnshare! Start sharing files securely.
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Link href="/login" className="w-full">
            <Button className="w-full">
              {status === "success" ? "Go to Login" : "Try Again"}
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function ConfirmPage() {
  return (
    <Suspense
      fallback={
        <div className="container flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }
    >
      <ConfirmContent />
    </Suspense>
  );
}
