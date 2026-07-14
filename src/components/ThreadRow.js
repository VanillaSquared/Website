import idIcon from "@/assets/icons/id.svg";
import editIcon from "@/assets/icons/edit.svg";
import deleteIcon from "@/assets/icons/trash.svg";
import AttachmentList from "@/components/AttachmentList";
import EmojiPicker from "@/components/EmojiPicker";
import Button from "@/components/Button";
import ProfilePicture from "@/components/ProfilePicture";
import { formatEuropeanDateTime, formatEuropeanTime } from "@/utils/dateTime";

export default function ThreadRow({ message, grouped = false, canCopyId = false, canChange = false, canReact = false, editing = false, editContent = "", editError = "", editBusy = false, editCharacterLimit = 1000, onEditContentChange, onSaveEdit, onCancelEdit, onEdit, onDelete, onReact, attachmentHref }) {
  return (
    <article className={`group/message relative -mx-3 flex gap-3 rounded-lg px-3 transition-colors hover:bg-input-hover focus-within:bg-input-hover ${grouped ? "py-0.5" : "py-2"}`}>
      {grouped ? (
        <time className="w-9 shrink-0 self-center whitespace-nowrap text-center text-[10px] leading-none text-subtle opacity-0 transition-opacity group-hover/message:opacity-100 group-focus-within/message:opacity-100" dateTime={String(message.createdAt)}>
          {formatEuropeanTime(message.createdAt)}
        </time>
      ) : (
        <ProfilePicture size="sm" username={message.creatorUsername} className="mt-1 !h-9 !w-9 !rounded-xl !text-xs" />
      )}
      <div className="min-w-0 flex-1">
        {!grouped ? (
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <h3 className="text-sm font-semibold text-heading">{message.creatorUsername}</h3>
            <time className="text-xs text-muted" dateTime={String(message.createdAt)}>{formatEuropeanDateTime(message.createdAt)}</time>
            {message.editedAt ? <span className="text-xs text-subtle">edited {formatEuropeanDateTime(message.editedAt)}</span> : null}
          </div>
        ) : null}
        {editing ? (
          <div className="mt-1">
            <div className="relative rounded-xl border border-input-border bg-input focus-within:border-input-border-focus">
              <textarea
                autoFocus
                value={editContent}
                onChange={(event) => onEditContentChange?.(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Escape") { event.preventDefault(); onCancelEdit?.(); }
                  if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); if (editContent.trim() && !editBusy) onSaveEdit?.(); }
                }}
                maxLength={editCharacterLimit}
                rows={3}
                disabled={editBusy}
                className="max-h-40 min-h-20 w-full resize-none bg-transparent px-3 pt-2.5 pb-7 text-sm leading-6 text-heading outline-none disabled:opacity-60"
              />
              <span className="absolute right-3 bottom-2 text-xs text-muted">{editContent.length}/{editCharacterLimit}</span>
            </div>
            <p className="mt-1 text-xs text-muted">escape to <button type="button" className="text-accent hover:underline" onClick={onCancelEdit}>cancel</button> · enter to <button type="button" className="text-accent hover:underline disabled:opacity-50" disabled={!editContent.trim() || editBusy} onClick={onSaveEdit}>save</button></p>
            {editError ? <p className="mt-1 text-sm text-error">{editError}</p> : null}
          </div>
        ) : <p className={`${grouped ? "flex min-h-6 items-center" : "mt-1"} whitespace-pre-wrap break-words text-sm leading-6 text-soft`}>{message.content}</p>}
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
        {message.reactions?.length ? (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {message.reactions.map((reaction) => (
              <button key={reaction.emoji} type="button" disabled={!canReact} onClick={() => onReact?.(reaction.emoji)} className={`flex h-8 items-center gap-1.5 rounded-lg border px-2 text-sm leading-none transition-colors ${reaction.reacted ? "border-control-accent bg-control-accent-soft text-heading" : "border-control-border bg-control text-soft hover:border-control-border-hover"} disabled:cursor-not-allowed disabled:opacity-60`}>
                <span className="inline-flex items-center text-base leading-none">{reaction.emoji}</span><span className="leading-none">{reaction.count}</span>
              </button>
            ))}
          </div>
        ) : null}
        {!editing && (canCopyId || canChange || canReact) ? (
          <div className="absolute -top-4 right-3 z-10 flex translate-y-1 overflow-visible rounded-md border border-control-border bg-control-panel opacity-0 shadow-lg transition-all group-hover/message:translate-y-0 group-hover/message:opacity-100 group-focus-within/message:translate-y-0 group-focus-within/message:opacity-100">
            {canReact ? <EmojiPicker onSelect={onReact} buttonClassName={`!h-9 !w-9 ${canCopyId || canChange ? "!rounded-l-[5px] !rounded-r-none" : "!rounded-[5px]"}`} iconClassName="h-5 w-5" /> : null}
            {canCopyId ? <Button size="icon" variant="iconButton" icon={idIcon} iconClassName="h-6 w-6" className={`!h-9 !w-9 text-muted hover:text-heading ${canReact ? "!rounded-l-none" : "!rounded-l-[5px]"} ${canChange ? "!rounded-r-none" : "!rounded-r-[5px]"}`} aria-label="Copy comment ID" title="Copy comment ID" onClick={() => navigator.clipboard?.writeText(message.id)} /> : null}
            {canChange ? <Button size="icon" variant="iconButton" icon={editIcon} iconClassName="h-4 w-4" className={`!h-9 !w-9 !rounded-none text-muted hover:text-heading ${canReact || canCopyId ? "" : "!rounded-l-[5px]"}`} aria-label="Edit comment" onClick={onEdit} /> : null}
            {canChange ? <Button size="icon" variant="iconButton" icon={deleteIcon} iconClassName="h-4 w-4" className="!h-9 !w-9 !rounded-l-none !rounded-r-[5px] text-muted hover:text-error" aria-label="Delete comment" onClick={onDelete} /> : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}
