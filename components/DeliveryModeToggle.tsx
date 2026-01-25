import Image from "next/image";
import Link from "next/link";

export default function DeliveryModeToggle() {
  return (
    <div className="flex items-center gap-6">
      
      {/* Scheduled */}
      <Link
        href="/"
        className="flex items-center gap-3 px-4 py-2 rounded-lg bg-white hover:bg-gray-50 transition"
      >
        <Image
          src="/truck.png"
          alt="Scheduled delivery"
          width={60}
          height={60}
          className="shrink-0"
          priority
        />

        <span className="text-base font-semibold text-gray-800">
          Scheduled
        </span>
      </Link>

      {/* Express */}
      <Link
        href="/"
        className="flex items-center gap-3 px-4 py-2 rounded-lg bg-white hover:bg-gray-50 transition"
      >
        <Image
          src="/bike.png"
          alt="Express delivery"
          width={60}
          height={60}
          className="shrink-0"
          priority
        />

        <span className="text-base font-semibold text-gray-800">
          Express
        </span>
      </Link>

    </div>
  );
}
