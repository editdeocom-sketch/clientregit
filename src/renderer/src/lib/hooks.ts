import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from '@/store/ui'

export function useApi<T>(fn: () => Promise<T>, deps: unknown[]): {
  data: T | undefined
  loading: boolean
  error: string | undefined
  reload: () => void
} {
  const [data, setData] = useState<T | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | undefined>(undefined)
  const [tick, setTick] = useState(0)
  const fnRef = useRef(fn)
  fnRef.current = fn

  useEffect(() => {
    let alive = true
    setLoading(true)
    fnRef
      .current()
      .then((result) => {
        if (!alive) return
        setData(result)
        setError(undefined)
        setLoading(false)
      })
      .catch((err: unknown) => {
        if (!alive) return
        const message = err instanceof Error ? err.message : String(err)
        setError(message)
        setLoading(false)
        toast.error(message)
      })
    return () => {
      alive = false
    }
  }, [...deps, tick])

  const reload = useCallback(() => setTick((t) => t + 1), [])
  return { data, loading, error, reload }
}

export function useDebounced<T>(value: T, delay = 250): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}
