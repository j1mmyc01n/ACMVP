import { useEffect } from 'react'
import { Link } from 'react-router-dom'

export function UnauthorisedPage() {
  useEffect(() => {
    document.title = 'Access denied — ACLOCATION'
  }, [])

  return (
    <main id="main-content" className="min-h-screen grid place-items-center bg-slate-50 p-4 text-center" role="main">
      <div className="max-w-sm space-y-3" role="alert">
        <h1 className="text-base font-semibold text-slate-900">You don't have access to that area.</h1>
        <p className="text-sm text-slate-500">
          Ask a location admin to grant the required role on your account.
        </p>
        <Link to="/dashboard" className="text-sm text-brand-600 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 rounded">
          Back to dashboard
        </Link>
      </div>
    </main>
  )
}
