import catalog from './resource-catalog.json';

export interface ResourceMenuItem {
  href: string;
  title: string;
  date: string;
}

interface CatalogEntry {
  kind: 'art' | 'news';
  href: string;
  title: string;
  dateLabel: string;
}

const latest = (kind: CatalogEntry['kind']): ResourceMenuItem[] =>
  (catalog as CatalogEntry[])
    .filter((item) => item.kind === kind)
    .slice(0, 3)
    .map((item) => ({
      href: item.href,
      title: item.title,
      date: item.dateLabel.replace(', 2026', ''),
    }));

export const artResources = latest('art');
export const newsResources = latest('news');
