/**
 * Representative, exact color=2 (Universal Blue) values from RainViewer's
 * official color table: https://www.rainviewer.com/api/color-schemes.html
 * Source tiles remain unmodified. dBZ is reflectivity, not a rain rate.
 */
export const RADAR_LEGEND = [
  {min: -10, max: 10, color: '#005a00', label: 'Zeer zwak', range: '−10–9 dBZ'},
  {min: 10, max: 20, color: '#087fdb', label: 'Zwak', range: '10–19 dBZ'},
  {min: 20, max: 35, color: '#006295', label: 'Matig', range: '20–34 dBZ'},
  {min: 35, max: 40, color: '#ffee00', label: 'Sterk', range: '35–39 dBZ'},
  {min: 40, max: 45, color: '#ffaa00', label: 'Zeer sterk', range: '40–44 dBZ'},
  {min: 45, max: 55, color: '#ff4400', label: 'Intens', range: '45–54 dBZ'},
  {min: 55, max: Infinity, color: '#ffaaff', label: 'Extreem', range: '55+ dBZ'},
] as const;
