import { Monitor, Moon, Sun, Check } from "lucide-react";
import { useTheme } from "@/lib/theme-provider";

type ThemeOption = "system" | "dark" | "light";

const themeOptions: { value: ThemeOption; label: string; description: string; icon: typeof Monitor }[] = [
  {
    value: "system",
    label: "System",
    description: "Follows your operating system preference",
    icon: Monitor,
  },
  {
    value: "dark",
    label: "Dark",
    description: "Dark background with glass surfaces",
    icon: Moon,
  },
  {
    value: "light",
    label: "Light",
    description: "Light background with glass surfaces",
    icon: Sun,
  },
];

export function AppearanceScreen() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  return (
    <div className="space-y-6">
      <div className="glass rounded-xl p-6 border border-border">
        <h2 className="mb-2 text-foreground font-medium">Appearance</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Choose how the app looks and feels. Select a theme preference below.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {themeOptions.map((option) => {
            const isSelected = theme === option.value;
            const Icon = option.icon;

            return (
              <button
                key={option.value}
                onClick={() => setTheme(option.value)}
                className={`
                  relative flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition-all duration-200
                  ${
                    isSelected
                      ? "border-primary bg-primary/5 shadow-md ring-2 ring-primary/30"
                      : "border-border bg-muted/20 hover:border-primary/50 hover:bg-accent/50"
                  }
                `}
              >
                {/* Check indicator */}
                {isSelected && (
                  <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-3 h-3 text-primary-foreground" />
                  </div>
                )}

                {/* Theme preview */}
                <div
                  className={`
                    w-full aspect-[16/10] rounded-lg overflow-hidden border
                    ${option.value === "dark" || (option.value === "system" && resolvedTheme === "dark")
                      ? "bg-[hsl(228,20%,8%)] border-white/10"
                      : "bg-[hsl(220,20%,97%)] border-gray-200"
                    }
                  `}
                >
                  {/* Mini mockup */}
                  <div className="p-2 h-full flex flex-col gap-1.5">
                    {/* Mini header bar */}
                    <div
                      className={`h-2 rounded-full w-full ${
                        option.value === "dark" || (option.value === "system" && resolvedTheme === "dark")
                          ? "bg-white/10"
                          : "bg-gray-200"
                      }`}
                    />
                    {/* Mini content cards */}
                    <div className="flex-1 flex gap-1">
                      <div
                        className={`flex-1 rounded ${
                          option.value === "dark" || (option.value === "system" && resolvedTheme === "dark")
                            ? "bg-white/5 border border-white/10"
                            : "bg-white/80 border border-gray-100"
                        }`}
                      />
                      <div
                        className={`flex-1 rounded ${
                          option.value === "dark" || (option.value === "system" && resolvedTheme === "dark")
                            ? "bg-white/5 border border-white/10"
                            : "bg-white/80 border border-gray-100"
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* Label */}
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                  <span className={`text-sm font-medium ${isSelected ? "text-primary" : "text-foreground"}`}>
                    {option.label}
                  </span>
                </div>

                {/* Description */}
                <p className="text-xs text-muted-foreground text-center leading-relaxed">
                  {option.description}
                </p>
              </button>
            );
          })}
        </div>

        {/* Current status */}
        <div className="mt-6 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Currently using <span className="font-medium text-foreground">{resolvedTheme}</span> mode
            {theme === "system" && " (following system)"}
          </p>
        </div>
      </div>
    </div>
  );
}
