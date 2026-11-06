import PortfolioPageContent from '@/components/portfolio/PortfolioPageContent';
import { getPublicPortfolioData } from '@/lib/portfolio/public-data';

export const dynamic = 'force-dynamic';

export default async function AdminVisualPreviewPage() {
  const content = await getPublicPortfolioData();
  return <PortfolioPageContent initialContent={content} cmsPreview />;
}
