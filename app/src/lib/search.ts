const normalize = (text: string) => text.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase()

const wordsOf = (text: string) =>
    normalize(text)
        .split(/[^\p{L}\p{N}]+/u)
        .filter(Boolean)

export function matchesSearch(text: string, query: string): boolean {
    const terms = wordsOf(query)
    if (terms.length === 0) return true
    if (normalize(text).includes(normalize(query).trim())) return true
    const words = wordsOf(text)
    const used = new Set<number>()
    // each term must sit inside a different word, so "cab c" finds Cabin ABCD but not Cabin EF
    const assign = (i: number): boolean => {
        const term = terms[i]
        if (term == null) return true
        return words.some((word, j) => {
            if (used.has(j) || !word.includes(term)) return false
            used.add(j)
            if (assign(i + 1)) return true
            used.delete(j)
            return false
        })
    }
    return assign(0)
}
