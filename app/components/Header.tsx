import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs'

export default function Header() {
  return (
    <header className="border-b">
      <nav className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="text-xl font-bold">
          PadelTime
        </div>
        
        <div className="flex items-center gap-4">
          <SignedOut>
            <SignInButton mode="modal">
              <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                Sign In
              </button>
            </SignInButton>
          </SignedOut>
          
          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>
      </nav>
    </header>
  )
}
