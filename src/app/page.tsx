
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Icons } from '@/components/icons';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function WelcomePage() {
    const router = useRouter();

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        // For now, we'll just navigate to the dashboard.
        // Later, we can add real authentication logic here.
        router.push('/dashboard');
    }

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center bg-background">
      <Image
        src="https://picsum.photos/1200/800"
        alt="Tropical nature background"
        data-ai-hint="tropical nature"
        fill
        className="absolute inset-0 -z-10 h-full w-full object-cover brightness-75"
      />
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
            <div className="mx-auto mb-4">
                <Icons.Logo className="h-12 w-12 text-primary" />
            </div>
          <CardTitle className="text-2xl">Welcome to myBill.Pal</CardTitle>
          <CardDescription>Your friendly financial assistant. Sign in to continue.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="user@example.com" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required />
            </div>
            <Button type="submit" className="w-full">
              Enter Service Menu
            </Button>
          </form>
        </CardContent>
      </Card>
      <footer className="absolute bottom-4 text-center text-sm text-white/80">
        <p>&copy; {new Date().getFullYear()} TRANSMITTER BY LINDO.SHOOT UNDER THE PEEKARDO COLLECTIVES PTY LTD</p>
      </footer>
    </div>
  );
}
