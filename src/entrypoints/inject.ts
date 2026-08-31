import { injectAll } from '@/Browser/Inject'
import { defineUnlistedScript } from 'wxt/utils/define-unlisted-script'

export default defineUnlistedScript(() => injectAll())
