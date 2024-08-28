// composables/useApiData.js

export const useApiData = () => {
    const data = useState('apiData', () => null)
    const loading = useState('loading', () => false)
    const error = useState('error', () => null)
  
    const fetchData = async () => {
      loading.value = true
      error.value = null
      
      try {
        const response = await fetch('https://fantasy.premierleague.com/api/bootstrap-static/')
        data.value = await response.json()
      } catch (err) {
        error.value = err
      } finally {
        loading.value = false
      }
    }
  
    return { data, loading, error, fetchData }
  }