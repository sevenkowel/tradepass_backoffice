import { ProductDetailPage } from '@/components/trade';

interface ProductPageProps {
  params: Promise<{ symbol: string }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { symbol } = await params;
  return <ProductDetailPage symbol={decodeURIComponent(symbol)} />;
}
