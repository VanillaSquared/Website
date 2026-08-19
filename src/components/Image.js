function getImageSource(source) {
  return typeof source === "string" ? source : source?.src ?? source;
}

export default function Image({ src, ...props }) {
  return <img src={getImageSource(src)} {...props} />;
}

export { getImageSource };
