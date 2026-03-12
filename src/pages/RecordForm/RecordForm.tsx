import { useState, useRef, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, getStaticUrl } from '@/lib/api'
import type { VinylCreate } from '@/types'
import styles from './RecordForm.module.css'

export function RecordForm() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isEdit = !!id

  const { data: record, isLoading } = useQuery({
    queryKey: ['vinyl', id],
    queryFn: () => api.vinyl.get(id!),
    enabled: isEdit,
  })

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.users.me(),
  })
  const { data: conditions = [] } = useQuery({
    queryKey: ['metadata', 'conditions'],
    queryFn: () => api.metadata.conditions(),
  })
  const { data: privacyLevels = [] } = useQuery({
    queryKey: ['metadata', 'privacy-levels'],
    queryFn: () => api.metadata.privacyLevels(),
  })

  const lang = user?.language ?? 'ru'
  const isEn = lang === 'en'

  const [coverUrl, setCoverUrl] = useState<string | null>(null)
  const [form, setForm] = useState<VinylCreate & { coverFile?: File }>({
    artist: '',
    title: '',
    label: '',
    year: undefined,
    genre: '',
    condition: '',
    cover_image_url: '',
    privacy_level: 'friends_only',
    notes: '',
  })
  const [error, setError] = useState('')

  useEffect(() => {
    if (!record) return
    setForm({
      artist: record.artist,
      title: record.title,
      label: record.label ?? '',
      year: record.year ?? undefined,
      genre: record.genre ?? '',
      condition: record.condition ?? '',
      cover_image_url: record.cover_image_url ?? '',
      privacy_level: record.privacy_level ?? 'friends_only',
      notes: record.notes ?? '',
    })
    if (record.cover_image_url) setCoverUrl(getStaticUrl(record.cover_image_url))
  }, [record])

  const createMutation = useMutation({
    mutationFn: (body: VinylCreate) => api.vinyl.create(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vinyl'] })
      navigate('/collection')
    },
    onError: (err: Error) => setError(err.message),
  })

  const updateMutation = useMutation({
    mutationFn: (body: Partial<VinylCreate>) => api.vinyl.update(id!, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vinyl'] })
      navigate(`/collection/${id}`)
    },
    onError: (err: Error) => setError(err.message),
  })

  const uploadCoverMutation = useMutation({
    mutationFn: (file: File) => api.vinyl.uploadCover(file),
    onSuccess: (data) => {
      const url = getStaticUrl(data.url)
      setCoverUrl(url)
      setForm((f) => ({ ...f, cover_image_url: data.url }))
      setError('')
    },
    onError: (err: Error) => setError(err.message),
  })

  if (isEdit && isLoading) {
    return (
      <div className={styles.wrap}>
        <div className={styles.spinner} aria-label={isEn ? 'Loading' : 'Загрузка'} />
      </div>
    )
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const body: VinylCreate = {
      artist: form.artist,
      title: form.title,
      label: form.label || undefined,
      year: form.year,
      genre: form.genre || undefined,
      condition: form.condition || undefined,
      cover_image_url: form.cover_image_url || undefined,
      privacy_level: form.privacy_level || undefined,
      notes: form.notes || undefined,
    }
    if (isEdit) updateMutation.mutate(body)
    else createMutation.mutate(body)
  }

  function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) {
      e.target.value = ''
      return
    }
    uploadCoverMutation.mutate(file)
    e.target.value = ''
  }

  const conditionOptions = conditions.length ? conditions : ['Mint', 'Near Mint', 'Good', 'Fair', 'Poor']
  const privacyOptions = privacyLevels.length
    ? privacyLevels
    : ['public', 'friends_only', 'private']
  const privacyLabels: Record<string, string> = isEn
    ? { public: 'Public', friends_only: 'Friends Only', private: 'Private' }
    : { public: 'Публично', friends_only: 'Только друзья', private: 'Приватно' }

  return (
    <div className={styles.wrap}>
      <Link to={isEdit ? `/collection/${id}` : '/collection'} className={styles.back}>
        ← {isEn ? 'Back' : 'Назад'}
      </Link>
      <div className={styles.card}>
        <h1 className={styles.title}>
          {isEdit ? (isEn ? 'Edit Record' : 'Редактировать пластинку') : isEn ? 'Add New Record' : 'Добавить пластинку'}
        </h1>

        <div className={styles.layout}>
          <div className={styles.coverSection}>
            <div
              className={styles.coverPreview}
              onClick={() => {
                if (uploadCoverMutation.isPending) return
                fileInputRef.current?.click()
              }}
            >
              {uploadCoverMutation.isPending ? (
                <span className={styles.coverPlaceholder}>{isEn ? 'Loading…' : 'Загрузка…'}</span>
              ) : coverUrl ? (
                <img src={coverUrl} alt="" />
              ) : (
                <span className={styles.coverPlaceholder}>
                  {isEn ? 'Upload cover' : 'Загрузить обложку'}
                </span>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className={styles.hidden}
              onChange={handleCoverChange}
            />
          </div>

          <div className={styles.formWrap}>
        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <p className={styles.error}>{error}</p>}
          <div className={styles.row}>
            <label className={styles.label}>
              {isEn ? 'Title' : 'Название'} *
              <input
                required
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className={styles.input}
              />
            </label>
            <label className={styles.label}>
              {isEn ? 'Artist' : 'Исполнитель'} *
              <input
                required
                value={form.artist}
                onChange={(e) => setForm((f) => ({ ...f, artist: e.target.value }))}
                className={styles.input}
              />
            </label>
          </div>
          <div className={styles.row}>
            <label className={styles.label}>
              {isEn ? 'Year' : 'Год'}
              <input
                type="number"
                value={form.year ?? ''}
                onChange={(e) =>
                  setForm((f) => ({ ...f, year: e.target.value ? parseInt(e.target.value, 10) : undefined }))
                }
                className={styles.input}
              />
            </label>
            <label className={styles.label}>
              {isEn ? 'Genre' : 'Жанр'}
              <input
                value={form.genre}
                onChange={(e) => setForm((f) => ({ ...f, genre: e.target.value }))}
                className={styles.input}
              />
            </label>
          </div>
          <div className={styles.row}>
            <label className={styles.label}>
              {isEn ? 'Label' : 'Лейбл'}
              <input
                value={form.label}
                onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                className={styles.input}
              />
            </label>
            <label className={styles.label}>
              {isEn ? 'Condition' : 'Состояние'}
              <select
                value={form.condition}
                onChange={(e) => setForm((f) => ({ ...f, condition: e.target.value }))}
                className={styles.input}
              >
                <option value="">—</option>
                {conditionOptions.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>
          </div>
          <label className={styles.label}>
            {isEn ? 'Privacy Level' : 'Приватность'}
            <select
              value={form.privacy_level}
              onChange={(e) => setForm((f) => ({ ...f, privacy_level: e.target.value }))}
              className={styles.input}
            >
              {privacyOptions.map((p) => (
                <option key={p} value={p}>{privacyLabels[p] ?? p}</option>
              ))}
            </select>
          </label>
          <label className={styles.label}>
            {isEn ? 'Notes' : 'Заметки'}
            <textarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              className={styles.textarea}
              placeholder={
                isEn
                  ? 'Any additional information about this record...'
                  : 'Дополнительная информация о пластинке...'
              }
              rows={3}
            />
          </label>
          <button
            type="submit"
            className={styles.submit}
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            {isEdit ? (isEn ? 'Save' : 'Сохранить') : isEn ? 'Add Record' : 'Добавить пластинку'}
          </button>
        </form>
          </div>
        </div>
      </div>
    </div>
  )
}
