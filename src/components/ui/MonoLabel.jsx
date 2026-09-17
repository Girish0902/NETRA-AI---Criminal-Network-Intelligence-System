import clsx from "clsx";

export default function MonoLabel({
  children,
  className,
  ...props
}) {
  return (
    <code
      className={clsx(
        "font-mono text-[0.8125rem] text-ink-secondary",
        className,
      )}
      {...props}
    >
      {children}
    </code>
  );
}
