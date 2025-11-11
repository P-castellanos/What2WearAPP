/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { WardrobeItem } from './types';

// Default wardrobe items hosted locally within the project to avoid CORS issues.
// The user should place these image files in a public directory (e.g., /public/wardrobe-assets/).
export const defaultWardrobe: WardrobeItem[] = [
  // --- Tops ---
  { id: 'graphic-tee-1', name: 'Camiseta gráfica abstracta', url: '/wardrobe-assets/abstract-graphic-tee.png', category: 'top' },
  { id: 'silk-blouse-1', name: 'Blusa de seda color crema', url: '/wardrobe-assets/cream-silk-blouse.png', category: 'top' },
  { id: 'striped-shirt-1', name: 'Camisa de rayas azules', url: '/wardrobe-assets/blue-striped-shirt.png', category: 'top' },
  { id: 'cashmere-sweater-1', name: 'Suéter de cachemira gris', url: '/wardrobe-assets/grey-cashmere-sweater.png', category: 'top' },
  { id: 'linen-shirt-1', name: 'Camisa de lino blanca', url: '/wardrobe-assets/white-linen-shirt.png', category: 'top' },
  { id: 'turtleneck-1', name: 'Suéter de cuello alto negro', url: '/wardrobe-assets/black-turtleneck.png', category: 'top' },

  // --- Bottoms ---
  { id: 'blue-jeans-1', name: 'Vaqueros azules clásicos', url: '/wardrobe-assets/classic-blue-jeans.png', category: 'bottom' },
  { id: 'pleated-skirt-1', name: 'Falda plisada color topo', url: '/wardrobe-assets/taupe-pleated-skirt.png', category: 'bottom' },
  { id: 'black-trousers-1', name: 'Pantalones de vestir negros', url: '/wardrobe-assets/black-trousers.png', category: 'bottom' },
  { id: 'khaki-chinos-1', name: 'Pantalones chinos', url: '/wardrobe-assets/khaki-chinos.png', category: 'bottom' },
  { id: 'denim-shorts-1', name: 'Shorts vaqueros', url: '/wardrobe-assets/denim-shorts.png', category: 'bottom' },
  { id: 'white-jeans-1', name: 'Vaqueros blancos', url: '/wardrobe-assets/white-jeans.png', category: 'bottom' },
  
  // --- Outerwear ---
  { id: 'leather-jacket-1', name: 'Chaqueta de cuero', url: '/wardrobe-assets/leather-jacket.png', category: 'outerwear' },
  { id: 'trench-coat-1', name: 'Gabardina beige', url: '/wardrobe-assets/beige-trench-coat.png', category: 'outerwear' },
  { id: 'denim-jacket-1', name: 'Chaqueta vaquera azul', url: '/wardrobe-assets/blue-denim-jacket.png', category: 'outerwear' },
  { id: 'blazer-1', name: 'Blazer azul marino', url: '/wardrobe-assets/navy-blazer.png', category: 'outerwear' },
  { id: 'puffer-vest-1', name: 'Chaleco acolchado negro', url: '/wardrobe-assets/black-puffer-vest.png', category: 'outerwear' },
  
  // --- Dresses ---
  { id: 'floral-dress-1', name: 'Vestido floral veraniego', url: '/wardrobe-assets/summer-floral-dress.png', category: 'dress' },
  { id: 'little-black-dress-1', name: 'Vestido negro corto', url: '/wardrobe-assets/little-black-dress.png', category: 'dress' },
  { id: 'maxi-dress-1', name: 'Vestido largo bohemio', url: '/wardrobe-assets/boho-maxi-dress.png', category: 'dress' },
  { id: 'shirt-dress-1', name: 'Vestido camisero de rayas', url: '/wardrobe-assets/striped-shirt-dress.png', category: 'dress' },

  // --- Shoes ---
  { id: 'white-sneakers-1', name: 'Zapatillas blancas', url: '/wardrobe-assets/white-sneakers.png', category: 'shoes' },
  { id: 'black-boots-1', name: 'Botas de combate negras', url: '/wardrobe-assets/black-combat-boots.png', category: 'shoes' },
  { id: 'brown-loafers-1', name: 'Mocasines de cuero marrones', url: '/wardrobe-assets/brown-leather-loafers.png', category: 'shoes' },
  { id: 'strappy-sandals-1', name: 'Sandalias de tiras', url: '/wardrobe-assets/strappy-sandals.png', category: 'shoes' },
  { id: 'nude-heels-1', name: 'Tacones color piel', url: '/wardrobe-assets/nude-heels.png', category: 'shoes' },
  
  // --- Accessories ---
  { id: 'leather-tote-1', name: 'Bolso tote de cuero', url: '/wardrobe-assets/leather-tote-bag.png', category: 'accessory' },
  { id: 'aviator-sunglasses-1', name: 'Gafas de sol de aviador', url: '/wardrobe-assets/aviator-sunglasses.png', category: 'accessory' },
  { id: 'silk-scarf-1', name: 'Pañuelo de seda estampado', url: '/wardrobe-assets/patterned-silk-scarf.png', category: 'accessory' },
  { id: 'fedora-hat-1', name: 'Sombrero fedora de lana', url: '/wardrobe-assets/wool-fedora-hat.png', category: 'accessory' },
];
