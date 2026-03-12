import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FiSearch, FiUser } from 'react-icons/fi'
import { api } from '@/lib/api'
import type { FriendItem, IncomingInvitation, OutgoingInvitation } from '@/types'
import styles from './Friends.module.css'

type Tab = 'friends' | 'incoming' | 'outgoing'

export function Friends() {
  const [tab, setTab] = useState<Tab>('friends')
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQ, setSearchQ] = useState('')

  const queryClient = useQueryClient()
  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.users.me(),
  })
  const { data, isLoading } = useQuery({
    queryKey: ['friends'],
    queryFn: () => api.friends.list(),
  })

  const isEn = (user?.language ?? 'ru') === 'en'

  const { data: searchResults, isFetching: searchLoading } = useQuery({
    queryKey: ['users-search', searchQ],
    queryFn: () => api.users.search(searchQ),
    enabled: searchOpen && searchQ.length >= 1,
  })

  const removeMutation = useMutation({
    mutationFn: (userId: string) => api.friends.remove(userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['friends'] }),
  })
  const acceptMutation = useMutation({
    mutationFn: (id: string) => api.friends.acceptInvitation(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['friends'] }),
  })
  const rejectMutation = useMutation({
    mutationFn: (id: string) => api.friends.rejectInvitation(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['friends'] }),
  })

  if (!data && !isLoading) return null
  const friends = data?.friends ?? []
  const incoming = data?.incoming_invitations ?? []
  const outgoing = data?.outgoing_invitations ?? []

  return (
    <div className={styles.wrap}>
      <h1 className={styles.title}>Друзья</h1>

      <div className={styles.tabsRow}>
        <div className={styles.tabs}>
          <button
            type="button"
            className={tab === 'friends' ? styles.tabActive : styles.tab}
            onClick={() => setTab('friends')}
          >
            Друзья ({friends.length})
          </button>
          <button
            type="button"
            className={tab === 'incoming' ? styles.tabActive : styles.tab}
            onClick={() => setTab('incoming')}
          >
            Получено ({incoming.length})
          </button>
          <button
            type="button"
            className={tab === 'outgoing' ? styles.tabActive : styles.tab}
            onClick={() => setTab('outgoing')}
          >
            Отправлено ({outgoing.length})
          </button>
        </div>
        <button
          type="button"
          className={styles.findBtn}
          onClick={() => setSearchOpen(!searchOpen)}
        >
          <FiSearch size={18} /> {isEn ? 'Find' : 'Найти'}
        </button>
      </div>

      {searchOpen && (
        <div className={styles.searchBox}>
          <input
            type="search"
            placeholder="Введите username или email..."
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            className={styles.searchInput}
            autoFocus
          />
          {searchLoading && <span className={styles.searchLoading}>Загрузка…</span>}
          {searchResults != null && searchResults.length === 0 && searchQ.length >= 1 && (
            <p className={styles.searchEmpty}>Никого не найдено</p>
          )}
          {searchResults != null && searchResults.length > 0 && (
            <ul className={styles.searchList}>
              {searchResults.map((u) => (
                <li key={u.id} className={styles.searchItem}>
                  <Link to={`/friends/${u.id}/collection`} className={styles.searchLink}>
                    {u.username} ({u.email})
                  </Link>
                  <InviteButton userId={u.id} />
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {isLoading ? (
        <div className={styles.spinner} aria-label="Загрузка" />
      ) : (
        <div className={styles.content}>
          {tab === 'friends' && (
            <ul className={styles.list}>
              {friends.length === 0 ? (
                <li className={styles.empty}>Список друзей пуст</li>
              ) : (
                friends.map((f: FriendItem) => (
                  <li key={f.id} className={styles.item}>
                    <FiUser className={styles.userIcon} aria-hidden />
                    <Link to={`/friends/${f.id}/collection`} className={styles.name}>
                      {f.username}
                    </Link>
                    <button
                      type="button"
                      className={styles.removeBtn}
                      onClick={() => removeMutation.mutate(f.id)}
                      disabled={removeMutation.isPending}
                    >
                      Удалить
                    </button>
                  </li>
                ))
              )}
            </ul>
          )}
          {tab === 'incoming' && (
            <ul className={styles.list}>
              {incoming.length === 0 ? (
                <li className={styles.empty}>Нет входящих заявок</li>
              ) : (
                incoming.map((inv: IncomingInvitation) => (
                  <li key={inv.id} className={styles.item}>
                    <FiUser className={styles.userIcon} aria-hidden />
                    <Link to={`/friends/${inv.from_user_id}/collection`} className={styles.name}>
                      {inv.from_username}
                    </Link>
                    <div className={styles.invActions}>
                      <button
                        type="button"
                        className={styles.acceptBtn}
                        onClick={() => acceptMutation.mutate(inv.id)}
                        disabled={acceptMutation.isPending}
                      >
                        Принять
                      </button>
                      <button
                        type="button"
                        className={styles.rejectBtn}
                        onClick={() => rejectMutation.mutate(inv.id)}
                        disabled={rejectMutation.isPending}
                      >
                        Отклонить
                      </button>
                    </div>
                  </li>
                ))
              )}
            </ul>
          )}
          {tab === 'outgoing' && (
            <ul className={styles.list}>
              {outgoing.length === 0 ? (
                <li className={styles.empty}>Нет исходящих заявок</li>
              ) : (
                outgoing.map((inv: OutgoingInvitation) => (
                  <li key={inv.id} className={styles.item}>
                    <FiUser className={styles.userIcon} aria-hidden />
                    <span className={styles.name}>{inv.to_username}</span>
                    <span className={styles.pending}>Ожидание</span>
                  </li>
                ))
              )}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

function InviteButton({ userId }: { userId: string }) {
  const queryClient = useQueryClient()
  const inviteMutation = useMutation({
    mutationFn: () => api.friends.invite(userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['friends'] }),
  })
  return (
    <button
      type="button"
      className={styles.inviteBtn}
      onClick={() => inviteMutation.mutate()}
      disabled={inviteMutation.isPending}
    >
      Добавить в друзья
    </button>
  )
}
