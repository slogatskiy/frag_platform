import Link from "next/link";

const FEATURES = [
  {
    title: "Стоимость полки",
    desc: "Вся коллекция как актив: сколько стоит прямо сейчас и как меняется со временем.",
    icon: "💰",
  },
  {
    title: "Cost-per-wear",
    desc: "Реальная цена удовольствия — с учётом объёма, остатка и того, как часто носишь.",
    icon: "🎯",
  },
  {
    title: "Алерты о цене",
    desc: "Аромат из вишлиста подешевел ниже твоей планки — узнаёшь первым.",
    icon: "🔔",
  },
  {
    title: "Твоя полка — для друзей",
    desc: "Красивая публичная страница коллекции. Делись ссылкой, сравнивай с друзьями.",
    icon: "🫂",
  },
];

export default function Home() {
  return (
    <main className="flex-1 bg-neutral-950 text-neutral-100">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(180,140,255,0.18),transparent)]" />
        <div className="mx-auto max-w-4xl px-6 pt-24 pb-16 text-center">
          <span className="inline-block rounded-full border border-neutral-800 bg-neutral-900/60 px-4 py-1.5 text-xs font-medium tracking-wide text-neutral-400">
            для коллекционеров парфюма
          </span>
          <h1 className="mt-6 text-4xl font-semibold leading-tight tracking-tight sm:text-6xl">
            Сколько стоит
            <br />
            <span className="bg-gradient-to-r from-violet-300 to-fuchsia-300 bg-clip-text text-transparent">
              твоя полка?
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-neutral-400">
            Собери коллекцию, узнай её реальную рыночную стоимость, следи за
            ценами и делись полкой с друзьями. Не просто каталог — трекер твоего
            парфюмерного портфеля.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link
              href="/catalog"
              className="rounded-full bg-neutral-100 px-6 py-3 text-sm font-semibold text-neutral-900 transition hover:bg-white"
            >
              Смотреть каталог
            </Link>
            <Link
              href="/catalog"
              className="rounded-full border border-neutral-700 px-6 py-3 text-sm font-semibold text-neutral-200 transition hover:border-neutral-500"
            >
              Собрать коллекцию
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-5xl px-6 pb-28">
        <div className="grid gap-4 sm:grid-cols-2">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6 transition hover:border-neutral-700"
            >
              <div className="text-2xl">{f.icon}</div>
              <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-neutral-400">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-neutral-900 py-8 text-center text-xs text-neutral-600">
        Frag Platform · в разработке
      </footer>
    </main>
  );
}
