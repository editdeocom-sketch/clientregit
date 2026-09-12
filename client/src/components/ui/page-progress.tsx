import { useLocation } from "react-router-dom"

export function PageProgress() {
  const location = useLocation()
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[9999]">
      <div key={location.pathname} className="page-progress-bar" />
    </div>
  )
}