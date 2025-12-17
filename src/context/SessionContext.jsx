import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../firebase'

const SessionContext = createContext(null)
const USER_STORAGE_KEY = 'geneflow:user'
const THEME_STORAGE_KEY = 'geneflow:theme'

export function SessionProvider({ children }) {
    const [user, setUser] = useState(null)
    const [themeMode, setThemeMode] = useState(() => localStorage.getItem(THEME_STORAGE_KEY) || 'light')
    const [activePage, setActivePage] = useState('students')
    const [initializing, setInitializing] = useState(true)
    const [roleLoading, setRoleLoading] = useState(false) // Track role fetching separately

    useEffect(() => {
        localStorage.setItem(THEME_STORAGE_KEY, themeMode)
    }, [themeMode])

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                setRoleLoading(true)
                try {
                    // Get ID token to check user role (force refresh to get latest claims)
                    const idTokenResult = await firebaseUser.getIdTokenResult(true)
                    const role = idTokenResult?.claims?.role || null

                    const payload = {
                        uid: firebaseUser.uid,
                        email: firebaseUser.email,
                        displayName: firebaseUser.displayName,
                        role,
                    }
                    setUser(payload)
                    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(payload))
                } finally {
                    setRoleLoading(false)
                }
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
            roleLoading,
            themeMode,
            setThemeMode,
            toggleThemeMode,
            activePage,
            setActivePage,
        }),
        [user, initializing, roleLoading, themeMode, activePage],
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
