import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FiDisc } from 'react-icons/fi'
import { api, getStaticUrl, ApiError } from '@/lib/api'
import type { Vinyl } from '@/types'
import styles from '../RecordDetail/RecordDetail.module.css'
import exchangeStyles from './FriendRecordDetail.module.css'

const privacyLabels: Record<string, string> = {
  public: 'Публично',
  friends_only: 'Друзья',
  private: 'Приватно',
}

export function FriendRecordDetail() {
  const { userId, recordId } = useParams<{ userId: string; recordId: string }>()
  const [exchangeModalOpen, setExchangeModalOpen] = useState(false)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: record, isLoading, error } = useQuery({
    queryKey: ['user-vinyl-record', userId, recordId],
    queryFn: () => api.userVinylRecord(userId!, recordId!),
    enabled: !!userId && !!recordId,
  })

  if (!userId || !recordId) {
    return (
      <div className={styles.wrap}>
        <p className={styles.error}>Не указан пользователь или запись.</p>
        <Link to="/friends">← Друзья</Link>
      </div>
    )
  }

  const apiError = error instanceof ApiError ? error : null
  if (apiError?.status === 403) {
    return (
      <div className={styles.wrap}>
        <p className={styles.error}>
          Вы не в друзьях с этим пользователем. Запись доступна только друзьям.
        </p>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Link to={`/friends/${userId}/collection`}>← К коллекции друга</Link>
          <Link to="/friends">К списку друзей</Link>
        </div>
      </div>
    )
  }
  if (apiError?.status === 404) {
    return (
      <div className={styles.wrap}>
        <p className={styles.error}>Запись не найдена.</p>
        <Link to={`/friends/${userId}/collection`}>← К коллекции</Link>
      </div>
    )
  }
  if (error) {
    return (
      <div className={styles.wrap}>
        <p className={styles.error}>Не удалось загрузить запись. Проверьте подключение и попробуйте ещё раз.</p>
        <Link to={`/friends/${userId}/collection`}>← К коллекции</Link>
      </div>
    )
  }

  if (isLoading || !record) {
    return (
      <div className={styles.wrap}>
        <div className={styles.spinner} aria-label="Загрузка" />
      </div>
    )
  }

  const coverUrl = record.cover_image_url ? getStaticUrl(record.cover_image_url) : null
  const privacy = record.privacy_level ? privacyLabels[record.privacy_level] ?? record.privacy_level : ''

  return (
    <div className={styles.wrap}>
      <Link to={`/friends/${userId}/collection`} className={styles.back}>
        ← К коллекции друга
      </Link>
      <div className={styles.card}>
        <div className={styles.coverCol}>
          {coverUrl ? (
            <img src={coverUrl} alt="" className={styles.cover} />
          ) : (
            <div className={styles.coverPlaceholder}><FiDisc size={64} /></div>
          )}
        </div>
        <div className={styles.details}>
          <h1 className={styles.recordTitle}>{record.title}</h1>
          <p className={styles.artist}>{record.artist}</p>
          <dl className={styles.meta}>
            {record.year != null && (
              <>
                <dt>Год:</dt>
                <dd>{record.year}</dd>
              </>
            )}
            {record.genre && (
              <>
                <dt>Жанр:</dt>
                <dd>{record.genre}</dd>
              </>
            )}
            {record.label && (
              <>
                <dt>Лейбл:</dt>
                <dd>{record.label}</dd>
              </>
            )}
            {record.condition && (
              <>
                <dt>Состояние:</dt>
                <dd>{record.condition}</dd>
              </>
            )}
            {privacy && (
              <>
                <dt>Приватность:</dt>
                <dd>{privacy}</dd>
              </>
            )}
            {record.notes && (
              <>
                <dt>Заметки:</dt>
                <dd>{record.notes}</dd>
              </>
            )}
          </dl>
          <div className={exchangeStyles.exchangeSection}>
            <button
              type="button"
              className={exchangeStyles.exchangeBtn}
              onClick={() => setExchangeModalOpen(true)}
            >
              Предложить обмен
            </button>
          </div>
        </div>
      </div>
      {exchangeModalOpen && userId && recordId && (
        <ExchangeModal
          toUserId={userId}
          toVinylId={recordId}
          onClose={() => setExchangeModalOpen(false)}
          onSuccess={() => {
            setExchangeModalOpen(false)
            queryClient.invalidateQueries({ queryKey: ['exchanges'] })
            queryClient.invalidateQueries({ queryKey: ['dashboard'] })
            navigate('/exchanges')
          }}
        />
      )}
    </div>
  )
}

