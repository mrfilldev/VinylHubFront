import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { FiDisc, FiUsers, FiRepeat, FiPlus } from 'react-icons/fi'
import { api } from '@/lib/api'
import styles from './Dashboard.module.css'

export function Dashboard() {
  const {
    data: stats,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.dashboard(),
  })
  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.users.me(),
  })

  const lang = user?.language ?? 'ru'
  const isEn = lang === 'en'

  if (isError) {
    return (
      <div className={styles.wrap}>
        <div className={styles.errorBlock}>
          <p className={styles.errorText}>
            {isEn ? 'Failed to load data' : 'Не удалось загрузить данные'}:{' '}
            {error instanceof Error ? error.message : isEn ? 'Request error' : 'Ошибка запроса'}
          </p>
          <p className={styles.errorHint}>
            {isEn
              ? 'Check API availability and CORS settings on the backend.'
              : 'Проверьте доступность API и настройки CORS на бэкенде.'}
          </p>
          <button type="button" className={styles.retryBtn} onClick={() => refetch()}>
            {isEn ? 'Retry' : 'Повторить'}
          </button>
        </div>
      </div>
    )
  }

  if (isLoading || !stats) {
    return (
      <div className={styles.wrap}>
        <div className={styles.spinner} aria-label="Загрузка" />
      </div>
    )
  }

  return (
    <div className={styles.wrap}>
      <h1 className={styles.welcome}>
        {isEn ? 'Welcome back' : 'С возвращением'}, {user?.username ?? '…'}!
      </h1>
      <p className={styles.subtitle}>
        {isEn
          ? 'Manage your vinyl collection and connect with other collectors'
          : 'Управляйте своей виниловой коллекцией и общайтесь с коллекционерами'}
      </p>

      <div className={styles.cards}>
        <div className={styles.statCard}>
          <span className={`${styles.statIcon} ${styles.statGreen}`} aria-hidden><FiDisc size={20} /></span>
          <span className={styles.statValue}>{stats.records_count}</span>
          <span className={styles.statLabel}>
            {isEn ? 'Records' : 'Пластинок'}
          </span>
        </div>
        <div className={styles.statCard}>
          <span className={`${styles.statIcon} ${styles.statBlue}`} aria-hidden><FiUsers size={20} /></span>
          <span className={styles.statValue}>{stats.friends_count}</span>
          <span className={styles.statLabel}>
            {isEn ? 'Friends' : 'Друзей'}
          </span>
        </div>
        <div className={styles.statCard}>
          <span className={`${styles.statIcon} ${styles.statOrange}`} aria-hidden><FiRepeat size={20} /></span>
          <span className={styles.statValue}>{stats.exchanges_count}</span>
          <span className={styles.statLabel}>
            {isEn ? 'Active exchanges' : 'Активных обменов'}
          </span>
        </div>
      </div>

      <h2 className={styles.quickTitle}>
        {isEn ? 'Quick actions' : 'Быстрые действия'}
      </h2>
      <div className={styles.quickCards}>
        <Link to="/collection/new" className={styles.quickCard}>
          <span className={`${styles.quickIcon} ${styles.quickGreen}`} aria-hidden><FiPlus size={20} /></span>
          <span className={styles.quickLabel}>
            {isEn ? 'Add record' : 'Добавить пластинку'}
          </span>
          <span className={styles.quickDesc}>
            {isEn ? 'Grow your collection' : 'Расширьте коллекцию'}
          </span>
        </Link>
        <Link to="/friends" className={styles.quickCard}>
          <span className={`${styles.quickIcon} ${styles.quickBlue}`} aria-hidden><FiUsers size={20} /></span>
          <span className={styles.quickLabel}>
            {isEn ? 'Find friends' : 'Найти друзей'}
          </span>
          <span className={styles.quickDesc}>
            {isEn ? 'Connect with collectors' : 'Общайтесь с коллекционерами'}
          </span>
        </Link>
      </div>
    </div>
  )
}
