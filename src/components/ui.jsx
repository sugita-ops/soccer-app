/** ---------------- Buttons ---------------- **/
export const Button = ({ as:Tag="button", kind="primary", className="", ...p }) => {
  const base = "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition";
  const map  = {
    primary:  "bg-green-600 text-white hover:bg-green-700 shadow-sm",
    ghost:    "bg-white border border-gray-200 hover:border-gray-300",
    subtle:   "bg-green-50 text-green-700 hover:bg-green-100",
  };
  return <Tag className={`${base} ${map[kind]} ${className}`} {...p} />;
};

/** ---------------- Card ---------------- **/
export const Card = ({ title, action, className="", children }) => (
  <section className={`bg-white rounded-2xl border border-gray-200 shadow-sm p-5 ${className}`}>
    {(title || action) && (
      <header className="mb-4 flex items-center justify-between">
        {title && <h2 className="text-base font-semibold text-gray-800">{title}</h2>}
        {action}
      </header>
    )}
    {children}
  </section>
);

/** ---------------- Field (Label + Input) ---------------- **/
export const Field = ({ label, hint, children }) => (
  <label className="block space-y-1">
    <span className="text-sm font-medium text-gray-700">{label}</span>
    {children}
    {hint && <span className="text-xs text-gray-400">{hint}</span>}
  </label>
);

/** ---------------- Input / Select ---------------- **/
export const Input = (p) =>
  <input {...p} className={`w-full rounded-xl border-gray-300 focus:ring-2 focus:ring-green-200 focus:border-green-500 ${p.className||""}`} />;

export const Select = ({className="", ...p}) =>
  <select {...p} className={`w-full rounded-xl border-gray-300 focus:ring-2 focus:ring-green-200 focus:border-green-500 ${className}`} />;

/** ---------------- Badge / Chip ---------------- **/
export const Badge = ({color="green", children}) =>
  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold bg-${color}-50 text-${color}-700`}>{children}</span>;

/** ---------------- Empty State ---------------- **/
export const Empty = ({title="データがありません", desc="右上のボタンから追加してください", action}) => (
  <div className="text-center py-12 border-2 border-dashed rounded-2xl">
    <div className="mx-auto mb-3 size-10 rounded-full bg-green-50 flex items-center justify-center">✨</div>
    <h3 className="text-base font-semibold text-gray-800">{title}</h3>
    <p className="text-sm text-gray-500 mt-1">{desc}</p>
    {action && <div className="mt-4">{action}</div>}
  </div>
);
