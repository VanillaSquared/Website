import editIcon from "@/assets/icons/edit.svg";
import deleteIcon from "@/assets/icons/trash.svg";
import AttachmentList from "@/components/AttachmentList";
import Button from "@/components/Button";
import ProfilePicture from "@/components/ProfilePicture";

function formatTime(value) {
  if (!value) return "Unknown time";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export default function ThreadRow({ message, canChange = false, onEdit, onDelete, attachmentHref }) {
  return (
    <article className="group/message relative -mx-3 flex gap-3 rounded-lg px-3 py-4 transition-colors hover:bg-input-hover focus-within:bg-input-hover">
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
          <div className="absolute -top-4 right-3 z-10 flex translate-y-1 overflow-hidden rounded-md border border-control-border bg-control-panel opacity-0 shadow-lg transition-all group-hover/message:translate-y-0 group-hover/message:opacity-100 group-focus-within/message:translate-y-0 group-focus-within/message:opacity-100">
            <Button size="icon" variant="iconButton" icon={editIcon} iconClassName="h-4 w-4" className="!h-9 !w-9 !rounded-none text-muted hover:text-heading" aria-label="Edit comment" onClick={onEdit} />
            <Button size="icon" variant="iconButton" icon={deleteIcon} iconClassName="h-4 w-4" className="!h-9 !w-9 !rounded-none text-muted hover:text-error" aria-label="Delete comment" onClick={onDelete} />
          </div>
        ) : null}
      </div>
    </article>
  );
}
