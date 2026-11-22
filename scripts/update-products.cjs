const fs = require('fs');
let content = fs.readFileSync('src/data/products.ts', 'utf8');

const map = [
  { id: 'liquid-chrome-spider-hoodie', front: '/graphics/chrome-spider-front.png', back: '/graphics/chrome-spider.png' },
  { id: 'savage-gothic-hoodie', front: '/graphics/savage-front.png', back: '/graphics/savage.png' },
  { id: 'revelation-falling-angel-hoodie', front: '/graphics/revelation-front.png', back: '/graphics/revelation.png' },
  { id: 'tokyo-great-wave-hoodie', front: '/graphics/tokyo-wave-front.png', back: '/graphics/tokyo-wave.png' },
  { id: 'one-piece-sanji-hoodie', front: '/graphics/one-piece-front.png', back: '/graphics/one-piece.png' },
  { id: 'bare-winter-tree-hoodie', front: '/graphics/bare-tree-front.png', back: '/graphics/bare-tree.png' },
  { id: 'are-you-ok-hands-hoodie', front: '/graphics/are-you-ok-front.png', back: '/graphics/are-you-ok.png' },
  { id: 'merry-christmas-graffiti-hoodie', front: '/graphics/merry-christmas-front.png', back: '/graphics/merry-christmas.png' },
];

map.forEach(item => {
  const target = `graphicUrl: '${item.back}',`;
  const replacement = `graphicUrl: '${item.back}',\n    frontGraphicUrl: '${item.front}',\n    backGraphicUrl: '${item.back}',`;
  if (content.includes(target) && !content.includes(item.front)) {
    content = content.replace(target, replacement);
    console.log('Updated:', item.id);
  }
});

fs.writeFileSync('src/data/products.ts', content, 'utf8');
console.log('products.ts updated successfully');
