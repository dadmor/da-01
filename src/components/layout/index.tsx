import type { PropsWithChildren } from "react";
import { useEffect, useState } from "react";
import { Menu } from "../menu";
import { Button } from "@/components/ui/button";
import { Menu as MenuIcon } from "lucide-react";
import { Breadcrumb } from "../navigation";

export const Layout: React.FC<PropsWithChildren> = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const maxScroll = 250;
      const newOpacity = Math.max(0, 1 - (scrollY / maxScroll) * 0.4);
      setOpacity(newOpacity);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="min-h-screen bg-background relative">
      {/* Ekskluzywny gradient w tle - purpurowo-różowy */}
      <div 
        style={{ opacity }} 
        className="h-96 fixed top-0 w-full -rotate-1 scale-125 overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-purple-400/10 via-pink-300/10 to-purple-500/5" />
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-pink-200/5 to-purple-300/10" />
      </div>

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
        <main className="flex-1 ml-0 2xl:ml-48">
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

          <div className="container mx-auto p-4 lg:p-6">
            <div className="mb-6">
              <Breadcrumb />
            </div>
            
            {/* Główna zawartość z delikatnym tłem */}
            <div className="p-0 lg:p-12 space-y-6">
              {/* Opcjonalny element dekoracyjny */}
              <div className="absolute -top-20 -right-20 w-96 h-96 bg-gradient-to-br from-purple-300/10 to-pink-300/10 rounded-full blur-3xl pointer-events-none" />
              
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};