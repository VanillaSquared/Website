import AttachmentList from "@/components/AttachmentList";
import Button from "@/components/Button";
import ProfilePicture from "@/components/ProfilePicture";

function formatTime(value) {
  if (!value) return "Unknown time";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export default function ThreadRow({ message, canChange = false, onEdit, onDelete, attachmentHref }) {
  return (
    <article className="flex gap-3 py-4">
      <ProfilePicture size="sm" username={message.creatorUsername} className="!h-9 !w-9 !rounded-xl !text-xs" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <h3 className="text-sm font-semibold text-heading">{message.creatorUsername}</h3>
          <time className="text-xs text-muted" dateTime={String(message.createdAt)}>{formatTime(message.createdAt)}</time>
          {message.editedAt ? <span className="text-xs text-subtle">edited {formatTime(message.editedAt)}</span> : null}
        </div>
        <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-soft">{message.content}</p>
        {message.attachment ? (
          <AttachmentList
            files={[message.attachment]}
            heading=""
            showEmpty={false}
            compact
            className="mt-2 max-w-lg"
            getHref={() => attachmentHref(message)}
          />
        ) : null}
        {canChange ? (
          <div className="mt-2 flex gap-2">
            <Button size="sm" variant="tertiary" onClick={onEdit}>Edit</Button>
            <Button size="sm" variant="tertiary" onClick={onDelete}>Delete</Button>
          </div>
        ) : null}
      </div>
    </article>
  );
}
