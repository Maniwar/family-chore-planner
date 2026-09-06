const fs = require('fs');

const cx = 256;
const cy = 256;
const outerRadius = 150;
const innerRadius = 70;

let points = [];
for (let i = 0; i < 10; i++) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = (Math.PI * 2 * i) / 10 - Math.PI / 2;
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);
    points.push(`${x},${y}`);
}
const starPath = `M ${points.join(' L ')} Z`;

const svg = `<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" rx="116" fill="url(#bg_gradient)"/>
  
  <!-- Shadow -->
  <path d="${starPath}" fill="#92400e" filter="url(#blur)" transform="translate(0, 12)" opacity="0.5"/>
  
  <!-- Star -->
  <path d="${starPath}" fill="url(#star_gradient)"/>
  
  <!-- Inner Highlight -->
  <path d="${starPath}" stroke="white" stroke-width="2" stroke-opacity="0.5"/>

  <!-- Checkmark -->
  <path d="M206 270 L236 300 L316 210" stroke="white" stroke-width="32" stroke-linecap="round" stroke-linejoin="round" filter="url(#check_shadow)"/>
  
  <defs>
    <filter id="blur" x="0" y="0" width="512" height="512" filterUnits="userSpaceOnUse">
      <feGaussianBlur stdDeviation="12"/>
    </filter>
    <filter id="check_shadow" x="180" y="190" width="180" height="180" filterUnits="userSpaceOnUse">
      <feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#000000" flood-opacity="0.25" />
    </filter>
    
    <linearGradient id="bg_gradient" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
      <stop stop-color="#6366f1"/>
      <stop offset="1" stop-color="#4f46e5"/>
    </linearGradient>
    
    <linearGradient id="star_gradient" x1="256" y1="106" x2="256" y2="406" gradientUnits="userSpaceOnUse">
      <stop stop-color="#fef08a"/>
      <stop offset="0.4" stop-color="#f59e0b"/>
      <stop offset="1" stop-color="#d97706"/>
    </linearGradient>
  </defs>
</svg>`;

if (!fs.existsSync('public')) {
    fs.mkdirSync('public');
}
fs.writeFileSync('public/favicon.svg', svg);
console.log('Favicon generated successfully!');
