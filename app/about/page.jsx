import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Analytics } from "@vercel/analytics/next";
import { cn } from "@/lib/utils";

export default function AboutPage() {
  return (
    <div className="container py-12">
      <Analytics />
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Why We Built Drop & Share</h1>
        </div>

        <Card>
          <CardContent className="p-4 space-y-3 text-lg leading-relaxed">
            <p className="text-sm">
              I was in the middle of my IT Diploma when a simple problem hit me
              - I needed to send a file to a friend, but we had no pen drives
              and most websites wanted us to sign up first. To make things
              worse, we couldn't even zip a folder because the lab PCs were
              locked - no admin access.
            </p>

            <p className="text-muted-foreground italic text-sm">
              It felt silly that something so basic was made so hard.
            </p>

            <p className="text-sm">
              That moment sparked <strong>Drop & Share</strong>. A simple,
              no-login, no-hassle tool to upload and share files instantly using
              just a 6-digit code. Built out of real need - for people like me
              and you.
            </p>


            <div className="border-t pt-6 mt-6">
              <h2 className="text-2xl font-bold mb-4">Contributors</h2>
              <p className="mb-6 text-sm">
                Special thanks to the friends who helped bring this project to
                life.
              </p>
              <div className="flex items-center -space-x-4 transition-all duration-300">
                <Avatar className="w-12 h-12 border-2 border-background cursor-pointer hover:z-10 hover:scale-110 transition-transform">
                  <AvatarImage src="/images/friend1.jpg" alt="Contributor 1" />
                  <AvatarFallback>F1</AvatarFallback>
                </Avatar>
                <Avatar className="w-12 h-12 border-2 border-background cursor-pointer hover:z-10 hover:scale-110 transition-transform">
                  <AvatarImage src="/images/friend2.jpg" alt="Contributor 2" />
                  <AvatarFallback>F2</AvatarFallback>
                </Avatar>
                <Avatar className="w-12 h-12 border-2 border-background cursor-pointer hover:z-10 hover:scale-110 transition-transform">
                  <AvatarImage src="/images/friend3.jpg" alt="Contributor 3" />
                  <AvatarFallback>F3</AvatarFallback>
                </Avatar>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
