export function getProfileInitials(username, email) {
  const displayName = username || email || "VS";

  return displayName
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "VS";
}

const sizes = {
  sm: "h-11 w-11 rounded-2xl text-sm",
  md: "h-14 w-14 rounded-2xl text-lg",
};

const imageSizes = {
  sm: "44px",
  md: "56px",
};

export default function ProfilePicture({
  src,
  alt,
  username,
  email,
  size = "md",
  className = "",
}) {
  const sizeClass = sizes[size] ?? sizes.md;
  const imageSize = imageSizes[size] ?? imageSizes.md;
  const initials = getProfileInitials(username, email);

  return (
    <div className={`flex shrink-0 items-center justify-center overflow-hidden border border-accent/50 bg-accent/20 font-bold text-heading ${sizeClass} ${className}`}>
      {src ? (
        <img
          src={src}
          alt={alt ?? `${username || email || "User"} profile picture`}
          width={imageSize.replace("px", "")}
          height={imageSize.replace("px", "")}
          className="h-full w-full object-cover"
        />
      ) : (
        initials
      )}
    </div>
  );
}
