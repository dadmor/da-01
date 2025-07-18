import type { PropsWithChildren } from "react";
import { useEffect, useState } from "react";
import { Menu } from "../menu";
import { Button } from "@/components/ui/button";
import { Menu as MenuIcon, X } from "lucide-react";
import { Breadcrumb } from "../navigation";

export const Layout: React.FC<PropsWithChildren> = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const maxScroll = 250; // max scroll do pełnej przezroczystości
      const newOpacity = Math.max(0, 1 - (scrollY / maxScroll) * 0.5); // z 0.5 do 0
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
     <div style={{ opacity }} className="h-96 fixed top-0 w-full bg-gradient-to-br from-zinc-500/5 to-zinc-500/10 -rotate-1 scale-125"></div>

      <div className="flex relative">
        {/* Mobile Overlay */}
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`
    fixed left-0 top-0 z-50 h-screen w-64 transform transition-transform duration-300 ease-in-out
    ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
    lg:translate-x-0 lg:sticky lg:top-0 lg:z-40
  `}
        >
          <Menu onClose={() => setIsMobileMenuOpen(false)} />
        </aside>

        {/* Main Content */}
        <main className="flex-1 ml-0 2xl:ml-48">
          {/* Mobile Header */}
          <div className="sticky top-0 z-30 flex h-16 items-center border-b bg-background px-4 lg:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMobileMenu}
              className="mr-2"
            >
              <MenuIcon className="h-6 w-6" />
            </Button>
            <span className="font-semibold">Dashboard</span>
          </div>

          <div className="container mx-auto p-4 lg:p-6">
            <div className="mb-6">
              <Breadcrumb />
            </div>
            <div className="p-0 lg:p-12 space-y-6">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
};
