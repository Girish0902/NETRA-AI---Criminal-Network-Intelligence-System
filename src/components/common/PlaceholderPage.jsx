import { Construction } from "lucide-react";
import PageHeader from "./PageHeader";

export default function PlaceholderPage({
  title,
  description,
}) {
  return (
    <>
      <PageHeader
        title={title}
        description={description}
      />

      <section className="flex min-h-[420px] items-center justify-center rounded-2xl border border-edge bg-surface-raised/85 p-8 shadow-2xl shadow-black/10">
        <div className="max-w-md text-center">
          <div className="mx-auto flex size-16 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10">
            <Construction
              size={30}
              className="text-primary-hover"
            />
          </div>

          <h3 className="mt-5 text-xl font-semibold text-white">
            Module foundation ready
          </h3>

          <p className="mt-2 text-sm leading-6 text-ink-secondary">
            The layout and navigation for this module are complete. Its
            functional interface will be developed during the upcoming
            implementation days.
          </p>
        </div>
      </section>
    </>
  );
}