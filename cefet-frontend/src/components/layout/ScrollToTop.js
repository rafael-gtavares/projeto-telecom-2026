import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Sempre que a rota mudar, ele joga o scroll para o topo
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}