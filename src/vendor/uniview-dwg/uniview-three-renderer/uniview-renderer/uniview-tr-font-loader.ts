import { DefaultFontLoader } from '@uniview/mtext-renderer'

import { UvTrMTextRenderer } from './uniview-tr-m-text-renderer'

export class UvTrFontLoader extends DefaultFontLoader {
  onFontUrlChanged(url: string): void {
    UvTrMTextRenderer.getInstance().setFontUrl(url)
  }
}
