import { useState, useEffect } from 'react'
import { getSchoolsAPI } from '../api/users'

export const useSchools = () => {
  const [schools, setSchools] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getSchoolsAPI()
      .then(r => setSchools(r.data.data))
      .catch(() => setSchools([]))
      .finally(() => setLoading(false))
  }, [])

  return { schools, loading }
}
