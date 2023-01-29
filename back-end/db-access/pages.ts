import { borrowConnection } from "./connection-pool.ts"
import { Page, PermissionLevel, PERMISSION_LEVELS } from 'https://raw.githubusercontent.com/vibecamp/vibecamp-web/main/common/data.ts'

export async function getPages(permissionLevel: PermissionLevel): Promise<readonly Page[]> {
    return await borrowConnection(async conn => {
        const res = await conn.queryObject<Page>(`
                SELECT 
                    page_id, 
                    title, 
                    content, 
                    permission_level_name AS permission_level
                FROM pages, permission_levels
                WHERE pages.permission_level_id <= $1 AND pages.permission_level_id = permission_levels.permission_level_id;
            `,
            [permissionLevelId(permissionLevel)]
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
            [page.page_id, page.title, page.content, permissionLevelId(page.permission_level)]
        )
    })
}

// small HACK
const permissionLevelId = (permissionLevel: PermissionLevel) => PERMISSION_LEVELS.indexOf(permissionLevel) + 1