function ExchangeModal({
  toUserId,
  toVinylId,
  onClose,
  onSuccess,
}: {
  toUserId: string
  toVinylId: string
  onClose: () => void
  onSuccess: () => void
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const { data: myVinyl = [], isLoading } = useQuery({
    queryKey: ['vinyl'],
    queryFn: () => api.vinyl.list({ limit: 100 }),
  })

  const createMutation = useMutation({
    mutationFn: (fromVinylId: string) =>
      api.exchanges.create({
        from_vinyl_id: fromVinylId,
        to_user_id: toUserId,
        to_vinyl_id: toVinylId,
      }),
    onSuccess: () => {
      onSuccess()
    },
    onError: (err) => {
      if (err instanceof ApiError) {
        setErrorMessage(err.message)
      } else {
        setErrorMessage('Не удалось отправить предложение. Попробуйте ещё раз.')
      }
    },
  })

  const handleSubmit = () => {
    if (!selectedId) return
    setErrorMessage(null)
    createMutation.mutate(selectedId)
  }

  return (
    <div className={exchangeStyles.overlay} onClick={onClose} role="presentation">
      <div className={exchangeStyles.modal} onClick={(e) => e.stopPropagation()} role="dialog">
        <div className={exchangeStyles.modalHeader}>
          <h2 className={exchangeStyles.modalTitle}>Выберите свою пластинку для обмена</h2>
          <button type="button" className={exchangeStyles.modalClose} onClick={onClose} aria-label="Закрыть">
            ×
          </button>
        </div>
        <div className={exchangeStyles.modalBody}>
          {errorMessage && <p className={exchangeStyles.modalError}>{errorMessage}</p>}
          {createMutation.isSuccess && (
            <p className={exchangeStyles.modalSuccess}>Предложение отправлено!</p>
          )}
          {isLoading ? (
            <div className={styles.spinner} aria-label="Загрузка" style={{ margin: '24px auto' }} />
          ) : myVinyl.length === 0 ? (
            <p className={exchangeStyles.modalEmpty}>
              В вашей коллекции пока нет пластинок. Добавьте пластинки в разделе «Моя коллекция».
            </p>
          ) : (
            <ul className={exchangeStyles.vinylList}>
              {myVinyl.map((v: Vinyl) => (
                <li
                  key={v.id}
                  className={`${exchangeStyles.vinylItem} ${selectedId === v.id ? exchangeStyles.vinylItemSelected : ''}`}
                  onClick={() => setSelectedId(v.id)}
                >
                  <div className={exchangeStyles.vinylItemCover}>
                    {v.cover_image_url ? (
                      <img src={getStaticUrl(v.cover_image_url)} alt="" />
                    ) : (
                      <div className={exchangeStyles.vinylItemPlaceholder}>
                        <FiDisc />
                      </div>
                    )}
                  </div>
                  <div className={exchangeStyles.vinylItemInfo}>
                    <div className={exchangeStyles.vinylItemArtist}>{v.artist}</div>
                    <div className={exchangeStyles.vinylItemTitle}>{v.title}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className={exchangeStyles.modalFooter}>
          <button type="button" className={exchangeStyles.modalBtn} onClick={onClose}>
            Отмена
          </button>
          <button
            type="button"
            className={`${exchangeStyles.modalBtn} ${exchangeStyles.modalBtnPrimary}`}
            onClick={handleSubmit}
            disabled={!selectedId || createMutation.isPending}
          >
            {createMutation.isPending ? 'Отправка…' : 'Предложить обмен'}
          </button>
        </div>
      </div>
    </div>
  )
}
