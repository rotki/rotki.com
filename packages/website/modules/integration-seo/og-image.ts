import { Buffer } from 'node:buffer';
import { Resvg } from '@resvg/resvg-js';
import satori from 'satori';

export interface OgFonts {
  regular: Buffer;
  bold: Buffer;
}

interface OgImageOptions {
  label: string;
  tagline: string;
  typeLabel: string;
  fonts: OgFonts;
}

type OgStyle = Record<string, string | number>;

type OgChild = OgElement | string;

/**
 * `ReactElement`-shaped div node satori consumes. We hand-build these instead of
 * importing React or satori's `satori/jsx` `createElement` (which always wraps
 * children in an array and so trips satori's flex-layout validation). The explicit
 * `key` is what makes the literal structurally a `ReactElement`, so it is assignable
 * to satori's `ReactNode` parameter without a cast.
 */
interface OgElement {
  type: 'div';
  key: string | null;
  props: {
    style: OgStyle;
    children?: OgChild | OgChild[];
  };
}

function el(style: OgStyle, children?: OgChild | OgChild[]): OgElement {
  return {
    type: 'div',
    key: null,
    props: children === undefined ? { style } : { style, children },
  };
}

/**
 * Renders a 1200x630 Open Graph card for an integration using Satori (HTML/flexbox -> SVG)
 * and resvg (SVG -> PNG). Runs at build time inside the prerender hook.
 */
export async function renderOgImage({ label, tagline, typeLabel, fonts }: OgImageOptions): Promise<Buffer> {
  const element = el(
    {
      width: '1200px',
      height: '630px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '80px',
      backgroundColor: '#faf6f3',
      fontFamily: 'Roboto',
    },
    [
      el({ display: 'flex' }, [
        el({
          display: 'flex',
          backgroundColor: '#4e352e',
          color: '#ffffff',
          fontSize: '28px',
          fontWeight: 700,
          letterSpacing: '2px',
          textTransform: 'uppercase',
          padding: '10px 26px',
          borderRadius: '9999px',
        }, typeLabel),
      ]),
      el({ display: 'flex', flexDirection: 'column' }, [
        el({ fontSize: '92px', fontWeight: 700, color: '#2d1e1c', lineHeight: 1.05 }, label),
        el({ fontSize: '40px', color: '#6b5d57', marginTop: '28px', maxWidth: '1000px', lineHeight: 1.3 }, tagline),
      ]),
      el({ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }, [
        el({ fontSize: '46px', fontWeight: 700, color: '#4e352e' }, 'rotki'),
        el({ display: 'flex', width: '200px', height: '12px', backgroundColor: '#e45325', borderRadius: '9999px' }),
      ]),
    ],
  );

  const svg = await satori(element, {
    width: 1200,
    height: 630,
    fonts: [
      { name: 'Roboto', data: fonts.regular, weight: 400, style: 'normal' },
      { name: 'Roboto', data: fonts.bold, weight: 700, style: 'normal' },
    ],
  });

  return Buffer.from(new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng());
}
