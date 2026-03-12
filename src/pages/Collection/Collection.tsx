import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { FiSearch, FiPlus, FiDisc } from 'react-icons/fi'
import { api, getStaticUrl } from '@/lib/api'
import type { User, Vinyl } from '@/types'
import styles from './Collection.module.css'

const privacyLabels: Record<string, string> = {
  public: 'Публично',
  friends_only: 'Друзья',
  private: 'Приватно',
}

export function Collection() {
  const [search, setSearch] = useState('')

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['vinyl', search],
    queryFn: () =>
      api.vinyl.list({
        limit: 50,
        title: search || undefined,
        artist: search || undefined,
      }),
  })
  const { data: user } = useQuery<User>({
    queryKey: ['me'],
    queryFn: () => api.users.me(),
  })

  const lang = user?.language ?? 'ru'
  const isEn = lang === 'en'

  return (
    <div className={styles.wrap}>
      <div className={styles.top}>
        <h1 className={styles.title}>
          {isEn ? 'My collection' : 'Моя коллекция'}
        </h1>
        <div className={styles.actions}>
          <div className={styles.searchWrap}>
            <FiSearch className={styles.searchIcon} aria-hidden />
            <input
              type="search"
              className={styles.search}
              placeholder={
                isEn ? 'Search by title or artist...' : 'Поиск по названию или исполнителю...'
              }
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Link to="/collection/new" className={styles.addBtn}>
            <FiPlus size={18} className={styles.addBtnIcon} aria-hidden />
            {isEn ? 'Add' : 'Добавить'}
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className={styles.spinner} aria-label="Загрузка" />
      ) : items.length === 0 ? (
        <p className={styles.empty}>
          {isEn ? 'No records yet. Add your first one!' : 'Пластинок пока нет. Добавьте первую!'}
        </p>
      ) : (
        <div className={styles.grid}>
          {items.map((record) => (
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
    <Link to={`/collection/${record.id}`} className={styles.card}>
      <div className={styles.coverWrap}>
        {coverUrl ? (
          <img src={coverUrl} alt="" className={styles.cover} />
        ) : (
          <div className={styles.coverPlaceholder}><FiDisc size={48} /></div>
        )}
        {privacy && (
          <span className={styles.privacy}>{privacy}</span>
        )}
      </div>
      <div className={styles.info}>
        <span className={styles.recordTitle}>{record.title}</span>
        <span className={styles.artist}>{record.artist}</span>
        {record.year != null && (
          <span className={styles.year}>{record.year}</span>
        )}
      </div>
    </Link>
  )
}
