export type LabelSide = 'right' | 'left' | null

export type LabelInput = {
    x: number
    y: number
    width: number
    height: number
    preferred: LabelSide
}

type Rect = { left: number; top: number; right: number; bottom: number }

type PinShape = { width: number; height: number; headY: number }

const overlaps = (a: Rect, b: Rect) =>
    a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom

export function placeLabels(
    labels: readonly LabelInput[],
    order: readonly number[],
    pin: PinShape,
    gap: number,
    pinMargin: number,
    view: { width: number; height: number },
): LabelSide[] {
    const half = pin.width / 2
    const pins = labels.map(
        (l): Rect => ({ left: l.x - half, top: l.y - pin.height, right: l.x + half, bottom: l.y }),
    )
    const placed: Rect[] = []
    const sides: LabelSide[] = labels.map(() => null)

    for (const i of order) {
        const label = labels[i]
        if (!label) continue
        const top = label.y - pin.height + pin.headY - label.height / 2
        const bottom = top + label.height
        const right: [LabelSide, Rect] = [
            'right',
            { left: label.x + half + gap, top, right: label.x + half + gap + label.width, bottom },
        ]
        const left: [LabelSide, Rect] = [
            'left',
            { left: label.x - half - gap - label.width, top, right: label.x - half - gap, bottom },
        ]
        for (const [side, rect] of label.preferred === 'left' ? [left, right] : [right, left]) {
            // no margin on the side facing its own pin: a pin beyond it can't be mistaken for the one named
            const zone = {
                left: side === 'right' ? rect.left : rect.left - pinMargin,
                top: rect.top - pinMargin,
                right: side === 'left' ? rect.right : rect.right + pinMargin,
                bottom: rect.bottom + pinMargin,
            }
            const free =
                rect.left >= 0 &&
                rect.top >= 0 &&
                rect.right <= view.width &&
                rect.bottom <= view.height &&
                placed.every((p) => !overlaps(p, rect)) &&
                pins.every((p, j) => j === i || !overlaps(p, zone))
            if (free) {
                placed.push(rect)
                sides[i] = side
                break
            }
        }
    }
    return sides
}
