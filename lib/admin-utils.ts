import sql from './db'

/**
 * Check if a user has admin role
 * @param userId - The user's ID from Clerk
 * @returns boolean - true if user is admin
 */
export async function isAdmin(userId: string): Promise<boolean> {
  try {
    const [user] = await sql`
      SELECT role FROM users WHERE userid = ${userId}
    `
    return user?.role === 'admin'
  } catch (error) {
    console.error('Error checking admin status:', error)
    return false
  }
}

/**
 * Require admin role or throw error
 * Use this in API routes that need admin protection
 */
export async function requireAdmin(userId: string | null): Promise<void> {
  if (!userId) {
    throw new Error('Unauthorized: No user ID provided')
  }
  
  const isAdminUser = await isAdmin(userId)
  if (!isAdminUser) {
    throw new Error('Forbidden: Admin access required')
  }
}
