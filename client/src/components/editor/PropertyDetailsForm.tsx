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

export function PropertyDetailsForm() {
  const [propertyType, setPropertyType] = useState("residential");
  const [price, setPrice] = useState("");
  const [beds, setBeds] = useState("");
  const [baths, setBaths] = useState("");
  const [sqft, setSqft] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");

  return (
    <ScrollArea className="flex-1">
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
            <Label htmlFor="beds" className="text-sm">
              Beds
            </Label>
            <Input
              id="beds"
              type="number"
              placeholder="3"
              value={beds}
              onChange={(e) => setBeds(e.target.value)}
              className="h-9"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="baths" className="text-sm">
              Baths
            </Label>
            <Input
              id="baths"
              type="number"
              placeholder="2"
              value={baths}
              onChange={(e) => setBaths(e.target.value)}
              className="h-9"
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
    </ScrollArea>
  );
}
