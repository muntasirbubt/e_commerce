export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order } = await searchParams;
  return (
    <main className="mx-auto max-w-2xl px-6 py-20 text-center">
      <div className="text-5xl">✓</div>
      <h1 className="mt-5 text-4xl font-semibold">Payment submitted</h1>
      <p className="mt-4 text-black/60">
        Your payment is being confirmed. Reference:{" "}
        <strong>{order ?? ""}</strong>
      </p>
      <a
        href="/"
        className="mt-8 inline-block rounded-full bg-[#17231f] px-6 py-3 text-white"
      >
        Continue shopping
      </a>
    </main>
  );
}
