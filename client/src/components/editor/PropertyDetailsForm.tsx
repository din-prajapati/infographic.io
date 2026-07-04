import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Separator } from "../ui/separator";
import { NumberStepper } from "../ui/number-stepper";
import { usePropertyStore } from "../../hooks/usePropertyStore";

const FEATURES = ["Pool", "Garage", "Garden", "Fireplace", "AC", "Heating"];

export function PropertyDetailsForm() {
  const { property, setProperty } = usePropertyStore();

  const toggleFeature = (feature: string) => {
    const next = property.features.includes(feature)
      ? property.features.filter((f) => f !== feature)
      : [...property.features, feature];
    setProperty({ features: next });
  };

  return (
    <div className="flex-1">
      <div className="p-3 space-y-4">
        <div className="space-y-2">
          <h3 className="font-medium">Property Information</h3>
          <p className="text-xs text-muted-foreground">
            Fill in property details for AI generation
          </p>
        </div>

        <Separator />

        {/* Property Type */}
        <div className="space-y-2">
          <Label htmlFor="property-type" className="text-sm">
            Property Type <span className="text-red-500">*</span>
          </Label>
          <Select
            value={property.type}
            onValueChange={(v) => setProperty({ type: v as typeof property.type })}
          >
            <SelectTrigger id="property-type" className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="residential">Residential</SelectItem>
              <SelectItem value="commercial">Commercial</SelectItem>
              <SelectItem value="luxury">Luxury</SelectItem>
              <SelectItem value="land">Land/Lots</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Headline — optional; blank = AI auto-generates one */}
        <div className="space-y-2">
          <Label htmlFor="headline" className="text-sm">
            Headline
          </Label>
          <Input
            id="headline"
            type="text"
            placeholder="e.g. Stunning Hilltop Retreat"
            value={property.headline}
            onChange={(e) => setProperty({ headline: e.target.value })}
            maxLength={35}
            className="h-9"
          />
          <p className="text-xs text-muted-foreground">
            Max 35 chars · Leave blank and AI will write one for you
          </p>
        </div>

        {/* Price */}
        <div className="space-y-2">
          <Label htmlFor="price" className="text-sm">
            Price <span className="text-red-500">*</span>
          </Label>
          <Input
            id="price"
            type="text"
            placeholder="$450,000"
            value={property.price}
            onChange={(e) => setProperty({ price: e.target.value })}
            className="h-9"
          />
        </div>

        {/* Beds & Baths */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label className="text-sm">Beds</Label>
            <NumberStepper
              value={property.beds}
              onChange={(v) => setProperty({ beds: v })}
              min={0}
              max={20}
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm">Baths</Label>
            <NumberStepper
              value={property.baths}
              onChange={(v) => setProperty({ baths: v })}
              min={0}
              max={20}
              className="w-full"
            />
          </div>
        </div>

        {/* Square Footage */}
        <div className="space-y-2">
          <Label htmlFor="sqft" className="text-sm">
            Square Feet
          </Label>
          <Input
            id="sqft"
            type="text"
            placeholder="2,500"
            value={property.sqft}
            onChange={(e) => setProperty({ sqft: e.target.value })}
            className="h-9"
          />
        </div>

        {/* Address */}
        <div className="space-y-2">
          <Label htmlFor="address" className="text-sm">
            Address <span className="text-red-500">*</span>
          </Label>
          <Input
            id="address"
            type="text"
            placeholder="123 Main Street, City, State"
            value={property.address}
            onChange={(e) => setProperty({ address: e.target.value })}
            className="h-9"
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description" className="text-sm">
            Description
          </Label>
          <Textarea
            id="description"
            placeholder="Beautiful family home with modern amenities..."
            value={property.description}
            onChange={(e) => setProperty({ description: e.target.value })}
            className="min-h-[80px] resize-none"
            maxLength={500}
          />
          <p className="text-xs text-muted-foreground">
            {property.description.length}/500 characters
          </p>
        </div>

        {/* Features & Amenities */}
        <div className="space-y-2">
          <Label className="text-sm">Features & Amenities</Label>
          <div className="grid grid-cols-2 gap-2">
            {FEATURES.map((feature) => (
              <label key={feature} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded"
                  checked={property.features.includes(feature)}
                  onChange={() => toggleFeature(feature)}
                />
                <span className="text-xs">{feature}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
