import { words as introWords } from './resource-company';

// Copy specific to the independent visual-direction study at /test.
export const words = {
  en: {
    ...introWords.en,
    productsNav: "Products",
    productStatus: "In development",
    productTitle: "Coordination for pharmacy teams.",
    productBody: "Telotia is developing a product to help pharmacies and pharmacists coordinate professional resources.",
    productNote: "Product details will be shared here as they become available.",
  },
  fr: {
    ...introWords.fr,
    productsNav: "Produits",
    productStatus: "En développement",
    productTitle: "La coordination pour les équipes en pharmacie.",
    productBody: "Telotia développe un produit pour aider les pharmacies et les pharmaciens à coordonner les ressources professionnelles.",
    productNote: "Les détails du produit seront présentés ici à mesure qu’ils seront disponibles.",
  },
} as const;
