import { useState, useRef } from 'react'
import { FiUser } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, getStaticUrl, clearToken } from '@/lib/api'
import styles from './Profile.module.css'

const LANG_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'ru', label: 'Русский' },
]

export function Profile() {
  const [editing, setEditing] = useState(false)
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [language, setLanguage] = useState('ru')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const { data: user, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.users.me(),
  })

  const updateMutation = useMutation({
    mutationFn: (body: { username?: string; bio?: string; language?: string }) =>
      api.users.updateMe(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] })
      setEditing(false)
    },
  })

  const avatarMutation = useMutation({
    mutationFn: (file: File) => api.users.uploadAvatar(file),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['me'] }),
  })

  if (isLoading || !user) {
    return (
      <div className={styles.wrap}>
        <div className={styles.spinner} aria-label="Загрузка" />
      </div>
    )
  }

  function startEdit() {
    setUsername(user.username)
    setBio(user.bio ?? '')
    setLanguage(user.language ?? 'ru')
    setEditing(true)
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    updateMutation.mutate({ username, bio, language })
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) avatarMutation.mutate(file)
  }

  const avatarUrl = user.avatar_url ? getStaticUrl(user.avatar_url) : null
  const shortId = user.id.slice(0, 8) + '...'
  const memberSince = user.created_at
    ? new Date(user.created_at).toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : '—'

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <div className={styles.head}>
          <h1 className={styles.title}>
            {user.language === 'en' ? 'Profile' : 'Профиль'}
          </h1>
          <div className={styles.headActions}>
            {!editing ? (
              <button type="button" className={styles.editBtn} onClick={startEdit}>
                {user.language === 'en' ? 'Edit' : 'Редактировать'}
              </button>
            ) : (
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={() => setEditing(false)}
              >
                {user.language === 'en' ? 'Cancel' : 'Отмена'}
              </button>
            )}
            <button
              type="button"
              className={styles.logoutBtn}
              onClick={() => {
                clearToken()
                queryClient.clear()
                navigate('/login', { replace: true })
              }}
            >
              {user.language === 'en' ? 'Log out' : 'Выйти'}
            </button>
          </div>
        </div>

        <div className={styles.avatarWrap}>
          <button
            type="button"
            className={styles.avatar}
            onClick={() => fileInputRef.current?.click()}
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="" />
            ) : (
              <span className={styles.avatarPlaceholder}><FiUser size={40} /></span>
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className={styles.hidden}
            onChange={handleAvatarChange}
          />
        </div>
        <p className={styles.username}>{user.username}</p>
        <p className={styles.email}>{user.email}</p>

        {editing ? (
          <form onSubmit={handleSave} className={styles.form}>
            <label className={styles.label}>
              {user.language === 'en' ? 'Username' : 'Имя пользователя'}
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={styles.input}
              />
            </label>
            <label className={styles.label}>
              Bio
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className={styles.textarea}
                rows={3}
              />
            </label>
            <label className={styles.label}>
              {user.language === 'en' ? 'Language' : 'Язык'}
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className={styles.input}
              >
                {LANG_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </label>
            <button type="submit" className={styles.saveBtn} disabled={updateMutation.isPending}>
              Сохранить
            </button>
          </form>
        ) : (
          <>
            <p className={styles.fieldLabel}>
              {user.language === 'en' ? 'Username' : 'Имя пользователя'}
            </p>
            <p className={styles.fieldValue}>{user.username}</p>
            <p className={styles.fieldLabel}>Bio</p>
            <p className={styles.fieldValue}>{user.bio || '—'}</p>
            <p className={styles.fieldLabel}>
              {user.language === 'en' ? 'Language' : 'Язык'}
            </p>
            <p className={styles.fieldValue}>
              {LANG_OPTIONS.find((o) => o.value === (user.language ?? 'ru'))?.label ?? user.language}
            </p>
          </>
        )}

        <section className={styles.accountSection}>
          <h2 className={styles.accountTitle}>
            {user.language === 'en' ? 'Account Information' : 'Информация об аккаунте'}
          </h2>
          <p className={styles.accountRow}>
            <span className={styles.accountLabel}>
              {user.language === 'en' ? 'Account ID:' : 'ID аккаунта:'}
            </span>{' '}
            {shortId}
          </p>
          <p className={styles.accountRow}>
            <span className={styles.accountLabel}>
              {user.language === 'en' ? 'Member since:' : 'С нами с:'}
            </span>{' '}
            {memberSince}
          </p>
        </section>
      </div>
    </div>
  )
}
