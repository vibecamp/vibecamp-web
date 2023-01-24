import getConfig from "next/config"
import { publicRuntimeConfig } from './next.config'

export const { BACK_END_ORIGIN } = getConfig().publicRuntimeConfig as typeof publicRuntimeConfig
