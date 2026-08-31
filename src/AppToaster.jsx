import { OverlayToaster, Position } from '@blueprintjs/core'

const appToaster = OverlayToaster.create({
  className: 'app-toaster',
  position: Position.TOP,
})

export const showToast = async options => {
  const toaster = await appToaster
  return toaster.show(options)
}
