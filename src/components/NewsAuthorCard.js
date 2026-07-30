import Card from "@/components/Card";
import { formatEuropeanDateTime } from "@/utils/dateTime";

export default function NewsAuthorCard({ author, authorImage, publishedAt }) {
  if (!author) return null;

  const publishedDate = formatEuropeanDateTime(publishedAt, { dateStyle: "medium", timeZone: "UTC" }, "Unknown");

  return (
    <Card
      preset="news"
      title="Written By"
      titleAs="p"
      titleClassName="!px-2 !pb-0 !pt-3 text-center !text-sm"
      media={authorImage ? <img src={authorImage} alt={`${author} author portrait`} /> : null}
      hoverAccent={false}
      className="w-32 shrink-0"
      contentClassName="!px-2 !pb-3 text-center"
    >
      <p className="break-words text-xs leading-tight text-muted">{author}</p>
      <p className="mt-2 text-sm font-semibold leading-tight text-heading">Published</p>
      <time dateTime={publishedAt} className="mt-0.5 block text-xs leading-tight text-muted">{publishedDate}</time>
    </Card>
  );
}
