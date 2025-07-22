import type { PropsWithChildren } from "react";
import { useEffect, useState } from "react";
import { Menu } from "../menu";
import { Button } from "@/components/ui/button";
import { Menu as MenuIcon } from "lucide-react";


export const Layout: React.FC<PropsWithChildren> = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);


  

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden">
     

      <div className="flex relative">
        {/* Mobile Overlay z delikatnym purpurowym zaciemnieniem */}
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 z-40 bg-purple-900/20 backdrop-blur-sm lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Sidebar z subtelnymi akcentami */}
        <aside
          className={`
            fixed left-0 top-0 z-50 h-screen w-64 transform transition-transform duration-300 ease-in-out
            ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
            lg:translate-x-0 lg:sticky lg:top-0 lg:z-40
            bg-background/95 backdrop-blur-md border-r border-purple-200/20
          `}
        >
          <Menu onClose={() => setIsMobileMenuOpen(false)} />
        </aside>

        {/* Main Content */}
        <main className="flex-1 lg:ml-0 min-w-0 relative z-10">
          {/* Mobile Header z eleganckim tłem */}
          <div className="sticky top-0 z-30 flex h-16 items-center border-b border-purple-200/20 bg-background/80 backdrop-blur-md px-4 lg:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMobileMenu}
              className="mr-2 hover:bg-purple-100/20 hover:text-purple-700"
            >
              <MenuIcon className="h-6 w-6" />
            </Button>
            <span className="font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Private Dancer
            </span>
          </div>

          {/* Content bezpośrednio, bez żadnych wrapperów */}
          {children}
        </main>
      </div>
    </div>
  );
};