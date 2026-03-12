import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { FiHome, FiDisc, FiUsers, FiRepeat, FiUser, FiMenu, FiX } from 'react-icons/fi'
import { api, getToken } from '@/lib/api'
import styles from './Header.module.css'

const nav = [
  { to: '/', key: 'home', Icon: FiHome },
  { to: '/collection', key: 'collection', Icon: FiDisc },
  { to: '/friends', key: 'friends', Icon: FiUsers },
  { to: '/exchanges', key: 'exchanges', Icon: FiRepeat },
]

export function Header() {
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.users.me(),
    enabled: !!getToken(),
  })

  if (!getToken()) return null

  const lang = user?.language ?? 'ru'
  const isEn = lang === 'en'

  const getLabel = (key: string) =>
    key === 'home'
      ? isEn ? 'Home' : 'Главная'
      : key === 'collection'
        ? isEn ? 'Collection' : 'Коллекция'
        : key === 'friends'
          ? isEn ? 'Friends' : 'Друзья'
          : isEn ? 'Exchanges' : 'Обмены'

  return (
    <header className={styles.header}>
      <button
        type="button"
        className={styles.burger}
        onClick={() => setMenuOpen(true)}
        aria-label={isEn ? 'Open menu' : 'Открыть меню'}
      >
        <FiMenu size={24} aria-hidden />
      </button>
      <Link to="/" className={styles.logo}>
        <span className={styles.logoIcon} aria-hidden />
        <span className={styles.logoText}>VinylHub</span>
      </Link>
      <div className={styles.spacer} />
      <div className={styles.actions}>
        <Link to="/profile" className={styles.user}>
          <FiUser className={styles.userIcon} size={18} aria-hidden />
          <span className={styles.userName}>{user?.username ?? '…'}</span>
        </Link>
      </div>

      {/* Выдвижная панель навигации */}
      <div
        className={`${styles.drawerOverlay} ${menuOpen ? styles.drawerOverlayOpen : ''}`}
        onClick={() => setMenuOpen(false)}
        aria-hidden={!menuOpen}
      />
      <aside className={`${styles.drawer} ${menuOpen ? styles.drawerOpen : ''}`} aria-label={isEn ? 'Navigation' : 'Навигация'}>
        <div className={styles.drawerHeader}>
          <span className={styles.drawerTitle}>{isEn ? 'Menu' : 'Меню'}</span>
          <button
            type="button"
            className={styles.drawerClose}
            onClick={() => setMenuOpen(false)}
            aria-label={isEn ? 'Close menu' : 'Закрыть меню'}
          >
            <FiX size={24} aria-hidden />
          </button>
        </div>
        <nav className={styles.drawerNav}>
          {nav.map(({ to, key, Icon }) => {
            const active = location.pathname === to || (to !== '/' && location.pathname.startsWith(to))
            return (
              <Link
                key={to}
                to={to}
                className={active ? `${styles.drawerLink} ${styles.drawerLinkActive}` : styles.drawerLink}
                onClick={() => setMenuOpen(false)}
              >
                <Icon className={styles.drawerLinkIcon} size={20} aria-hidden />
                <span>{getLabel(key)}</span>
              </Link>
            )
          })}
        </nav>
      </aside>
    </header>
  )
}
