import { wearToday } from "@/app/actions/wear";

// Кнопка «Wore today» (SOTD). Серверный экшен через форму — без клиентского JS.
export function WoreTodayButton({
  fragranceId,
  compact = false,
}: {
  fragranceId: string;
  compact?: boolean;
}) {
  return (
    <form action={wearToday.bind(null, fragranceId)}>
      <button
        className={
          compact
            ? "rounded-full border border-white/12 px-2.5 py-1 text-xs text-neutral-300 transition hover:border-amber-300/40 hover:text-amber-200"
            : "rounded-full border border-white/15 px-4 py-2.5 text-sm font-semibold text-neutral-200 transition hover:border-amber-300/40 hover:text-amber-200"
        }
        title="Mark as today's scent"
      >
        🫧 Wore today
      </button>
    </form>
  );
}
