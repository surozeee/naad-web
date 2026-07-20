import CmsPageView from '@/app/components/cms/CmsPageView';

type Props = {
  params: Promise<{ name: string }>;
};

/** Dynamic CMS slug route, e.g. /cms/terms-of-service */
export default async function DynamicCmsPage({ params }: Props) {
  const { name } = await params;
  return <CmsPageView name={decodeURIComponent(name)} />;
}
