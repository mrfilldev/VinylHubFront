import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FiDisc } from 'react-icons/fi'
import { api, getStaticUrl, ApiError } from '@/lib/api'
import type { Exchange } from '@/types'
import styles from './Exchanges.module.css'

type StatusFilter = 'all' | 'pending' | 'accepted' | 'rejected'

const STATUS_MAP: Record<string, string> = {
  pending: 'В ожидании',
  accepted: 'Принято',
  rejected: 'Отклонено',
}

export function Exchanges() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const statusParam =
    statusFilter === 'all' ? undefined : (statusFilter as 'pending' | 'accepted' | 'rejected')

  const { data: exchanges = [], isLoading, error } = useQuery({
    queryKey: ['exchanges', statusParam],
    queryFn: () => api.exchanges.list(statusParam),
  })

  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.users.me(),
  })
  const currentUserId = me?.id

  if (error) {
    return (
      <div className={styles.wrap}>
        <h1 className={styles.title}>Обмены</h1>
        <p className={styles.error}>
          Не удалось загрузить список обменов. Попробуйте ещё раз.
        </p>
      </div>
    )
  }

  const incomingPending = exchanges.filter(
    (e) => e.to_user_id === currentUserId && e.status === 'pending'
  )

  return (
    <div className={styles.wrap}>
      <h1 className={styles.title}>Обмены</h1>
      <p className={styles.subtitle}>
        Предложения обмена пластинками с друзьями
      </p>

      <div className={styles.tabs}>
        <button
          type="button"
          className={statusFilter === 'all' ? styles.tabActive : styles.tab}
          onClick={() => setStatusFilter('all')}
        >
          Все
        </button>
        <button
          type="button"
          className={statusFilter === 'pending' ? styles.tabActive : styles.tab}
          onClick={() => setStatusFilter('pending')}
        >
          В ожидании
          {incomingPending.length > 0 && statusFilter === 'all' && (
            <span className={styles.badge}>{incomingPending.length}</span>
          )}
        </button>
        <button
          type="button"
          className={statusFilter === 'accepted' ? styles.tabActive : styles.tab}
          onClick={() => setStatusFilter('accepted')}
        >
          Принятые
        </button>
        <button
          type="button"
          className={statusFilter === 'rejected' ? styles.tabActive : styles.tab}
          onClick={() => setStatusFilter('rejected')}
        >
          Отклонённые
        </button>
      </div>

      {isLoading ? (
        <div className={styles.spinner} aria-label="Загрузка" />
      ) : exchanges.length === 0 ? (
        <div className={styles.empty}>
          <p>
            {statusFilter === 'all'
              ? 'Нет предложений обмена. Предложите обмен из коллекции друга.'
              : `Нет обменов со статусом «${STATUS_MAP[statusFilter] ?? statusFilter}».`}
          </p>
          <Link to="/friends">Перейти к друзьям</Link>
        </div>
      ) : (
        <ul className={styles.list}>
          {exchanges.map((ex) => (
            <ExchangeCard
              key={ex.id}
              exchange={ex}
              currentUserId={currentUserId ?? ''}
              onUpdated={() => queryClient.invalidateQueries({ queryKey: ['exchanges'] })}
              onNavigate={() => navigate(`/exchanges/${ex.id}`)}
            />
          ))}
        </ul>
      )}
    </div>
  )
}

function ExchangeCard({
  exchange,
  currentUserId,
  onUpdated,
  onNavigate,
}: {
  exchange: Exchange
  currentUserId: string
  onUpdated: () => void
  onNavigate: () => void
}) {
  const queryClient = useQueryClient()
  const isIncoming = exchange.to_user_id === currentUserId && exchange.status === 'pending'

  const acceptMutation = useMutation({
    mutationFn: () => api.exchanges.accept(exchange.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exchanges'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      onUpdated()
    },
  })
  const rejectMutation = useMutation({
    mutationFn: () => api.exchanges.reject(exchange.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exchanges'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      onUpdated()
    },
  })

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
    <li className={styles.card}>
      <button
        type="button"
        className={styles.cardContent}
        onClick={onNavigate}
      >
        <div className={styles.vinyls}>
          <div className={styles.vinylBlock}>
            <div className={styles.vinylCover}>
              {fromCover ? (
                <img src={fromCover} alt="" />
              ) : (
                <FiDisc size={32} className={styles.vinylPlaceholder} />
              )}
            </div>
            <div className={styles.vinylInfo}>
              <span className={styles.vinylLabel}>Моя пластинка</span>
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
                <FiDisc size={32} className={styles.vinylPlaceholder} />
              )}
            </div>
            <div className={styles.vinylInfo}>
              <span className={styles.vinylLabel}>Пластинка друга</span>
              <span className={styles.vinylArtist}>{exchange.to_vinyl?.artist}</span>
              <span className={styles.vinylTitle}>{exchange.to_vinyl?.title}</span>
            </div>
          </div>
        </div>
        <div className={styles.meta}>
          <span className={styles.users}>
            {exchange.from_username} → {exchange.to_username}
          </span>
          <span className={styles.statusBadge} data-status={exchange.status}>
            {STATUS_MAP[exchange.status] ?? exchange.status}
          </span>
          <span className={styles.date}>{created}</span>
        </div>
      </button>
      {isIncoming && (
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.acceptBtn}
            onClick={(e) => {
              e.stopPropagation()
              acceptMutation.mutate()
            }}
            disabled={acceptMutation.isPending || rejectMutation.isPending}
          >
            Принять
          </button>
          <button
            type="button"
            className={styles.rejectBtn}
            onClick={(e) => {
              e.stopPropagation()
              rejectMutation.mutate()
            }}
            disabled={acceptMutation.isPending || rejectMutation.isPending}
          >
            Отклонить
          </button>
        </div>
      )}
    </li>
  )
}
