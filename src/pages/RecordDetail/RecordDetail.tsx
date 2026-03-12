import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FiDisc, FiEdit2, FiTrash2 } from 'react-icons/fi'
import { api, getStaticUrl } from '@/lib/api'
import styles from './RecordDetail.module.css'

const privacyLabels: Record<string, string> = {
  public: 'Public',
  friends_only: 'Friends Only',
  private: 'Private',
}

export function RecordDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: record, isLoading, error } = useQuery({
    queryKey: ['vinyl', id],
    queryFn: () => api.vinyl.get(id!),
    enabled: !!id,
  })

  const deleteMutation = useMutation({
    mutationFn: () => api.vinyl.delete(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vinyl'] })
      navigate('/collection')
    },
  })

  if (!id || error) {
    return (
      <div className={styles.wrap}>
        <p className={styles.error}>Пластинка не найдена.</p>
        <Link to="/collection">← Назад к коллекции</Link>
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
      <Link to="/collection" className={styles.back}>← Back</Link>
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
                <dt>Year:</dt>
                <dd>{record.year}</dd>
              </>
            )}
            {record.genre && (
              <>
                <dt>Genre:</dt>
                <dd>{record.genre}</dd>
              </>
            )}
            {record.label && (
              <>
                <dt>Label:</dt>
                <dd>{record.label}</dd>
              </>
            )}
            {record.condition && (
              <>
                <dt>Condition:</dt>
                <dd>{record.condition}</dd>
              </>
            )}
            {privacy && (
              <>
                <dt>Privacy:</dt>
                <dd>{privacy}</dd>
              </>
            )}
          </dl>
          <div className={styles.actions}>
            <Link to={`/collection/${id}/edit`} className={styles.editBtn}>
              <FiEdit2 size={16} /> Edit
            </Link>
            <button
              type="button"
              className={styles.deleteBtn}
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
            >
              <FiTrash2 size={16} /> Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
