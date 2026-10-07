export function OrderStatusTracker({ status }: { status: string }) {
  const steps = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED"];
  if (status === "CANCELLED")
    return (
      <span className="whitespace-nowrap rounded-full bg-red-100 px-2.5 py-1 text-[10px] font-semibold text-red-800">
        Cancelled
      </span>
    );
  const active = steps.indexOf(status);
  return (
    <div className="flex items-center gap-1.5" aria-label={`Order status: ${status}`}>
      {steps.map((step, index) => (
        <span key={step} className="flex items-center gap-1.5">
          <span
            title={step === "DELIVERED" ? "Delivery done" : step.toLowerCase()}
            className={`size-2.5 rounded-full ${index <= active ? "bg-[#1b3b2b]" : "bg-[#d8dfd7]"}`}
          />
          {index < steps.length - 1 && (
            <span className={`h-px w-4 ${index < active ? "bg-[#1b3b2b]" : "bg-[#d8dfd7]"}`} />
          )}
        </span>
      ))}
      <span className="ml-1 whitespace-nowrap text-[10px] font-medium text-[#34473b]">
        {status === "DELIVERED" ? "Delivery done" : status[0] + status.slice(1).toLowerCase()}
      </span>
    </div>
  );
}
