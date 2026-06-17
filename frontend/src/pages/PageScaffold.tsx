import { PageHeader } from "../components/PageHeader";
import { PlaceholderPanel } from "../components/PlaceholderPanel";

type PageScaffoldProps = {
  title: string;
  description: string;
  items: string[];
};

export function PageScaffold({ title, description, items }: PageScaffoldProps) {
  return (
    <>
      <PageHeader title={title} description={description} />
      <div className="space-y-5 p-6">
        <PlaceholderPanel title="Planned v1 responsibilities" items={items} />
      </div>
    </>
  );
}
