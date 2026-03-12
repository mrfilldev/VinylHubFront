import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { FiDisc } from 'react-icons/fi'
import { api, getStaticUrl, ApiError } from '@/lib/api'
import styles from '../RecordDetail/RecordDetail.module.css'

const privacyLabels: Record<string, string> = {
  public: 'Публично',
  friends_only: 'Друзья',
  private: 'Приватно',
}

export function FriendRecordDetail() {
  const { userId, recordId } = useParams<{ userId: string; recordId: string }>()

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
          {/* Без кнопок редактирования и удаления — это коллекция друга */}
        </div>
      </div>
    </div>
  )
}
