import { Link } from 'react-router-dom'

export function UnauthorisedPage() {
  return (
    <div className="min-h-screen grid place-items-center bg-slate-50 p-4 text-center">
      <div className="max-w-sm space-y-3">
        <p className="text-base font-semibold text-slate-900">You don't have access to that area.</p>
        <p className="text-sm text-slate-500">
          Ask a location admin to grant the required role on your account.
        </p>
        <Link to="/dashboard" className="text-sm text-brand-600 hover:underline">
          Back to dashboard
        </Link>
      </div>
    </div>
  )
}
