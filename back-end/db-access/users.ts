import { borrowConnection } from "./connection-pool.ts"
import { User } from 'https://raw.githubusercontent.com/vibecamp/vibecamp-web/main/common/data.ts'
import { compare, hash } from '../deps/bcrypt.ts'

export async function authenticateByEmail({ email, password }: { email: string, password: string }): Promise<User | undefined> {
    const user = await borrowConnection(async conn => {
        const res = await conn.queryObject<User>(`
                SELECT 
                    user_id,
                    email,
                    password_hash,
                    password_salt,
                    twitter_name,
                    name,
                    is_content_admin,
                    is_account_admin
                FROM users
                WHERE email = $1;
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
                INSERT INTO users (email, password_hash, password_salt)
                VALUES ($1, $2, $3)
            `,
            [email, email, passwordHash, salt]
        )
    })
}
