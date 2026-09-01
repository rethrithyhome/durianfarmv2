/** The farm's own logo, used as the default mark anywhere a custom
 * uploaded logo isn't set. Kept as a component so sizing stays
 * consistent across the header, sidebar, login screen and print sheets. */
export function DurianMark({ size = 36 }: { size?: number }) {
  return (
    <img
      src="/farm-logo.png"
      alt="ចំការផ្លែឈើធម្មជាតិ ផេសលិត"
      width={size}
      height={size}
      className="object-contain"
      style={{ width: size, height: size }}
    />
  );
}
