// Aggressive compression for the hero/OG illustration. Drops sub-pixel precision
// (the viewBox is 1600×900 so integer coords are plenty) and prunes editor cruft.
export default {
  multipass: true,
  floatPrecision: 0,
  plugins: [
    {
      name: 'preset-default',
      params: {
        overrides: {
          removeViewBox: false,
          cleanupNumericValues: { floatPrecision: 0 },
          convertPathData: { floatPrecision: 0, transformPrecision: 0 },
          convertTransform: { floatPrecision: 0, transformPrecision: 0 },
        },
      },
    },
    'removeDimensions',
    'removeOffCanvasPaths',
    // reusePaths is disabled — it can produce broken <use> references when an
    // extracted path id collides with the existing element ordering.
    'sortAttrs',
  ],
}
