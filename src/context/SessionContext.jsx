import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../firebase'

const SessionContext = createContext(null)
const USER_STORAGE_KEY = 'geneflow:user'
const THEME_STORAGE_KEY = 'geneflow:theme'

export function SessionProvider({ children }) {
    const [user, setUser] = useState(() => {
        try {
            const cached = localStorage.getItem(USER_STORAGE_KEY)
            return cached ? JSON.parse(cached) : null
        } catch (error) {
            console.warn('Failed to read cached user', error)
            return null
        }
    })
    const [themeMode, setThemeMode] = useState(() => localStorage.getItem(THEME_STORAGE_KEY) || 'light')
    const [activePage, setActivePage] = useState('students')
    const [initializing, setInitializing] = useState(true)

    useEffect(() => {
        localStorage.setItem(THEME_STORAGE_KEY, themeMode)
    }, [themeMode])

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                // Get ID token to check user role
                const idTokenResult = await firebaseUser.getIdTokenResult()
                const role = idTokenResult?.claims?.role || null

                const payload = {
                    uid: firebaseUser.uid,
                    email: firebaseUser.email,
                    displayName: firebaseUser.displayName,
                    role,
                }
                setUser(payload)
                localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(payload))
            } else {
                setUser(null)
                localStorage.removeItem(USER_STORAGE_KEY)
            }
            setInitializing(false)
        })

        return unsubscribe
    }, [])

    const toggleThemeMode = () => setThemeMode((prev) => (prev === 'light' ? 'dark' : 'light'))

    const value = useMemo(
        () => ({
            user,
            setUser,
            initializing,
            themeMode,
            setThemeMode,
            toggleThemeMode,
            activePage,
            setActivePage,
        }),
        [user, initializing, themeMode, activePage],
    )

    return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession() {
    const context = useContext(SessionContext)
    if (!context) {
        throw new Error('useSession must be used within a SessionProvider')
    }
    return context
}
