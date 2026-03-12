import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { FiDisc } from 'react-icons/fi'
import { api, getStaticUrl, ApiError } from '@/lib/api'
import type { Vinyl, FriendItem } from '@/types'
import styles from './FriendCollection.module.css'

const privacyLabels: Record<string, string> = {
  public: 'Публично',
  friends_only: 'Друзья',
  private: 'Приватно',
}

export function FriendCollection() {
  const { userId } = useParams<{ userId: string }>()

  const { data: friend } = useQuery({
    queryKey: ['friend', userId],
    queryFn: async () => {
      const list = await api.friends.list()
      const f = list.friends.find((x: FriendItem) => x.id === userId)
      return f ?? null
    },
    enabled: !!userId,
  })

  const { data: records = [], isLoading, error } = useQuery({
    queryKey: ['user-vinyl', userId],
    queryFn: () => api.userVinyl(userId!),
    enabled: !!userId,
  })

  if (!userId) {
    return (
      <div className={styles.wrap}>
        <p>Не указан пользователь.</p>
        <Link to="/friends">← Друзья</Link>
      </div>
    )
  }

  const apiError = error instanceof ApiError ? error : null
  if (apiError?.status === 400) {
    return (
      <div className={styles.wrap}>
        <p className={styles.error}>
          Для своей коллекции используйте раздел «Моя коллекция».
        </p>
        <Link to="/collection">Перейти в мою коллекцию</Link>
      </div>
    )
  }
  if (apiError?.status === 403) {
    return (
      <div className={styles.wrap}>
        <p className={styles.error}>
          Вы не в друзьях с этим пользователем. Коллекция доступна только друзьям.
        </p>
        <p className={styles.hint}>
          Отправьте заявку в друзья со страницы друзей или вернитесь назад.
        </p>
        <div className={styles.actions}>
          <Link to="/friends">← К списку друзей</Link>
        </div>
      </div>
    )
  }
  if (error) {
    return (
      <div className={styles.wrap}>
        <p className={styles.error}>
          Не удалось загрузить коллекцию. Проверьте подключение и попробуйте ещё раз.
        </p>
        <Link to="/friends">← Друзья</Link>
      </div>
    )
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.nav}>
        <Link to="/friends" className={styles.back}>← Друзья</Link>
        <Link to="/collection" className={styles.myCollection}>Моя коллекция</Link>
      </div>
      <h1 className={styles.title}>
        Коллекция {friend?.username ?? userId}
      </h1>
      {isLoading ? (
        <div className={styles.spinner} aria-label="Загрузка" />
      ) : records.length === 0 ? (
        <p className={styles.empty}>
          У пользователя пока нет пластинок в коллекции (или нет записей, видимых для друзей).
        </p>
      ) : (
        <div className={styles.grid}>
          {records.map((record) => (
            <RecordCard key={record.id} userId={userId} record={record} />
          ))}
        </div>
      )}
    </div>
  )
}

function RecordCard({ userId, record }: { userId: string; record: Vinyl }) {
  const privacy = record.privacy_level ? privacyLabels[record.privacy_level] ?? record.privacy_level : ''
  const coverUrl = record.cover_image_url ? getStaticUrl(record.cover_image_url) : null

  return (
    <Link to={`/friends/${userId}/collection/${record.id}`} className={styles.card}>
      <div className={styles.coverWrap}>
        {coverUrl ? (
          <img src={coverUrl} alt="" className={styles.cover} />
        ) : (
          <div className={styles.coverPlaceholder}><FiDisc size={48} /></div>
        )}
        {privacy && <span className={styles.privacy}>{privacy}</span>}
      </div>
      <div className={styles.info}>
        <span className={styles.recordTitle}>{record.title}</span>
        <span className={styles.artist}>{record.artist}</span>
        {record.year != null && <span className={styles.year}>{record.year}</span>}
      </div>
    </Link>
  )
}
