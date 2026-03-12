import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { FiDisc } from 'react-icons/fi'
import { api, getStaticUrl } from '@/lib/api'
import type { Vinyl } from '@/types'
import styles from './FriendCollection.module.css'

const privacyLabels: Record<string, string> = {
  public: 'Публично',
  friends_only: 'Друзья',
  private: 'Приватно',
}

export function FriendCollection() {
  const { userId } = useParams<{ userId: string }>()

  const { data: user } = useQuery({
    queryKey: ['user', userId],
    queryFn: async () => {
      const list = await api.friends.list()
      const friend = list.friends.find((f) => f.id === userId)
      return friend ?? null
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

  if (error) {
    return (
      <div className={styles.wrap}>
        <p className={styles.error}>Не удалось загрузить коллекцию (возможно, пользователь не в друзьях).</p>
        <Link to="/friends">← Друзья</Link>
      </div>
    )
  }

  return (
    <div className={styles.wrap}>
      <Link to="/friends" className={styles.back}>← Друзья</Link>
      <h1 className={styles.title}>
        Коллекция {user?.username ?? userId}
      </h1>
      {isLoading ? (
        <div className={styles.spinner} aria-label="Загрузка" />
      ) : records.length === 0 ? (
        <p className={styles.empty}>В коллекции пока нет пластинок.</p>
      ) : (
        <div className={styles.grid}>
          {records.map((record) => (
            <RecordCard key={record.id} record={record} />
          ))}
        </div>
      )}
    </div>
  )
}

function RecordCard({ record }: { record: Vinyl }) {
  const privacy = record.privacy_level ? privacyLabels[record.privacy_level] ?? record.privacy_level : ''
  const coverUrl = record.cover_image_url ? getStaticUrl(record.cover_image_url) : null

  return (
    <div className={styles.card}>
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
    </div>
  )
}
