
import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, CheckCircle2, Loader2, Search } from "lucide-react";
import { normalizeAddress, addressesMatch } from "@/utils/addressNormalization";
import { cn } from "@/lib/utils";

export default function AddressAutocomplete({
  customers = [],
  value = { street: "", house_number: "", postal_code: "", city: "" },
  onChange,
  onHouseholdFound,
  errors = {}
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [predictions, setPredictions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showPredictions, setShowPredictions] = useState(false);

  // Debounce timeout ref
  const searchTimeoutRef = useRef(null);

  // Handle Search with Debounce for Nominatim (OSM)
  useEffect(() => {
    if (!searchTerm || searchTerm.length < 3) {
      setPredictions([]);
      setShowPredictions(false);
      return;
    }

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Debounce 1000ms (polite to OSM servers)
    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchTerm)}&addressdetails=1&countrycodes=de&limit=5`
        );
        const data = await response.json();

        if (data && Array.isArray(data)) {
          setPredictions(data);
          setShowPredictions(true);
        } else {
          setPredictions([]);
          setShowPredictions(false);
        }
      } catch (error) {
        console.error("OSM Search Error:", error);
        setPredictions([]);
      } finally {
        setIsSearching(false);
      }
    }, 800);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };

  }, [searchTerm]);


  const handleSelectPrediction = (place) => {
    // Parse Nominatim Address Components
    const addr = place.address;

    // Normalize data
    const street = addr.road || addr.pedestrian || addr.street || "";
    const houseNumber = addr.house_number || "";
    const postalCode = addr.postcode || "";
    const city = addr.city || addr.town || addr.village || addr.municipality || "";

    const newValue = {
      street,
      house_number: houseNumber,
      postal_code: postalCode,
      city
    };

    onChange(newValue);
    setSearchTerm("");
    setShowPredictions(false);
    checkHousehold(newValue);
  };

  // Helper to check household (same as before)
  const parseAddress = (address) => {
    if (!address) return null;
    const match = address.match(/^(.+?)\s+(\d+[a-zA-Z]?)$/);
    if (match) {
      return { street: match[1].trim(), house_number: match[2].trim() };
    }
    return { street: address.trim(), house_number: "" };
  };

  const checkHousehold = (addressValue) => {
    if (addressValue.street && addressValue.postal_code && addressValue.city) {
      const currentNormalized = normalizeAddress(
        addressValue.street,
        addressValue.house_number,
        addressValue.postal_code,
        addressValue.city
      );

      const household = customers.filter(c => {
        if (!c.address || !c.postal_code || !c.city) return false;

        const parsed = parseAddress(c.address);
        const customerNormalized = normalizeAddress(
          parsed?.street || c.address,
          parsed?.house_number || "",
          c.postal_code,
          c.city
        );

        return addressesMatch(currentNormalized, customerNormalized);
      });

      onHouseholdFound?.(household.length > 0 ? household : []);
    } else {
      onHouseholdFound?.([]);
    }
  };

  const handleManualChange = (field, newValue) => {
    const updated = {
      ...value,
      [field]: newValue
    };
    onChange(updated);
    if (field !== "notes") {
      checkHousehold(updated);
    }
  };

  const getCurrentAddressString = () => {
    const parts = [];
    if (value.street) parts.push(value.street);
    if (value.house_number) parts.push(value.house_number);
    if (value.postal_code) parts.push(value.postal_code);
    if (value.city) parts.push(value.city);
    return parts.join(", ");
  };

  return (
    <div className="space-y-4">
      {/* Address Search */}
      <div className="relative">
        <Label className="text-[#EAECEF] flex items-center gap-2 mb-2">
          <MapPin className="h-4 w-4 text-emerald-400" />
          Adresse suchen
        </Label>

        <div className="relative">
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Adresse eingeben (z.B. Bielefelder Str. 1)..."
            className="bg-[#1F2228] border-emerald-500/30 text-[#EAECEF] pr-10"
          />
          {isSearching && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-400 animate-spin" />
          )}
          {!isSearching && searchTerm.length > 0 && (
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-400" />
          )}
        </div>

        {/* Suggestions Dropdown */}
        {showPredictions && predictions.length > 0 && (
          <div className="absolute z-50 w-full mt-2 bg-[#181B21] border-2 border-emerald-500/30 rounded-xl shadow-xl max-h-80 overflow-auto">
            {predictions.map((prediction) => (
              <button
                key={prediction.place_id}
                onClick={() => handleSelectPrediction(prediction)}
                className="w-full text-left p-4 hover:bg-emerald-500/10 transition-all border-b border-[#2D3139] last:border-0"
              >
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-1" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#EAECEF] font-medium truncate">
                      {(() => {
                        const addr = prediction.address || {};
                        // Construct nicely formatted main text: "Street HouseNr"
                        const road = addr.road || addr.pedestrian || addr.street || "";
                        const houseNr = addr.house_number || "";
                        if (road) return `${road} ${houseNr}`.trim();
                        // Fallback if no specific road found (e.g. city search)
                        return prediction.display_name.split(",")[0];
                      })()}
                    </p>
                    <p className="text-xs text-[#9CA3AF] truncate">
                      {(() => {
                        // Construct nicely formatted sub text: "PLZ City, State"
                        const addr = prediction.address || {};
                        const parts = [];
                        if (addr.postcode) parts.push(addr.postcode);
                        const city = addr.city || addr.town || addr.village || addr.municipality;
                        if (city) parts.push(city);
                        if (addr.state) parts.push(addr.state);

                        const constructed = parts.join(" ");
                        // If constructed is empty or same as main text, use display_name (minus the first part)
                        if (!constructed || constructed.length < 5) return prediction.display_name;

                        return constructed;
                      })()}
                    </p>
                  </div>
                </div>
              </button>
            ))}

            <div className="px-4 py-2 flex justify-end">
              <span className="text-[10px] text-[#9CA3AF] opacity-50">Daten von OpenStreetMap</span>
            </div>
          </div>
        )}

        {showPredictions && predictions.length === 0 && !isSearching && searchTerm.length >= 3 && (
          <div className="absolute z-50 w-full mt-2 bg-[#181B21] border border-amber-500/30 rounded-xl p-4">
            <p className="text-sm text-amber-400">Keine Adressen gefunden</p>
          </div>
        )}
      </div>

      {/* Manual Fields */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2">
          <Label className="text-[#EAECEF]">Straße *</Label>
          <Input
            value={value.street}
            onChange={(e) => handleManualChange('street', e.target.value)}
            className={cn(
              "mt-2 bg-[#1F2228] border-[#2D3139] text-[#EAECEF]",
              errors.street && "border-red-500 focus:border-red-500"
            )}
            placeholder="z.B. Detmolder Straße"
          />
          {errors.street && <p className="text-xs text-red-500 mt-1">Straße fehlt</p>}
        </div>

        <div>
          <Label className="text-[#EAECEF]">Hausnr. *</Label>
          <Input
            value={value.house_number}
            onChange={(e) => handleManualChange('house_number', e.target.value)}
            className="mt-2 bg-[#1F2228] border-[#2D3139] text-[#EAECEF]"
            placeholder="12"
          />
        </div>

        <div>
          <Label className="text-[#EAECEF]">PLZ *</Label>
          <Input
            value={value.postal_code}
            onChange={(e) => handleManualChange('postal_code', e.target.value)}
            className={cn(
              "mt-2 bg-[#1F2228] border-[#2D3139] text-[#EAECEF]",
              errors.postal_code && "border-red-500 focus:border-red-500"
            )}
            placeholder="33602"
            maxLength={5}
          />
          {errors.postal_code && <p className="text-xs text-red-500 mt-1">PLZ fehlt</p>}
        </div>
      </div>

      <div>
        <Label className="text-[#EAECEF]">Stadt *</Label>
        <Input
          value={value.city}
          onChange={(e) => handleManualChange('city', e.target.value)}
          className={cn(
            "mt-2 bg-[#1F2228] border-[#2D3139] text-[#EAECEF]",
            errors.city && "border-red-500 focus:border-red-500"
          )}
          placeholder="Bielefeld"
        />
        {errors.city && <p className="text-xs text-red-500 mt-1">Stadt fehlt</p>}
      </div>

      {getCurrentAddressString() && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span className="text-sm text-emerald-400">
            Erfasst: {getCurrentAddressString()}
          </span>
        </div>
      )}
    </div>
  );
}
