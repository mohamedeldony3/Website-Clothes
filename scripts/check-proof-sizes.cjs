const fs = require('fs');

// Check sizes of the captured proof images
const files = [
  'public/proof-mobile-hero.png',
  'public/proof-mobile-hero-back.png',
  'public/proof-mobile-fitting-lab.png',
  'public/proof-mobile-grid-2col.png',
  'public/proof-mobile-collections.png',
  'public/proof-mobile-product-modal.png'
];

files.forEach(f => {
  if (fs.existsSync(f)) {
    const s = fs.statSync(f);
    console.log(f, 'exists, size:', s.size);
  } else {
    console.log(f, 'DOES NOT EXIST');
  }
});
