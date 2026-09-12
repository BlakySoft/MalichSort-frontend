export default function FormErrors({ errors }) {
  const list = Array.isArray(errors) ? errors : Object.values(errors || {});
  if (!list.length) return null;
  return (
    <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
      <ul className="list-disc space-y-1 pl-4">
        {list.map((e, i) => <li key={i}>{e}</li>)}
      </ul>
    </div>
  );
}
