import { NavLink } from "https://raw.githubusercontent.com/vibecamp/vibecamp-web/main/common/data.ts";
import { borrowConnection } from "./connection-pool.ts";

export async function getNavLinks(): Promise<readonly NavLink[]> {
    return await borrowConnection(async conn => {
        const res = await conn.queryObject<NavLink>(`
                SELECT (href, label, nav_order)
                FROM nav_links;
            `
        )

        return res.rows
    })
}

export async function updateNavLink(navLinks: readonly NavLink[]): Promise<void> {
    await borrowConnection(async conn => {
        for (const navLink of navLinks) {
            await conn.queryObject(`
                INSERT INTO nav_links VALUES ($1, $2, $3)
                ON CONFLICT (href) DO UPDATE SET href = $1, label = $2, nav_order = $3;
                `,
                [navLink.href, navLink.label, navLink.nav_order]
            )
        }
    })
}
