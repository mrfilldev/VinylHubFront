import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, setToken } from '@/lib/api'
import styles from './Register.module.css'

export function Register() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.auth.register({ email, username, password })
      const { access_token } = await api.auth.login({ login: email, password })
      setToken(access_token)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка регистрации')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <div className={styles.logo} aria-hidden />
        <h1 className={styles.title}>VinylHub</h1>
        <p className={styles.subtitle}>Создайте свою виниловую коллекцию</p>
        <form className={styles.form} onSubmit={handleSubmit}>
          {error && <p className={styles.error}>{error}</p>}
          <label className={styles.label}>
            Имя пользователя
            <input
              type="text"
              className={styles.input}
              placeholder="coolcollector"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </label>
          <label className={styles.label}>
            Email
            <input
              type="email"
              className={styles.input}
              placeholder="your@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </label>
          <label className={styles.label}>
            Пароль
            <span className={styles.hint}>Минимум 6 символов</span>
            <input
              type="password"
              className={styles.input}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              minLength={6}
              required
            />
          </label>
          <button type="submit" className={styles.submit} disabled={loading}>
            Регистрация
          </button>
          <p className={styles.footer}>
            Уже есть аккаунт? <Link to="/login">Войти</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
