import { useEffect, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '@/lib/api'

export function DeepLinkBridge(): ReactNode {
  const navigate = useNavigate()

  useEffect(() => {
    return api.nav.onNavigate((route) => {
      navigate(route)
    })
  }, [navigate])

  return null
}
