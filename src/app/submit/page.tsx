import { getModelOptionsForSubmit } from "@/lib/queries";
import { SubmitForm } from "./submit-form";
import { pageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = pageMetadata({
  title: "Submit a report",
  description: "Tell us what happened when you tried an AI model on a real task.",
});

export default async function SubmitPage({
  searchParams,
}: PageProps<"/submit">) {
  const params = await searchParams;
  const modelParam = typeof params.model === "string" ? Number(params.model) : undefined;

  const models = await getModelOptionsForSubmit();

  return (
    <div className="mx-auto max-w-xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-5xl font-black tracking-tight text-ink">Submit a report</h1>
      <p className="mt-3 text-lg text-ink-muted">
        Tried a model on something real? Tell us what happened. Every
        submission goes through review before it’s published — see the{" "}
        <a href="/about" className="text-gold hover:underline">
          methodology
        </a>{" "}
        for how that works.
      </p>

      <SubmitForm
        models={models}
        defaultModelId={modelParam && !Number.isNaN(modelParam) ? modelParam : undefined}
      />
    </div>
  );
}
