'use client';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

import { SettingsContent } from '@/components/settings/settings-content';

export default function SettingsPage() {
    return (
        <div className="container mx-auto py-8 px-4 max-w-7xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground mt-2">
                    Manage your account settings and preferences
                </p>
            </div>
            <Suspense fallback={
                <div className="flex h-[400px] items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            }>
                <SettingsContent />
            </Suspense>

        </div>
    );
}
