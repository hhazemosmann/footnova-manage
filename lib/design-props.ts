/* Design-time props from the export's `data-props` block. In the Claude
 * Design editor these were adjustable knobs; the page itself never exposed
 * UI for them. Baked to their declared defaults, with the branches that read
 * them left intact so re-enabling one is a one-line change here.
 *
 *   funnelMode      enum   'reached' | 'current'   default 'reached'
 *   showConversion  bool                           default true
 *   accentColor     color  #0F52BA|#2C3A5E|#2E8B67|#D6A13A   default #0F52BA
 *   zebraRows       bool                           default true
 */

export const FUNNEL_MODE: 'reached' | 'current' = 'reached';
export const SHOW_CONVERSION: boolean = true;
export const ACCENT_COLOR: string = '#0F52BA';
export const ZEBRA_ROWS: boolean = true;
