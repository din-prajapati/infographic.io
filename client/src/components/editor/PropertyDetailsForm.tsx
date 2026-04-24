/**
 * Property Details Form Component
 * Form fields for property information
 */

import { useState } from "react";
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
import { ScrollArea } from "../ui/scroll-area";
import { NumberStepper } from "../ui/number-stepper";

export function PropertyDetailsForm() {
  const [propertyType, setPropertyType] = useState("residential");
  const [price, setPrice] = useState("$500,000");
  const [beds, setBeds] = useState(3);
  const [baths, setBaths] = useState(2);
  const [sqft, setSqft] = useState("2,500");
  const [address, setAddress] = useState("123 Test Avenue, Design City");
  const [description, setDescription] = useState("Beautiful modern home with pool and garden.");

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
          <Select value={propertyType} onValueChange={setPropertyType}>
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

        {/* Price */}
        <div className="space-y-2">
          <Label htmlFor="price" className="text-sm">
            Price <span className="text-red-500">*</span>
          </Label>
          <Input
            id="price"
            type="text"
            placeholder="$450,000"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="h-9"
          />
        </div>

        {/* Beds & Baths */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label className="text-sm">Beds</Label>
            <NumberStepper
              value={beds}
              onChange={setBeds}
              min={0}
              max={20}
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm">Baths</Label>
            <NumberStepper
              value={baths}
              onChange={setBaths}
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
            value={sqft}
            onChange={(e) => setSqft(e.target.value)}
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
            value={address}
            onChange={(e) => setAddress(e.target.value)}
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
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="min-h-[80px] resize-none"
          />
          <p className="text-xs text-muted-foreground">
            {description.length}/500 characters
          </p>
        </div>

        {/* Features/Amenities */}
        <div className="space-y-2">
          <Label className="text-sm">Features & Amenities</Label>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="rounded" />
              <span className="text-xs">Pool</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="rounded" />
              <span className="text-xs">Garage</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="rounded" />
              <span className="text-xs">Garden</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="rounded" />
              <span className="text-xs">Fireplace</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="rounded" />
              <span className="text-xs">AC</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="rounded" />
              <span className="text-xs">Heating</span>
            </label>
          </div>
        </div>
      </div>
      </div>

  );
}
