import { useParams, Link, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useState, useEffect, useCallback } from 'react'
import { FiDisc } from 'react-icons/fi'
import { api, getStaticUrl, ApiError } from '@/lib/api'
import type { Vinyl, FriendItem } from '@/types'
import styles from './FriendCollection.module.css'

const DEFAULT_LIMIT = 20
const DEBOUNCE_MS = 400

const privacyLabels: Record<string, string> = {
  public: 'Публично',
  friends_only: 'Друзья',
  private: 'Приватно',
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debouncedValue
}

export function FriendCollection() {
  const { userId } = useParams<{ userId: string }>()
  const [searchParams, setSearchParams] = useSearchParams()

  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT))
  const [artistInput, setArtistInput] = useState(searchParams.get('artist') ?? '')
  const [titleInput, setTitleInput] = useState(searchParams.get('title') ?? '')

  const artist = useDebounce(artistInput.trim(), DEBOUNCE_MS)
  const title = useDebounce(titleInput.trim(), DEBOUNCE_MS)

  const skip = (page - 1) * limit

  const setPage = useCallback(
    (newPage: number) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        if (newPage <= 1) next.delete('page')
        else next.set('page', String(newPage))
        return next
      })
    },
    [setSearchParams]
  )

  useEffect(() => {
    const prevArtist = searchParams.get('artist') ?? ''
    const prevTitle = searchParams.get('title') ?? ''
    if (artist === prevArtist && title === prevTitle) return
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (artist) next.set('artist', artist)
      else next.delete('artist')
      if (title) next.set('title', title)
      else next.delete('title')
      next.delete('page')
      return next
    })
  }, [artist, title, searchParams])

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
    queryKey: ['user-vinyl', userId, skip, limit, artist, title],
    queryFn: () =>
      api.userVinyl(userId!, { skip, limit, ...(artist && { artist }), ...(title && { title }) }),
    enabled: !!userId,
  })

  const hasNext = records.length === limit
  const hasPrev = page > 1

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

  const emptyByFilter = (artist || title) && records.length === 0 && !isLoading

  return (
    <div className={styles.wrap}>
      <div className={styles.nav}>
        <Link to="/friends" className={styles.back}>← Друзья</Link>
        <Link to="/collection" className={styles.myCollection}>Моя коллекция</Link>
      </div>
      <h1 className={styles.title}>
        Коллекция {friend?.username ?? userId}
      </h1>

      <div className={styles.filters}>
        <label className={styles.filterLabel}>
          <span>Исполнитель</span>
          <input
            type="search"
            placeholder="Фильтр по исполнителю"
            value={artistInput}
            onChange={(e) => setArtistInput(e.target.value)}
            className={styles.filterInput}
          />
        </label>
        <label className={styles.filterLabel}>
          <span>Название</span>
          <input
            type="search"
            placeholder="Фильтр по названию"
            value={titleInput}
            onChange={(e) => setTitleInput(e.target.value)}
            className={styles.filterInput}
          />
        </label>
      </div>

      {isLoading ? (
        <div className={styles.spinner} aria-label="Загрузка" />
      ) : records.length === 0 ? (
        <p className={styles.empty}>
          {emptyByFilter
            ? 'Ничего не найдено по заданным фильтрам.'
            : 'У пользователя пока нет пластинок в коллекции (или нет записей, видимых для друзей).'}
        </p>
      ) : (
        <>
          <div className={styles.grid}>
            {records.map((record) => (
              <RecordCard key={record.id} userId={userId} record={record} />
            ))}
          </div>
          <div className={styles.pagination}>
            <button
              type="button"
              className={styles.pageBtn}
              disabled={!hasPrev}
              onClick={() => setPage(page - 1)}
            >
              ← Назад
            </button>
            <span className={styles.pageInfo}>
              Страница {page}
            </span>
            <button
              type="button"
              className={styles.pageBtn}
              disabled={!hasNext}
              onClick={() => setPage(page + 1)}
            >
              Вперёд →
            </button>
          </div>
        </>
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
