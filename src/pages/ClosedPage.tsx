export function ClosedPage({ onCheck }: { onCheck?: () => void }) {
  return (
    <div className="min-h-screen bg-noir flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <h1 className="font-display text-4xl md:text-5xl font-light text-white mb-4">
          BUKSY <span className="text-blood">.</span>
        </h1>
        <p className="font-heading tracking-[0.3em] text-blood text-sm mb-6">ТИМЧАСОВО ЗАКРИТО</p>
        <p className="text-white/50 font-body text-sm leading-relaxed">
          Ми оновлюємо сайт і скоро повернемось. Заходь пізніше.
        </p>
        {onCheck && (
          <button
            onClick={onCheck}
            className="mt-8 text-white/30 hover:text-white text-xs underline transition-colors"
          >
            Перевірити
          </button>
        )}
      </div>
    </div>
  );
}
