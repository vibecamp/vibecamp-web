import MarkdownIt from "markdown-it"

const md = new MarkdownIt()

export function renderMarkdown(markdown: string): string {
    return md.render(markdown)
}