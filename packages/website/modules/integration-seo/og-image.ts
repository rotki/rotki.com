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

/**
 * Renders a 1200x630 Open Graph card for an integration using Satori (HTML/flexbox -> SVG)
 * and resvg (SVG -> PNG). Runs at build time inside the prerender hook.
 */
export async function renderOgImage({ label, tagline, typeLabel, fonts }: OgImageOptions): Promise<Buffer> {
  const element = {
    type: 'div',
    props: {
      style: {
        width: '1200px',
        height: '630px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '80px',
        backgroundColor: '#faf6f3',
        fontFamily: 'Roboto',
      },
      children: [
        {
          type: 'div',
          props: {
            style: { display: 'flex' },
            children: [
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    backgroundColor: '#4e352e',
                    color: '#ffffff',
                    fontSize: '28px',
                    fontWeight: 700,
                    letterSpacing: '2px',
                    textTransform: 'uppercase',
                    padding: '10px 26px',
                    borderRadius: '9999px',
                  },
                  children: typeLabel,
                },
              },
            ],
          },
        },
        {
          type: 'div',
          props: {
            style: { display: 'flex', flexDirection: 'column' },
            children: [
              {
                type: 'div',
                props: {
                  style: { fontSize: '92px', fontWeight: 700, color: '#2d1e1c', lineHeight: 1.05 },
                  children: label,
                },
              },
              {
                type: 'div',
                props: {
                  style: { fontSize: '40px', color: '#6b5d57', marginTop: '28px', maxWidth: '1000px', lineHeight: 1.3 },
                  children: tagline,
                },
              },
            ],
          },
        },
        {
          type: 'div',
          props: {
            style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
            children: [
              {
                type: 'div',
                props: {
                  style: { fontSize: '46px', fontWeight: 700, color: '#4e352e' },
                  children: 'rotki',
                },
              },
              {
                type: 'div',
                props: {
                  style: { display: 'flex', width: '200px', height: '12px', backgroundColor: '#e45325', borderRadius: '9999px' },
                },
              },
            ],
          },
        },
      ],
    },
  };

  const svg = await satori(element as Parameters<typeof satori>[0], {
    width: 1200,
    height: 630,
    fonts: [
      { name: 'Roboto', data: fonts.regular, weight: 400, style: 'normal' },
      { name: 'Roboto', data: fonts.bold, weight: 700, style: 'normal' },
    ],
  });

  return Buffer.from(new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng());
}
