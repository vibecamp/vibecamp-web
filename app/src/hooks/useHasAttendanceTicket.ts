import { useStore } from './useStore'
export default function useHasAttendanceTicket(): boolean | undefined {
    return useStore().accountInfo.state.result?.owned_tickets.some((p) => p.is_attendance_ticket)
}
