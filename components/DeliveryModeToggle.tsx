import Image from "next/image";
import Link from "next/link";
import { Truck, Bike, Clock, Shield, MapPin, Package, Star } from "lucide-react";

export default function DeliveryModeToggle() {
  // Naivas deep green colors
  const colors = {
    deepGreen: '#1b5e20',
    deepGreenLight: '#2e7d32',
    deepGreenLighter: '#4caf50',
    gold: '#ffc107',
    lightGreen: '#c8e6c9'
  };

  return (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between w-full gap-3 md:gap-0">
      {/* Delivery mode selection - Now more compact */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full md:w-auto">
        {/* Scheduled */}
        <Link
          href="/"
          className="flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 border hover:shadow-md group min-w-[180px]"
          style={{
            backgroundColor: '#ffffff',
            borderColor: colors.deepGreenLight,
            borderWidth: '2px'
          }}
        >
          <div className="relative">
            <div className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: colors.lightGreen }}
            >
              <Truck size={20} className="text-green-800" />
            </div>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-gray-900 group-hover:text-green-800">
                Scheduled
              </span>
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded"
                style={{ backgroundColor: colors.deepGreen }}
              >
                <Clock size={10} className="text-white" />
                <span className="text-xs font-medium text-white">Next Day</span>
              </div>
            </div>
            {/* <span className="text-xs text-gray-600 mt-0.5">Free above Ksh 2,000</span> */}
          </div>
        </Link>

        {/* Express */}
        <Link
          href="/"
          className="flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 border hover:shadow-md group min-w-[180px]"
          style={{
            backgroundColor: '#ffffff',
            borderColor: colors.gold,
            borderWidth: '2px'
          }}
        >
          <div className="relative">
            <div className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: '#fff8e1' }}
            >
              <Bike size={20} className="text-amber-700" />
            </div>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-gray-900 group-hover:text-amber-800">
                Express
              </span>
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded"
                style={{ backgroundColor: colors.gold }}
              >
                <Clock size={10} className="text-gray-900" />
                <span className="text-xs font-medium text-gray-900">Same Day</span>
              </div>
            </div>
            {/* <span className="text-xs text-gray-600 mt-0.5">Same day delivery</span> */}
          </div>
        </Link>

        {/* Mobile View: Quick info */}
        <div className="md:hidden flex items-center gap-2 px-3 py-2 rounded-lg bg-green-50 border border-green-100">
          <Truck size={14} className="text-green-600" />
          <span className="text-xs font-medium text-green-800">Free Delivery*</span>
        </div>
      </div>

      {/* Right side: Delivery information - Compact */}
      <div className="flex items-center gap-4">
        {/* Quick Links - Only show on larger screens */}
        <div className="hidden lg:flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
            style={{ backgroundColor: colors.lightGreen }}
          >
            <Truck size={16} className="text-green-700" />
            <span className="text-sm font-semibold" style={{ color: colors.deepGreen }}>
              Free Delivery
            </span>
          </div>
          
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50">
            <Shield size={16} className="text-amber-600" />
            <span className="text-sm font-semibold text-amber-800">Secure</span>
          </div>
        </div>
      </div>
    </div>
  );
}