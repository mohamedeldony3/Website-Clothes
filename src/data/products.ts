import { Product, ProductColor } from '../types';

export const ATELIER_COLOR_PALETTE: ProductColor[] = [
  { name: 'Onyx Black', nameAr: 'أسود أونيكس', hex: '#111111', threeColor: '#151515' },
  { name: 'Washed Charcoal', nameAr: 'فحمي مغسول', hex: '#2C2C2C', threeColor: '#353535' },
  { name: 'Chalk White', nameAr: 'أبيض طباشيري', hex: '#F7F7F7', threeColor: '#F0EEEA' },
  { name: 'Raw Oatmeal Bone', nameAr: 'عاجي شوفان طبيعي', hex: '#DCD7CD', threeColor: '#DAD4C8' },
  { name: 'Dark Chocolate Brown', nameAr: 'بني شوكولاتة داكن', hex: '#3D261C', threeColor: '#5E3925' },
  { name: 'Warm Mocha Brown', nameAr: 'بني موكا دافئ', hex: '#5E4230', threeColor: '#725039' },
  { name: 'Forest Emerald Pine', nameAr: 'أخضر غابات زمردي', hex: '#1D4A38', threeColor: '#26634C' },
  { name: 'Acid Moss Olive', nameAr: 'زيتي حمضي معتق', hex: '#4A5636', threeColor: '#586B3E' },
  { name: 'Oxblood Burgundy', nameAr: 'عنابي نبيتي داكن', hex: '#521422', threeColor: '#72192E' },
  { name: 'Rich Maroon Wine', nameAr: 'مارون نبيتي غني', hex: '#5C1728', threeColor: '#7F2038' },
  { name: 'Midnight Navy', nameAr: 'كحلي ليلي داكن', hex: '#162438', threeColor: '#243B5E' },
];

