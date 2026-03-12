import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import styles from './Exchanges.module.css'

export function Exchanges() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.dashboard(),
  })

  if (isLoading) {
    return (
      <div className={styles.wrap}>
        <h1 className={styles.title}>Обмены</h1>
        <div className={styles.spinner} aria-label="Загрузка" />
      </div>
    )
  }

  return (
    <div className={styles.wrap}>
      <h1 className={styles.title}>Обмены</h1>
      <div className={styles.placeholder}>
        <p>Активных обменов: {data?.exchanges_count ?? 0}</p>
        <p className={styles.hint}>Раздел обменов в разработке.</p>
      </div>
    </div>
  )
}
