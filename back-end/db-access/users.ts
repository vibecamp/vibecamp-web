import { borrowConnection } from "./connection-pool.ts"
import { User } from 'https://raw.githubusercontent.com/vibecamp/vibecamp-web/main/common/data/pages.ts'
import { compare, hash } from '../deps/bcrypt.ts'

export async function authenticateByEmail({ email, password }: { email: string, password: string }): Promise<User | undefined> {
    const user = await borrowConnection(async conn => {
        const res = await conn.queryObject<User>(`
                SELECT 
                    user_id,
                    user_name,
                    permission_level_name AS permission_level,
                    email,
                    password_hash,
                    password_salt
                FROM users, permission_levels
                WHERE 
                    email = $1 AND
                    users.permission_level_id = permission_levels.permission_level_id
            `,
            [email]
        )

        return res.rows[0] as User | undefined
    })

    if (user == null || user.password_hash == null) {
        return undefined
    }

    const saltedPassword = password + user.password_salt
    const passwordMatches = await compare(saltedPassword, user.password_hash)
    if (passwordMatches) {
        return user
    } else {
        return undefined
    }
}

export async function createUserByEmail({ email, password }: { email: string, password: string }): Promise<void> {
    const salt = crypto.randomUUID()
    const saltedPassword = password + salt
    const passwordHash = await hash(saltedPassword)

    await borrowConnection(conn => {
        return conn.queryObject(`
                INSERT INTO users (user_name, email, password_hash, password_salt, permission_level_id)
                VALUES ($1, $1, $2, $3, 1)
            `,
            [email, email, passwordHash, salt]
        )
    })
}
