'use client'
import { useParams } from 'next/navigation'
import PurchaseFlow from '@/components/tickets/PurchaseFlow'
export default function BuyTicketsPage() {
    const { festivalId } = useParams<{ festivalId: string }>()
    return <PurchaseFlow festivalId={festivalId} />
}
