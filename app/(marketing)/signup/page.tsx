import { Suspense } from 'react'
import { SignupContent } from './signup-content'
import { Loader2 } from 'lucide-react'

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <SignupContent />
    </Suspense>
  )
}
