import { borrowConnection } from "./connection-pool.ts"
import { Page, PermissionLevel, PERMISSION_LEVELS } from 'https://raw.githubusercontent.com/vibecamp/vibecamp-web/main/common/data/pages.ts'

export async function getAllPages(permissionLevel: PermissionLevel): Promise<readonly Page[]> {
    return await borrowConnection(async conn => {
        const res = await conn.queryObject<Page>(`
                SELECT 
                    page_id, 
                    title, 
                    content, 
                    permission_level_name AS permission_level
                FROM pages, permission_levels
                WHERE pages.permission_level_id = permission_levels.permission_level_id AND permission_level_name = $1;
            `,
            [permissionLevel]
        )

        return res.rows
    })
}

export async function updatePage(page: Page): Promise<void> {
    await borrowConnection(async conn => {
        await conn.queryObject(`
            INSERT INTO pages VALUES ($1, $2, $3, $4)
            ON CONFLICT (page_id) DO UPDATE SET page_id = $1, title = $2, content = $3, permission_level_id = $4;
            `,
            [page.page_id, page.title, page.content, PERMISSION_LEVELS.indexOf(page.permission_level) + 1]
        )
    })
}
