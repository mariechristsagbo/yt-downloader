import { Download } from "lucide-react";
import { ModeToggle } from "./mode-toggle";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 max-w-7xl mx-auto px-4 py-2">
      <div className="container flex h-14 items-center">
        <div className="flex items-center space-x-2">
          <Download className="h-6 w-6" />
          <span className="hidden font-bold sm:inline-block">
            YouTube Downloader
          </span>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center space-x-2">
            <ModeToggle />
          </nav>
        </div>
      </div>
    </header>
  );
}