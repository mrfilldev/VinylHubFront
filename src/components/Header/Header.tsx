import { Link, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { FiHome, FiDisc, FiUsers, FiRepeat, FiUser } from 'react-icons/fi'
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
  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.users.me(),
    enabled: !!getToken(),
  })

  if (!getToken()) return null

  const lang = user?.language ?? 'ru'
  const isEn = lang === 'en'

  return (
    <header className={styles.header}>
      <Link to="/" className={styles.logo}>
        <span className={styles.logoIcon} aria-hidden />
        <span>VinylHub</span>
      </Link>
      <nav className={styles.nav}>
        {nav.map(({ to, key, Icon }) => {
          const label =
            key === 'home'
              ? isEn ? 'Home' : 'Главная'
              : key === 'collection'
                ? isEn ? 'Collection' : 'Коллекция'
                : key === 'friends'
                  ? isEn ? 'Friends' : 'Друзья'
                  : isEn ? 'Exchanges' : 'Обмены'
        return (
          <Link
            key={to}
            to={to}
            className={location.pathname === to || (to !== '/' && location.pathname.startsWith(to)) ? styles.navActive : undefined}
          >
            <span className={styles.navIcon} aria-hidden>
              <Icon />
            </span>
            {label}
          </Link>
        )})}
      </nav>
      <div className={styles.actions}>
        <Link to="/profile" className={styles.user}>
          <FiUser className={styles.userIcon} size={18} aria-hidden />
          {user?.username ?? '…'}
        </Link>
      </div>
    </header>
  )
}
