import Image from "next/image";
import Link from "next/link";
import { Truck, Bike, Clock, Shield, MapPin, Package, Star } from "lucide-react";

export default function DeliveryModeToggle() {
  return (
    <div className="flex items-center justify-between w-full">
      {/* Left side: Delivery mode selection */}
      <div className="flex items-center gap-4">
        {/* Scheduled */}
        <Link
          href="/delivery/scheduled"
          className="flex items-center gap-3 px-4 py-2 rounded-lg bg-white hover:bg-gray-50 transition-all duration-300 border border-gray-200 hover:border-green-300 hover:shadow-md group"
        >
          <div className="relative">
            <Image
              src="/truck.png"
              alt="Scheduled delivery"
              width={50}
              height={50}
              className="shrink-0 transition-transform duration-300 group-hover:scale-105"
              priority
            />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-gray-800 group-hover:text-green-700">
              Scheduled
            </span>
            <span className="text-xs text-gray-500">Next day delivery</span>
          </div>
        </Link>

        {/* Express */}
        <Link
          href="/delivery/express"
          className="flex items-center gap-3 px-4 py-2 rounded-lg bg-white hover:bg-gray-50 transition-all duration-300 border border-gray-200 hover:border-orange-300 hover:shadow-md group"
        >
          <div className="relative">
            <Image
              src="/bike.png"
              alt="Express delivery"
              width={50}
              height={50}
              className="shrink-0 transition-transform duration-300 group-hover:scale-105"
              priority
            />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-gray-800 group-hover:text-orange-700">
              Express
            </span>
            <span className="text-xs text-gray-500">Same day delivery</span>
          </div>
        </Link>

        {/* Mobile View: Quick info */}
        <div className="md:hidden ml-4">
          <div className="flex items-center gap-2">
            <Truck size={14} className="text-green-600" />
            <span className="text-xs font-medium text-gray-700">Free Delivery*</span>
          </div>
        </div>
      </div>

      {/* Right side: Delivery information and links */}
      <div className="flex items-center gap-6 ml-4">
        {/* Delivery Stats */}
        <div className="hidden md:flex items-center gap-4">
        
        </div>

        {/* Quick Links */}
        <div className="hidden lg:flex items-center gap-4">
        <div className="flex items-center gap-2">
            <Truck size={16} className="text-green-600" />
            <span className="text-sm font-semibold text-gray-900">Free Delivery</span>
          </div>
          
        </div>

        {/* Delivery Info - Desktop */}
        <div className="hidden md:flex flex-col items-end">
        </div>
      </div>
    </div>
  );
}