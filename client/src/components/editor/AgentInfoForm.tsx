/**
 * Agent Info Form Component
 * Form fields for agent information and branding
 */

import { useState } from "react";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import { ScrollArea } from "../ui/scroll-area";
import { Upload, User } from "lucide-react";

export function AgentInfoForm() {
  const [agentName, setAgentName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [license, setLicense] = useState("");
  const [brokerage, setBrokerage] = useState("");
  const [website, setWebsite] = useState("");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <ScrollArea className="flex-1">
      <div className="p-3 space-y-4">
        <div className="space-y-2">
          <h3 className="font-medium">Agent Information</h3>
          <p className="text-xs text-muted-foreground">
            Your contact details and branding
          </p>
        </div>

        <Separator />

        {/* Logo Upload */}
        <div className="space-y-2">
          <Label className="text-sm">Agent Photo / Logo</Label>
          <div className="flex items-center gap-3">
            <div className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50">
              {logoPreview ? (
                <img
                  src={logoPreview}
                  alt="Agent logo"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-8 h-8 text-gray-400" />
              )}
            </div>
            <div className="flex-1">
              <input
                type="file"
                id="logo-upload"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
              <Label htmlFor="logo-upload">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 cursor-pointer"
                  asChild
                >
                  <span>
                    <Upload className="w-4 h-4" />
                    Upload Photo
                  </span>
                </Button>
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                JPG, PNG (max 5MB)
              </p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Agent Name */}
        <div className="space-y-2">
          <Label htmlFor="agent-name" className="text-sm">
            Agent Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="agent-name"
            type="text"
            placeholder="John Doe"
            value={agentName}
            onChange={(e) => setAgentName(e.target.value)}
            className="h-9"
          />
        </div>

        {/* Phone */}
        <div className="space-y-2">
          <Label htmlFor="phone" className="text-sm">
            Phone Number <span className="text-red-500">*</span>
          </Label>
          <Input
            id="phone"
            type="tel"
            placeholder="(555) 123-4567"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="h-9"
          />
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm">
            Email <span className="text-red-500">*</span>
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="john@realestate.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-9"
          />
        </div>

        {/* License Number */}
        <div className="space-y-2">
          <Label htmlFor="license" className="text-sm">
            License Number
          </Label>
          <Input
            id="license"
            type="text"
            placeholder="RE123456"
            value={license}
            onChange={(e) => setLicense(e.target.value)}
            className="h-9"
          />
        </div>

        {/* Brokerage */}
        <div className="space-y-2">
          <Label htmlFor="brokerage" className="text-sm">
            Brokerage Name
          </Label>
          <Input
            id="brokerage"
            type="text"
            placeholder="ABC Realty"
            value={brokerage}
            onChange={(e) => setBrokerage(e.target.value)}
            className="h-9"
          />
        </div>

        {/* Website */}
        <div className="space-y-2">
          <Label htmlFor="website" className="text-sm">
            Website URL
          </Label>
          <Input
            id="website"
            type="url"
            placeholder="www.johnrealestate.com"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            className="h-9"
          />
        </div>

        {/* Social Media */}
        <div className="space-y-2">
          <Label className="text-sm">Social Media (Optional)</Label>
          <div className="space-y-2">
            <Input
              type="url"
              placeholder="Facebook URL"
              className="h-9 text-sm"
            />
            <Input
              type="url"
              placeholder="Instagram handle"
              className="h-9 text-sm"
            />
            <Input
              type="url"
              placeholder="LinkedIn URL"
              className="h-9 text-sm"
            />
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}
