import { borrowConnection } from "./connection-pool.ts"
import { Page, PermissionLevel } from 'https://raw.githubusercontent.com/vibecamp/vibecamp-web/main/common/data.ts'

export async function getPages(): Promise<readonly Page[]> {
    return await borrowConnection(async conn => {
        const res = await conn.queryObject<Page>(`
                SELECT 
                    page_id, 
                    title, 
                    content, 
                FROM pages;
            `
        )

        return res.rows
    })
}

export async function updatePage(page: Page): Promise<void> {
    await borrowConnection(async conn => {
        await conn.queryObject(`
            INSERT INTO pages VALUES ($1, $2, $3)
            ON CONFLICT (page_id) DO UPDATE SET page_id = $1, title = $2, content = $3;
            `,
            [page.page_id, page.title, page.content]
        )
    })
}
