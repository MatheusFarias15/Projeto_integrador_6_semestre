import { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { Car, LayoutDashboard, Wrench, Receipt, LogOut, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false); // Começa fechado no mobile
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  // Detectar se é mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      // No mobile, sidebar começa fechado
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logout realizado",
      description: "Até logo!",
    });
    navigate("/auth");
  };

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/" },
    { icon: Car, label: "Veículos", path: "/vehicles" },
    { icon: Wrench, label: "Manutenções", path: "/maintenances" },
    { icon: Receipt, label: "Despesas", path: "/expenses" },
  ];

  const isActive = (path: string) => location.pathname === path;

  // Fechar sidebar ao clicar em item no mobile
  const handleMenuClick = (path: string) => {
    navigate(path);
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  return (
    <div className="min-h-screen flex w-full relative">
      {/* Overlay para mobile quando sidebar está aberto */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "w-64" : isMobile ? "w-0" : "w-20"
        } ${
          isMobile ? "fixed left-0 top-0 h-full z-50" : "relative"
        } bg-sidebar text-sidebar-foreground transition-all duration-300 flex flex-col shadow-elevated overflow-hidden`}
      >
        <div className="p-4 flex items-center justify-between border-b border-sidebar-border min-h-[73px]">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <Car className="h-6 w-6 text-accent flex-shrink-0" />
              <h1 className="text-lg font-bold whitespace-nowrap">AutoControl</h1>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-sidebar-foreground hover:bg-sidebar-accent flex-shrink-0"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => (
            <Button
              key={item.path}
              variant={isActive(item.path) ? "default" : "ghost"}
              className={`w-full justify-start gap-3 ${
                isActive(item.path)
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50"
              }`}
              onClick={() => handleMenuClick(item.path)}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {sidebarOpen && <span className="whitespace-nowrap">{item.label}</span>}
            </Button>
          ))}
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent/50"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            {sidebarOpen && <span className="whitespace-nowrap">Sair</span>}
          </Button>
        </div>
      </aside>

      {/* Header mobile */}
      {isMobile && !sidebarOpen && (
        <div className="fixed top-0 left-0 right-0 bg-sidebar text-sidebar-foreground p-4 flex items-center justify-between border-b border-sidebar-border z-30">
          <div className="flex items-center gap-2">
            <Car className="h-6 w-6 text-accent" />
            <h1 className="text-lg font-bold">AutoControl</h1>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
            className="text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      )}

      {/* Main Content */}
      <main className={`flex-1 overflow-auto ${isMobile && !sidebarOpen ? 'pt-[73px]' : ''}`}>
        <div className="container mx-auto p-4 sm:p-6 max-w-7xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;