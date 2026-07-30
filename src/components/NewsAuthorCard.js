import Card from "@/components/Card";
import ProfilePicture from "@/components/ProfilePicture";
import { formatEuropeanDateTime } from "@/utils/dateTime";

export default function NewsAuthorCard({ author, username, createdAt }) {
  if (!author) return null;

  const displayUsername = username || author.username;
  const publishedDate = formatEuropeanDateTime(createdAt, { dateStyle: "medium" }, "Unknown");

  return (
    <Card
      preset="news"
      title="Written By"
      titleAs="p"
      titleClassName="!px-2 !pb-0 !pt-3 text-center !text-sm"
      media={(
        <ProfilePicture
          size="sm"
          src={author.profilePicture ?? author.avatarUrl ?? author.image}
          username={displayUsername}
          email={author.email}
          className="!h-full !w-full !rounded-none !border-0 !text-2xl"
        />
      )}
      mediaAlt={`${displayUsername} profile picture`}
      hoverAccent={false}
      className="w-32 shrink-0"
      contentClassName="!px-2 !pb-3 text-center"
    >
      <p className="break-words text-xs leading-tight text-muted">{displayUsername}</p>
      <p className="mt-2 text-sm font-semibold leading-tight text-heading">Published</p>
      <time dateTime={new Date(createdAt).toISOString()} className="mt-0.5 block text-xs leading-tight text-muted">{publishedDate}</time>
    </Card>
  );
}
