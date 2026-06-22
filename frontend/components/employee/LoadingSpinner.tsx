// components/employee/LoadingSpinner.tsx
export function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
      <div className="animate-pulse text-slate-500">Loading...</div>
    </div>
  )
}