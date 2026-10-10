import React, { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'

const BranchContext = createContext(null)

export function BranchProvider({ children }) {
  const [branches, setBranches] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchBranches = async () => {
    try {
      setIsLoading(true)
      const data = await api.get('/branches/')
      setBranches(Array.isArray(data) ? data : [])
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchBranches()
  }, [])

  return (
    <BranchContext.Provider value={{ branches, isLoading, error, refetch: fetchBranches }}>
      {children}
    </BranchContext.Provider>
  )
}

export function useBranches() {
  const context = useContext(BranchContext)
  if (!context) {
    return { branches: [], isLoading: false, error: null, refetch: () => {} }
  }
  return context
}

export default BranchContext
