import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FiDisc } from 'react-icons/fi'
import { api, getStaticUrl, ApiError } from '@/lib/api'
import styles from './ExchangeDetail.module.css'

const STATUS_MAP: Record<string, string> = {
  pending: 'В ожидании',
  accepted: 'Принято',
  rejected: 'Отклонено',
}

export function ExchangeDetail() {
  const { exchangeId } = useParams<{ exchangeId: string }>()
  const queryClient = useQueryClient()

  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.users.me(),
  })
  const { data: exchange, isLoading, error } = useQuery({
    queryKey: ['exchange', exchangeId],
    queryFn: () => api.exchanges.get(exchangeId!),
    enabled: !!exchangeId,
  })

  const acceptMutation = useMutation({
    mutationFn: () => api.exchanges.accept(exchangeId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exchanges'] })
      queryClient.invalidateQueries({ queryKey: ['exchange', exchangeId] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
  const rejectMutation = useMutation({
    mutationFn: () => api.exchanges.reject(exchangeId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exchanges'] })
      queryClient.invalidateQueries({ queryKey: ['exchange', exchangeId] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })

  if (!exchangeId) {
    return (
      <div className={styles.wrap}>
        <p className={styles.error}>Не указан обмен.</p>
        <Link to="/exchanges">← К списку обменов</Link>
      </div>
    )
  }

  if (error instanceof ApiError && error.status === 404) {
    return (
      <div className={styles.wrap}>
        <p className={styles.error}>Предложение не найдено или уже обработано.</p>
        <Link to="/exchanges">← К списку обменов</Link>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.wrap}>
        <p className={styles.error}>Не удалось загрузить данные обмена.</p>
        <Link to="/exchanges">← К списку обменов</Link>
      </div>
    )
  }

  if (isLoading || !exchange) {
    return (
      <div className={styles.wrap}>
        <div className={styles.spinner} aria-label="Загрузка" />
      </div>
    )
  }

  const isIncoming = exchange.to_user_id === me?.id && exchange.status === 'pending'
  const fromCover = exchange.from_vinyl?.cover_image_url
    ? getStaticUrl(exchange.from_vinyl.cover_image_url)
    : null
  const toCover = exchange.to_vinyl?.cover_image_url
    ? getStaticUrl(exchange.to_vinyl.cover_image_url)
    : null
  const created = exchange.created_at
    ? new Date(exchange.created_at).toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : ''

  return (
    <div className={styles.wrap}>
      <Link to="/exchanges" className={styles.back}>
        ← К списку обменов
      </Link>
      <h1 className={styles.title}>Предложение обмена</h1>
      <div className={styles.card}>
        <div className={styles.vinyls}>
          <div className={styles.vinylBlock}>
            <div className={styles.vinylCover}>
              {fromCover ? (
                <img src={fromCover} alt="" />
              ) : (
                <FiDisc size={48} className={styles.vinylPlaceholder} />
              )}
            </div>
            <div className={styles.vinylInfo}>
              <span className={styles.vinylLabel}>Отдаёт ({exchange.from_username})</span>
              <span className={styles.vinylArtist}>{exchange.from_vinyl?.artist}</span>
              <span className={styles.vinylTitle}>{exchange.from_vinyl?.title}</span>
            </div>
          </div>
          <span className={styles.arrow}>⇄</span>
          <div className={styles.vinylBlock}>
            <div className={styles.vinylCover}>
              {toCover ? (
                <img src={toCover} alt="" />
              ) : (
                <FiDisc size={48} className={styles.vinylPlaceholder} />
              )}
            </div>
            <div className={styles.vinylInfo}>
              <span className={styles.vinylLabel}>Получает ({exchange.to_username})</span>
              <span className={styles.vinylArtist}>{exchange.to_vinyl?.artist}</span>
              <span className={styles.vinylTitle}>{exchange.to_vinyl?.title}</span>
            </div>
          </div>
        </div>
        <div className={styles.meta}>
          <span className={styles.statusBadge} data-status={exchange.status}>
            {STATUS_MAP[exchange.status] ?? exchange.status}
          </span>
          <span className={styles.date}>{created}</span>
        </div>
        {isIncoming && (
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.acceptBtn}
              onClick={() => acceptMutation.mutate()}
              disabled={acceptMutation.isPending || rejectMutation.isPending}
            >
              Принять
            </button>
            <button
              type="button"
              className={styles.rejectBtn}
              onClick={() => rejectMutation.mutate()}
              disabled={acceptMutation.isPending || rejectMutation.isPending}
            >
              Отклонить
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
