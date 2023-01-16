import useViewportSize from "./useViewportSize";

export default function useIsOnMobile() {
    return useViewportSize().width < 650
}