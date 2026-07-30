import { SmileySad } from "@phosphor-icons/react/dist/ssr/SmileySad";

type EmptySearchStateProps = {
  query: string;
};

export function EmptySearchState({ query }: EmptySearchStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 px-4 py-16 text-center">
      <SmileySad size={40} className="text-(--text-muted)" />
      <p className="text-(length:--text-md) font-medium text-(--text-primary)">
        Nothing matches &quot;{query}&quot;
      </p>
      <p className="max-w-xs text-(length:--text-sm) text-(--text-secondary)">
        Try a different word, or search for a category like coffee or cones.
      </p>
    </div>
  );
}
