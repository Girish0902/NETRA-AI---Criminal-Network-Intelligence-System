import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/layout/Sidebar";
import Topbar from "../components/layout/Topbar";

export default function DashboardLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1100) {
        setSidebarCollapsed(true);
      }
    };

    handleResize();

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div className="app-atmosphere min-h-screen">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((current) => !current)}
      />

      <Topbar
        sidebarCollapsed={sidebarCollapsed}
        onOpenMobileSidebar={() => setSidebarCollapsed(false)}
      />

      <main
        className={[
          "min-h-screen pt-18 transition-[margin-left] duration-300",
          sidebarCollapsed ? "ml-20" : "ml-72",
        ].join(" ")}
      >
        <div className="mx-auto w-full max-w-[1700px] p-5 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}