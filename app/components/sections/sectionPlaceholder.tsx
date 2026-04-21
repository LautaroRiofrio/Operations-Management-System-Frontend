type SectionPlaceholderProps = {
  title: string;
  description: string;
};

export default function SectionPlaceholder({ title, description }: SectionPlaceholderProps) {
  return (
    <div className="flex h-full items-center justify-center bg-neutral-50 p-6">
      <div className="w-full max-w-2xl rounded-2xl border border-black/10 bg-white p-8 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-neutral-500">
          Operations Management System
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-neutral-900">{title}</h1>
        <p className="mt-4 text-base leading-7 text-neutral-600">{description}</p>
      </div>
    </div>
  );
}
