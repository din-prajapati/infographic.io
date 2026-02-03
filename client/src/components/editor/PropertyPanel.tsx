import { useState } from "react";
import { Crown, Building2, Receipt, Upload, Sparkles, X } from "lucide-react";
import { Button } from "../ui/button";
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

type PropertyTier = "luxury" | "standard" | "budget";

export function PropertyPanel() {
  const [propertyTier, setPropertyTier] = useState<PropertyTier>("standard");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [propertyTitle, setPropertyTitle] = useState("");
  const [propertyType, setPropertyType] = useState("residential");
  const [listingType, setListingType] = useState("for-sale");
  const [address, setAddress] = useState("");
  const [price, setPrice] = useState("");
  const [sqft, setSqft] = useState("");
  const [beds, setBeds] = useState("");
  const [baths, setBaths] = useState("");
  const [extraInfo, setExtraInfo] = useState("");
  const [agentName, setAgentName] = useState("");
  const [agentBrokerage, setAgentBrokerage] = useState("");

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("File size must be less than 5MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setUploadedImage(null);
  };

  const handleGenerate = () => {
    console.log("Generate infographic with:", {
      propertyTitle,
      propertyTier,
      propertyType,
      listingType,
      address,
      price,
      sqft,
      beds,
      baths,
      extraInfo,
      agentName,
      agentBrokerage,
      uploadedImage,
    });
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-8">
          {/* SECTION 1: Property Image */}
          <div className="space-y-3">
            <h3 className="font-medium">Property Image</h3>
            
            {uploadedImage ? (
              <div className="relative">
                <img
                  src={uploadedImage}
                  alt="Property"
                  className="w-full h-48 object-cover rounded-lg border border-gray-200"
                />
                <button
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 w-6 h-6 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors">
                <div className="flex flex-col items-center justify-center py-6">
                  <Upload className="w-8 h-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600 mb-1">Click to upload</p>
                  <p className="text-xs text-gray-500">SVG, PNG, JPG (max. 5MB)</p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept="image/svg+xml,image/png,image/jpeg,image/jpg"
                  onChange={handleImageUpload}
                />
              </label>
            )}
          </div>

          {/* SECTION 2: Property */}
          <div className="space-y-4">
            <h3 className="font-medium">Property</h3>

            {/* Property Title - FIRST */}
            <div className="space-y-2">
              <Label htmlFor="property-title" className="text-sm">
                Property Title
              </Label>
              <Input
                id="property-title"
                value={propertyTitle}
                onChange={(e) => setPropertyTitle(e.target.value)}
                placeholder="e.g. Modern Loft in Downtown"
              />
            </div>

            {/* Property Tier */}
            <div className="space-y-2">
              <Label className="text-sm">Property Tier</Label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setPropertyTier("luxury")}
                  className={`flex flex-col items-center justify-center py-3 px-2 rounded-lg border-2 transition-all ${
                    propertyTier === "luxury"
                      ? "border-black bg-gray-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <Crown className="w-5 h-5 mb-1" />
                  <span className="text-xs">Luxury</span>
                </button>
                <button
                  onClick={() => setPropertyTier("standard")}
                  className={`flex flex-col items-center justify-center py-3 px-2 rounded-lg border-2 transition-all ${
                    propertyTier === "standard"
                      ? "border-black bg-gray-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <Building2 className="w-5 h-5 mb-1" />
                  <span className="text-xs">Standard</span>
                </button>
                <button
                  onClick={() => setPropertyTier("budget")}
                  className={`flex flex-col items-center justify-center py-3 px-2 rounded-lg border-2 transition-all ${
                    propertyTier === "budget"
                      ? "border-black bg-gray-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <Receipt className="w-5 h-5 mb-1" />
                  <span className="text-xs">Budget</span>
                </button>
              </div>
            </div>

            {/* Property Type */}
            <div className="space-y-2">
              <Label htmlFor="property-type" className="text-sm">
                Property Type
              </Label>
              <Select value={propertyType} onValueChange={setPropertyType}>
                <SelectTrigger id="property-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="residential">Residential</SelectItem>
                  <SelectItem value="commercial">Commercial</SelectItem>
                  <SelectItem value="land">Land</SelectItem>
                  <SelectItem value="multi-family">Multi-family</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Listing Type */}
            <div className="space-y-2">
              <Label htmlFor="listing-type" className="text-sm">
                Listing Type
              </Label>
              <Select value={listingType} onValueChange={setListingType}>
                <SelectTrigger id="listing-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="for-sale">For Sale</SelectItem>
                  <SelectItem value="for-rent">For Rent</SelectItem>
                  <SelectItem value="sold">Sold</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Location/Address */}
            <div className="space-y-2">
              <Label htmlFor="address" className="text-sm">
                Address
              </Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="123 Main St, Austin, TX"
              />
            </div>

            {/* Details Grid */}
            <div className="space-y-2">
              <Label className="text-sm">Details</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="price" className="text-xs text-gray-600">
                    Price
                  </Label>
                  <Input
                    id="price"
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sqft" className="text-xs text-gray-600">
                    Sqft
                  </Label>
                  <Input
                    id="sqft"
                    type="number"
                    value={sqft}
                    onChange={(e) => setSqft(e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="beds" className="text-xs text-gray-600">
                    Beds
                  </Label>
                  <Input
                    id="beds"
                    type="number"
                    value={beds}
                    onChange={(e) => setBeds(e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="baths" className="text-xs text-gray-600">
                    Baths
                  </Label>
                  <Input
                    id="baths"
                    type="number"
                    value={baths}
                    onChange={(e) => setBaths(e.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            {/* Extra Information */}
            <div className="space-y-2">
              <Label htmlFor="extra-info" className="text-sm">
                Extra Information
              </Label>
              <Textarea
                id="extra-info"
                value={extraInfo}
                onChange={(e) => setExtraInfo(e.target.value)}
                placeholder="Enter key features, price, or location data..."
                rows={4}
                className="resize-none"
              />
            </div>
          </div>

          {/* SECTION 3: Agent */}
          <div className="space-y-4">
            <h3 className="font-medium">Agent</h3>

            {/* Agent Name */}
            <div className="space-y-2">
              <Label htmlFor="agent-name" className="text-sm">
                Agent Name
              </Label>
              <Input
                id="agent-name"
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                placeholder="Jane Smith"
              />
            </div>

            {/* Agent Brokerage */}
            <div className="space-y-2">
              <Label htmlFor="agent-brokerage" className="text-sm">
                Agent Brokerage
              </Label>
              <Input
                id="agent-brokerage"
                value={agentBrokerage}
                onChange={(e) => setAgentBrokerage(e.target.value)}
                placeholder="ABC Realty"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Generate Button - Fixed at bottom */}
      <div className="p-6 border-t border-gray-200">
        <Button
          onClick={handleGenerate}
          className="w-full bg-black hover:bg-black/90 text-white h-11"
        >
          <Sparkles className="w-4 h-4 mr-2 text-yellow-400" fill="currentColor" />
          Generate Infographic
        </Button>
      </div>
    </div>
  );
}
