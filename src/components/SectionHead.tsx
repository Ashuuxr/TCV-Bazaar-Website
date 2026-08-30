import Reveal from "./Reveal";

export default function SectionHead({
  eyebrow,
  title,
  sub,
  center = true,
  dark = false,
}: {
  eyebrow: string;
  title: string;
  sub?: string;
  center?: boolean;
  dark?: boolean;
}) {
  return (
    <Reveal
      className={`mb-12 max-w-3xl ${center ? "mx-auto text-center" : ""}`}
    >
      <span
        className={`eyebrow ${center ? "justify-center" : ""}`}
        style={center ? {} : {}}
      >
        {eyebrow}
      </span>
      <h2
        className={`font-display mt-4 text-3xl sm:text-5xl font-medium leading-[1.08] tracking-tight ${dark ? "text-[#f4ecdd]" : ""}`}
      >
        {title}
      </h2>
      {sub && (
        <p
          className={`mt-5 text-base sm:text-lg leading-relaxed ${dark ? "text-[#b7ab94]" : "text-[var(--ink-soft)]"}`}
        >
          {sub}
        </p>
      )}
    </Reveal>
  );
}