export const PRODUCTS: Product[] = [
  {
    id: 'liquid-chrome-spider-hoodie',
    name: 'LIQUID CHROME SPIDER TECH HOODIE',
    nameAr: 'هودي العنكبوت الكرومي ثلاثي الأبعاد أسود',
    category: 'new-arrivals',
    price: 1850,
    originalPrice: 2300,
    description: 'Constructed from ultra-dense 520 GSM Egyptian organic cotton. Features hyper-reflective metallic liquid chrome 3D spider graphic across the back, extreme dropped shoulders, double-layered architectural hood, and deep loopback thermal interior.',
    descriptionAr: 'مصنوع من قطن مصري عضوي ثقيل للغاية بوزن 520 جرام لكل متر مربع. يتميز بطباعة عنكبوت كروم معدني ثلاثي الأبعاد عاكس للضوء على الظهر، وأكتاف ساقطة عريضة، وقلنسوة مزدوجة بتصميم معماري يحافظ على انسيابية القوام.',
    details: [
      '520 GSM Heavyweight Loopback Egyptian Cotton',
      'High-gloss 3D liquid chrome back screenprint',
      'Architectural double-ply hood without drawstring clutter',
      'Pre-shrunk, deep garment-dyed in void black',
      'Reinforced bar-tack rivets on kangaroo pouch'
    ],
    detailsAr: [
      'قطن مصري ثقيل 520 جرام/م² فائق النعومة والمقاومة',
      'طباعة ظهر ثلاثية الأبعاد بلمعان الكروم السائل العاكس',
      'قلنسوة مزدوجة الطبقات تظل منتصبة بشكل معماري',
      'معالج ضد الانكماش ومصبوغ بالأسود العميق الفاخر',
      'جيب كنغر عميق معزز بغرز التثبيت المقاومة للتمزق'
    ],
    fabric: '100% Ultra-Heavy Egyptian Combed Cotton',
    fabricAr: '100% قطن مصري ممشط ثقيل فائق الجودة',
    weightGsm: 520,
    fit: 'Exaggerated Boxy Fit',
    fitAr: 'قصة واسعة بوكسي عريضة',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: [
      { name: 'Onyx Black', nameAr: 'أسود أونيكس', hex: '#111111', threeColor: '#141414' },
      { name: 'Washed Charcoal', nameAr: 'فحمي مغسول', hex: '#2C2C2C', threeColor: '#303030' },
      { name: 'Chalk White', nameAr: 'أبيض طباشيري', hex: '#F7F7F7', threeColor: '#EBE9E2' },
      { name: 'Forest Emerald Pine', nameAr: 'أخضر غابات زمردي', hex: '#1D4A38', threeColor: '#235D46' },
      { name: 'Oxblood Burgundy', nameAr: 'عنابي نبيتي داكن', hex: '#521422', threeColor: '#631829' },
      { name: 'Dark Chocolate Brown', nameAr: 'بني شوكولاتة داكن', hex: '#3D261C', threeColor: '#4A2F22' }
    ],
    images: [
      '/products/chrome-spider-black.webp',
      'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=1200&q=85'
    ],
    graphicUrl: '/graphics/chrome-spider.png',
    frontGraphicUrl: '/graphics/chrome-spider-front.png',
    backGraphicUrl: '/graphics/chrome-spider.png',
    badge: 'NEW DROP',
    badgeAr: 'إصدار جديد',
    has3DModel: true,
    featured: true
  },
  {
    id: 'savage-gothic-hoodie',
    name: 'SAVAGE GOTHIC METAL HEAVYWEIGHT HOODIE',
    nameAr: 'هودي سافاج الثقيل جوثيك ميتال بني',
    category: 'new-arrivals',
    price: 1650,
    originalPrice: 1950,
    description: 'Deep espresso chocolate brown streetwear foundation with high-density distressed gothic metal "SAVAGE" back print surrounded by barbed electric fissure detailing. Heavy Egyptian loopback fleece with ribbed cuffs and hem.',
    descriptionAr: 'هودي بلون بني شوكولاتة داكن من نسيج قطني مصري ثقيل. مزين بطباعة جوثيك ميتال بارزة لكلمة "SAVAGE" على الظهر محاطة بتفاصيل تشققات البرق الشائكة. خياطة معززة وأساور مضلعة متينة.',
    details: [
      '500 GSM Heavy Egyptian Loopback Terry',
      'High-density discharge gothic puff print on back',
      'Deep chocolate brown rich tonal wash',
      'Custom gunmetal cord aglets',
      'Discreet side-seam woven studio label'
    ],
    detailsAr: [
      'قطن مصري ثقيل 500 جرام/م² فائق الدفء والمتانة',
      'طباعة جوثيك بارزة عالية الكثافة على الظهر بالكامل',
      'صبغة بني إسبريسو غنية معالجة ضد بهتان الألوان',
      'أربطة مزودة بأطراف معدنية بلون برونزي داكن',
      'ملصق ستوديو منسوج بدقة على الدرز الجانبي'
    ],
    fabric: '100% Heavy Egyptian Combed Terry Cotton',
    fabricAr: '100% قطن مصري ممشط تيري ثقيل',
    weightGsm: 500,
    fit: 'Relaxed Streetwear Drop-Shoulder',
    fitAr: 'قصة فضفاضة بأكتاف ساقطة',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: [
      { name: 'Dark Chocolate Brown', nameAr: 'بني شوكولاتة داكن', hex: '#3D261C', threeColor: '#4A2F22' },
      { name: 'Warm Mocha Brown', nameAr: 'بني موكا دافئ', hex: '#5E4230', threeColor: '#6E4E39' },
      { name: 'Onyx Black', nameAr: 'أسود أونيكس', hex: '#111111', threeColor: '#141414' },
      { name: 'Washed Charcoal', nameAr: 'فحمي مغسول', hex: '#2C2C2C', threeColor: '#303030' },
      { name: 'Raw Oatmeal Bone', nameAr: 'عاجي شوفان طبيعي', hex: '#DCD7CD', threeColor: '#D3CCC0' },
      { name: 'Oxblood Burgundy', nameAr: 'عنابي نبيتي داكن', hex: '#521422', threeColor: '#631829' }
    ],
    images: [
      '/products/savage-brown.webp',
      'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=1200&q=85'
    ],
    graphicUrl: '/graphics/savage.png',
    frontGraphicUrl: '/graphics/savage-front.png',
    backGraphicUrl: '/graphics/savage.png',
    badge: 'NEW DROP',
    badgeAr: 'إصدار جديد',
    has3DModel: true,
    featured: true
  },
  {
    id: 'revelation-falling-angel-hoodie',
    name: 'REVELATION 12:9 FALLING ANGEL HOODIE',
    nameAr: 'هودي ريفيليشن الملاك الساقط زيتي غامق',
    category: 'limited-drops',
    price: 1750,
    originalPrice: 2100,
    description: 'Finished in a noble forest emerald pine green. Features the iconic distressed falling celestial angel back graphic and celestial cross with scripture reference "REVELATION 12:9". Numbered archive edition.',
    descriptionAr: 'مصنوع بلون أخضر غابات صنوبري فخم. يزدان برسمة الملاك السماوي الساقط مع صليب فضي وعبارة "REVELATION 12:9". إصدار أرشيف مرقم ومحدود الكمية.',
    details: [
      '520 GSM Dense Loopback Terry',
      'Distressed screenprint with crackle effect wash',
      'Rich deep emerald forest pine green dye',
      'Reinforced shoulder tape & double neck ribbing',
      'Individually numbered inner tag (1 of 100)'
    ],
    detailsAr: [
      'نسيج تيري قطني كثيف بوزن 520 جرام/م²',
      'طباعة معتقة بتأثير التشققات الكلاسيكية الفاخرة',
      'صبغة خضراء صنوبرية ملكية عميقة',
      'شريط تقوية داخلي على الأكتاف وياقة مزدوجة',
      'رقم إصدار تسلسلي مطرز بالداخل (قطعة من 100)'
    ],
    fabric: '100% Egyptian Cotton Heavy Loopback',
    fabricAr: '100% قطن مصري تيري حلقي ثقيل',
    weightGsm: 520,
    fit: 'Architectural Cocoon Fit',
    fitAr: 'قصة كوكون معمارية انسيابية',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: [
      { name: 'Forest Emerald Pine', nameAr: 'أخضر غابات زمردي', hex: '#1D4A38', threeColor: '#235D46' },
      { name: 'Acid Moss Olive', nameAr: 'زيتي حمضي معتق', hex: '#4A5636', threeColor: '#56643F' },
      { name: 'Onyx Black', nameAr: 'أسود أونيكس', hex: '#111111', threeColor: '#141414' },
      { name: 'Chalk White', nameAr: 'أبيض طباشيري', hex: '#F7F7F7', threeColor: '#EBE9E2' },
      { name: 'Rich Maroon Wine', nameAr: 'مارون نبيتي غني', hex: '#5C1728', threeColor: '#6E1B30' },
      { name: 'Washed Charcoal', nameAr: 'فحمي مغسول', hex: '#2C2C2C', threeColor: '#303030' }
    ],
    images: [
      '/products/revelation-green.webp',
      'https://images.unsplash.com/photo-1543076447-215ad9ba6923?auto=format&fit=crop&w=1200&q=85'
    ],
    graphicUrl: '/graphics/revelation.png',
    frontGraphicUrl: '/graphics/revelation-front.png',
    backGraphicUrl: '/graphics/revelation.png',
    badge: 'LIMITED EDITION',
    badgeAr: 'نسخة محدودة',
    has3DModel: true,
    featured: true
  },
  {
    id: 'tokyo-great-wave-hoodie',
    name: 'TOKYO HERITAGE GREAT WAVE HOODIE',
    nameAr: 'هودي طوكيو التراثي بالموجة العظيمة أبيض',
    category: 'essentials',
    price: 1600,
    originalPrice: 1900,
    description: 'Chalk white heavyweight hoodie featuring traditional Japanese woodblock landscape art: Mount Fuji, bonsai trees, rising black sun, and the roaring Great Wave juxtaposed with modern typographic typography.',
    descriptionAr: 'هودي أبيض طباشيري ثقيل يجمع بين فن المناظر الطبيعية اليابانية الكلاسيكية: جبل فوجي، أشجار البونساي، الشمس السوداء، وأمواج البحر الهادرة مع خطوط تايبوجرافي حديثة.',
    details: [
      '480 GSM Pure Combed White Cotton Fleece',
      'Ultra-fine Japanese woodblock monochrome art print',
      'Drop-shoulder boxy drape',
      'Split kangaroo pouch with reinforced seams',
      'Pre-washed to eliminate shrinkage'
    ],
    detailsAr: [
      'فليس قطني ممشط نقي فائق البياض 480 جرام/م²',
      'طباعة فنية أحادية دقيقة بتفاصيل النقوش اليابانية',
      'أكتاف ساقطة تمنح قواماً مريحاً وأنيقاً',
      'جيب كنغر مقسم بحياكة مزدوجة قوية',
      'مغسول مسبقاً لمنع أي انكماش بعد الاستخدام'
    ],
    fabric: '100% Egyptian Combed Jersey Fleece',
    fabricAr: '100% قطن مصري ممشط فليس',
    weightGsm: 480,
    fit: 'Boxy Casual Oversized',
    fitAr: 'قصة بوكسي أوفرسايز مريحة',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: [
      { name: 'Chalk White', nameAr: 'أبيض طباشيري', hex: '#F7F7F7', threeColor: '#EBE9E2' },
      { name: 'Onyx Black', nameAr: 'أسود أونيكس', hex: '#111111', threeColor: '#141414' },
      { name: 'Washed Charcoal', nameAr: 'فحمي مغسول', hex: '#2C2C2C', threeColor: '#303030' },
      { name: 'Raw Oatmeal Bone', nameAr: 'عاجي شوفان طبيعي', hex: '#DCD7CD', threeColor: '#D3CCC0' },
      { name: 'Midnight Navy', nameAr: 'كحلي ليلي داكن', hex: '#162438', threeColor: '#1B2C46' },
      { name: 'Forest Emerald Pine', nameAr: 'أخضر غابات زمردي', hex: '#1D4A38', threeColor: '#235D46' }
    ],
    images: [
      '/products/tokyo-wave-white.webp',
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1200&q=85'
    ],
    graphicUrl: '/graphics/tokyo-wave.png',
    frontGraphicUrl: '/graphics/tokyo-wave-front.png',
    backGraphicUrl: '/graphics/tokyo-wave.png',
    badge: 'NEW DROP',
    badgeAr: 'إصدار جديد',
    has3DModel: true,
    featured: true
  },
  {
    id: 'one-piece-sanji-hoodie',
    name: 'ONE PIECE SANJI VINTAGE MOCHA HOODIE',
    nameAr: 'هودي ون بيس سانجي الكلاسيكي موكا دافئ',
    category: 'limited-drops',
    price: 1800,
    originalPrice: 2200,
    description: 'Warm mocha brown anime tribute hoodie featuring Sanji lighting a flame, framed by vintage cream retro typography. Crafted from 500 GSM loopback cotton with rich warm earth tones.',
    descriptionAr: 'هودي أنمي بلون موكا دافئ يجسد شخصية سانجي مع ولاعته والدخان المتصاعد بخطوط ريترو كلاسيكية بلون بيج كريمي. نسيج قطني ثقيل 500 جرام/م² بألوان ترابية غنية.',
    details: [
      '500 GSM Premium Loopback Egyptian Fleece',
      'Screenprinted vintage cream anime artwork',
      'Special enzyme-washed mocha brown shade',
      'Ribbed cuffs with hidden stretch recovery',
      'Double-ply structured hood'
    ],
    detailsAr: [
      'فليس قطني مصري فاخر 500 جرام/م²',
      'طباعة سيلك سكرين ريترو بلون كريمي مقاوم للغسيل',
      'غسيل إنزيمي مخصص يمنح لون الموكا عمقاً فريداً',
      'أساور مضلعة بمرونة تحافظ على قوامها',
      'قلنسوة مزدوجة تمنح رقبة أنيقة ومريحة'
    ],
    fabric: '100% Egyptian Combed Cotton Terry',
    fabricAr: '100% قطن مصري ممشط تيري',
    weightGsm: 500,
    fit: 'Heavyweight Boxy Fit',
    fitAr: 'قصة بوكسي ثقيلة عريضة',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: [
      { name: 'Warm Mocha Brown', nameAr: 'بني موكا دافئ', hex: '#5E4230', threeColor: '#6E4E39' },
      { name: 'Dark Chocolate Brown', nameAr: 'بني شوكولاتة داكن', hex: '#3D261C', threeColor: '#4A2F22' },
      { name: 'Onyx Black', nameAr: 'أسود أونيكس', hex: '#111111', threeColor: '#141414' },
      { name: 'Raw Oatmeal Bone', nameAr: 'عاجي شوفان طبيعي', hex: '#DCD7CD', threeColor: '#D3CCC0' },
      { name: 'Chalk White', nameAr: 'أبيض طباشيري', hex: '#F7F7F7', threeColor: '#EBE9E2' },
      { name: 'Oxblood Burgundy', nameAr: 'عنابي نبيتي داكن', hex: '#521422', threeColor: '#631829' }
    ],
    images: [
      '/products/one-piece-mocha.webp',
      'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=1200&q=85'
    ],
    graphicUrl: '/graphics/one-piece.png',
    frontGraphicUrl: '/graphics/one-piece-front.png',
    backGraphicUrl: '/graphics/one-piece.png',
    badge: 'LIMITED EDITION',
    badgeAr: 'نسخة محدودة',
    has3DModel: true,
    featured: true
  },
  {
    id: 'bare-winter-tree-hoodie',
    name: 'BARE WINTER TREE SILHOUETTE HOODIE',
    nameAr: 'هودي شجرة الشتاء المعمارية نبيتي فاخر',
    category: 'outerwear',
    price: 1700,
    originalPrice: 2050,
    description: 'Dyed in deep oxblood burgundy wine. Features intricate stark white bare winter tree branches spanning the entire back, symbolizing underground resilience and architectural purity.',
    descriptionAr: 'مصبوغ بلون عنابي نبيتي داكن فخم. يزدان برسمة فنية دقيقة لأغصان شجرة الشتاء المتشعبة باللون الأبيض على كامل الظهر، كرمز للصلابة المعمارية والاستقلالية.',
    details: [
      '520 GSM Egyptian Heavy Combed Cotton',
      'High-contrast crisp white branch screenprint',
      'Oxblood burgundy deep reactive dye',
      'Dropped shoulder seam with heavy gauge thread',
      'Custom gunmetal branded drawstring tips'
    ],
    detailsAr: [
      'قطن مصري ممشط فائق الثقل بوزن 520 جرام/م²',
      'طباعة حريرية ناصعة البياض للأغصان بدقة متناهية',
      'صبغة عنابية تفاعلية ثابتة تدوم طويلاً',
      'أكتاف ساقطة بخياطة معززة بخيوط متينة',
      'أربطة مزودة بأطراف معدنية بلون البرونز الداكن'
    ],
    fabric: '100% Ultra-Heavy Egyptian Cotton',
    fabricAr: '100% قطن مصري فائق الثقل',
    weightGsm: 520,
    fit: 'Exaggerated Boxy Silhouette',
    fitAr: 'قصة واسعة بوكسي مميزة',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: [
      { name: 'Oxblood Burgundy', nameAr: 'عنابي نبيتي داكن', hex: '#521422', threeColor: '#631829' },
      { name: 'Onyx Black', nameAr: 'أسود أونيكس', hex: '#111111', threeColor: '#141414' },
      { name: 'Washed Charcoal', nameAr: 'فحمي مغسول', hex: '#2C2C2C', threeColor: '#303030' },
      { name: 'Chalk White', nameAr: 'أبيض طباشيري', hex: '#F7F7F7', threeColor: '#EBE9E2' },
      { name: 'Forest Emerald Pine', nameAr: 'أخضر غابات زمردي', hex: '#1D4A38', threeColor: '#235D46' },
      { name: 'Dark Chocolate Brown', nameAr: 'بني شوكولاتة داكن', hex: '#3D261C', threeColor: '#4A2F22' }
    ],
    images: [
      '/products/bare-tree-burgundy.webp',
      'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=1200&q=85'
    ],
    graphicUrl: '/graphics/bare-tree.png',
    frontGraphicUrl: '/graphics/bare-tree-front.png',
    backGraphicUrl: '/graphics/bare-tree.png',
    badge: 'NEW DROP',
    badgeAr: 'إصدار جديد',
    has3DModel: true,
    featured: true
  },
  {
    id: 'are-you-ok-hands-hoodie',
    name: 'ARE YOU OK ILLUSTRATED HANDS HOODIE',
    nameAr: 'هودي أريو أوكي أرتستيك هاندز أبيض ناصع',
    category: 'oversized',
    price: 1550,
    originalPrice: 1850,
    description: 'Clean chalk white streetwear hoodie featuring tattooed artistic hands with signet rings and gold skull chain forming spectacles over the typography "ARE YOU OK".',
    descriptionAr: 'هودي ستريتوير أبيض ناصع مزين برسمة يدين مرشومتين بخواتم وسلسلة ذهبية تشكلان نظارات على عبارة "ARE YOU OK" بتفاصيل غرافيتية متقنة.',
    details: [
      '480 GSM Compact Jersey Egyptian Fleece',
      'Multi-tone illustrated hands screenprint with gold accents',
      'Over-the-head structured double hood',
      'Pre-shrunk cotton terry loopback',
      'Heavy-duty side seam bar-tacks'
    ],
    detailsAr: [
      'فليس قطني مصري مضغوط 480 جرام/م²',
      'طباعة توضيحية متعددة الدرجات مع تفاصيل ذهبية لامعة',
      'قلنسوة مزدوجة تحافظ على استقامتها فوق الرأس',
      'نسيج تيري حلقي معالج ضد الانكماش',
      'حياكة مدعمة بغرز أمان على الأطراف والجيوب'
    ],
    fabric: '100% Egyptian Combed Cotton Fleece',
    fabricAr: '100% قطن مصري ممشط فليس',
    weightGsm: 480,
    fit: 'Exaggerated Boxy Fit',
    fitAr: 'قصة بوكسي أوفرسايز',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: [
      { name: 'Chalk White', nameAr: 'أبيض طباشيري', hex: '#F7F7F7', threeColor: '#EBE9E2' },
      { name: 'Onyx Black', nameAr: 'أسود أونيكس', hex: '#111111', threeColor: '#141414' },
      { name: 'Dark Chocolate Brown', nameAr: 'بني شوكولاتة داكن', hex: '#3D261C', threeColor: '#4A2F22' },
      { name: 'Warm Mocha Brown', nameAr: 'بني موكا دافئ', hex: '#5E4230', threeColor: '#6E4E39' },
      { name: 'Washed Charcoal', nameAr: 'فحمي مغسول', hex: '#2C2C2C', threeColor: '#303030' },
      { name: 'Raw Oatmeal Bone', nameAr: 'عاجي شوفان طبيعي', hex: '#DCD7CD', threeColor: '#D3CCC0' }
    ],
    images: [
      '/products/are-you-ok-white.webp',
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1200&q=85'
    ],
    graphicUrl: '/graphics/are-you-ok.png',
    frontGraphicUrl: '/graphics/are-you-ok-front.png',
    backGraphicUrl: '/graphics/are-you-ok.png',
    badge: 'NEW DROP',
    badgeAr: 'إصدار جديد',
    has3DModel: true,
    featured: true
  },
  {
    id: 'merry-christmas-graffiti-hoodie',
    name: 'STREET CALLIGRAPHY DRIP HOODIE',
    nameAr: 'هودي كاليجرافي دريب ستريت مارون',
    category: 'oversized',
    price: 1650,
    originalPrice: 1950,
    description: 'Rich maroon wine pullover hoodie adorned with bold flowing street calligraphy graffiti tags with drip splatters, halo motifs, and underground urban lettering across the back.',
    descriptionAr: 'هودي بلون نبيتي مارون غني مطبوع عليه بخط الكاليجرافي الجرافيتي الجريء مع قطرات الطلاء المتساقطة وحلقات الهالة على الظهر بالكامل.',
    details: [
      '500 GSM Heavy Egyptian Loopback Terry',
      'Drip tag graffiti high-opacity screenprint',
      'Deep maroon reactive colorway',
      'Drop-shoulder relaxed streetwear drape',
      'Reinforced dual-layer hood'
    ],
    detailsAr: [
      'قطن مصري ثقيل 500 جرام/م² تيري حلقي',
      'طباعة جرافيتي بيضاء عالية التغطية مقاومة للتشقق',
      'لون مارون نبيتي ملكي ثابت ومقاوم للبهتان',
      'أكتاف ساقطة تمنح إطلالة ستريتوير عصرية',
      'قلنسوة مزدوجة الطبقات لحماية ودفء كامل'
    ],
    fabric: '100% Combed Egyptian Cotton',
    fabricAr: '100% قطن مصري ممشط فاخر',
    weightGsm: 500,
    fit: 'Exaggerated Boxy Fit',
    fitAr: 'قصة واسعة بوكسي عريضة',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: [
      { name: 'Rich Maroon Wine', nameAr: 'مارون نبيتي غني', hex: '#5C1728', threeColor: '#6E1B30' },
      { name: 'Onyx Black', nameAr: 'أسود أونيكس', hex: '#111111', threeColor: '#141414' },
      { name: 'Oxblood Burgundy', nameAr: 'عنابي نبيتي داكن', hex: '#521422', threeColor: '#631829' },
      { name: 'Washed Charcoal', nameAr: 'فحمي مغسول', hex: '#2C2C2C', threeColor: '#303030' },
      { name: 'Chalk White', nameAr: 'أبيض طباشيري', hex: '#F7F7F7', threeColor: '#EBE9E2' },
      { name: 'Forest Emerald Pine', nameAr: 'أخضر غابات زمردي', hex: '#1D4A38', threeColor: '#235D46' }
    ],
    images: [
      '/products/merry-christmas-maroon.webp',
      'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=1200&q=85'
    ],
    graphicUrl: '/graphics/merry-christmas.png',
    frontGraphicUrl: '/graphics/merry-christmas-front.png',
    backGraphicUrl: '/graphics/merry-christmas.png',
    badge: 'LIMITED EDITION',
    badgeAr: 'نسخة محدودة',
    has3DModel: true,
    featured: true
  }
];
