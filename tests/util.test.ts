import { describe, expect, it } from 'vitest';
import { compareSemanticVersion } from '../src/utils/index';
import { getChunkByHtml } from '../src/utils/index';

describe('compareSemanticVersion', () => {
  it('should return 0 for the same version', () => {
    expect(compareSemanticVersion('1.0.0', '1.0.0')).toBe(0);
  });

  it('should return 1 for a newer major version', () => {
    expect(compareSemanticVersion('2.0.0', '1.0.0')).toBe(1);
  });

  it('should return -1 for an older major version', () => {
    expect(compareSemanticVersion('1.0.0', '2.0.0')).toBe(-1);
  });

  it('should return 1 for a newer minor version', () => {
    expect(compareSemanticVersion('1.2.0', '1.1.0')).toBe(1);
  });

  it('should return -1 for an older minor version', () => {
    expect(compareSemanticVersion('1.1.0', '1.2.0')).toBe(-1);
  });

  it('should return 1 for a newer patch version', () => {
    expect(compareSemanticVersion('1.0.1', '1.0.0')).toBe(1);
  });

  it('should return -1 for an older patch version', () => {
    expect(compareSemanticVersion('1.0.0', '1.0.1')).toBe(-1);
  });

  it('should return 0 for equal versions with different lengths', () => {
    expect(compareSemanticVersion('1.0.0', '1.0')).toBe(0);
  });

  it('should return 1 for a newer versions with different lengths', () => {
    expect(compareSemanticVersion('2', '1.0.0')).toBe(1);
  });

  it('should return -1 for newer versions with different lengths', () => {
    expect(compareSemanticVersion('1.0.0', '2')).toBe(-1);
  });
});

describe('getChunkByHtml', () => {
  it('should use the default name "index" when no name is provided', () => {
    const htmlText = `<script type="module" crossorigin src="/assets/index.065a65a6.js"></script>`;
    expect(getChunkByHtml(htmlText)).toBe('/assets/index.065a65a6.js');
  });

  it('should use the default name "index" when no name is provided', () => {
    const htmlText = `<script type="module" crossorigin src="/assets/index-DsF0052S.js"></script>`;
    expect(getChunkByHtml(htmlText)).toBe('/assets/index-DsF0052S.js');
  });

  it('should return undefined when chunkName is not found', () => {
    const htmlText = `<script src="/assets/js/app.4a791ed2.js"></script>`;
    expect(getChunkByHtml(htmlText)).toBeUndefined();
  });
  // vue2-app
  it('should return the src attribute when chunkName is found', () => {
    const htmlText = `<html>
      <script src=/static/js/app.4a791ed2.js></script>
    </html>`;
    expect(getChunkByHtml(htmlText, 'app')).toBe('/static/js/app.4a791ed2.js');
  });
  // vite+vue3
  it('should return the src attribute when chunkName is found', () => {
    const htmlText = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <link rel="icon" href="/favicon.ico">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Vite App</title>
    <script type="module" crossorigin src="/assets/index-27a955ae.js"></script>
    <link rel="stylesheet" href="/assets/index-ea22b3b2.css">
  </head>
  <body>
    <div id="app"></div>
    
  </body>
</html>`;
    expect(getChunkByHtml(htmlText, 'index')).toBe('/assets/index-27a955ae.js');
  });
  // vite dev
  it('should return the src attribute when chunkName is found', () => {
    const htmlText = `<!DOCTYPE html>
<html lang="en">
  <head>
    <script type="module" src="/@vite/client"></script>

    <meta charset="UTF-8">
    <link rel="icon" href="/favicon.ico">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Vite App</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts?t=1737082747245"></script>
  </body>
</html>`;
    expect(getChunkByHtml(htmlText, 'main')).toBe(
      '/src/main.ts?t=1737082747245',
    );
  });
});
