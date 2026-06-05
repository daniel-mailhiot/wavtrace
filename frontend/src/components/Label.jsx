// Form field label over .wt-label (mono, faint, sits above the input)

export default function Label({ children, ...props }) {
  return (
    <label className="wt-label" {...props}>
      {children}
    </label>
  );
}
