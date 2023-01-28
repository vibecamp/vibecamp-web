import { Page } from 'https://raw.githubusercontent.com/vibecamp/vibecamp-web/main/common/data/pages.ts'
import { borrowConnection } from "./connection-pool.ts"

export async function getAllPages(): Promise<readonly Page[]> {
    return await borrowConnection(async conn => {
        const res = await conn.queryObject(`
            SELECT 
                page_id, 
                title, 
                content, 
                visibility_level_name AS visibility_level
            FROM pages, visibility_levels
            WHERE pages.visibility_level_id = visibility_levels.visibility_level_id;
        `)

        return res.rows as Page[]
    })
}
