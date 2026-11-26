import { useEffect } from "react";
import { useRestaurantSettings } from "@/hooks/useRestaurantSettings";

/**
 * Updates document <title> and meta tags dynamically
 * based on restaurant_settings from the database.
 */
export function useDocumentMeta() {
  const { settings, loading } = useRestaurantSettings();

  useEffect(() => {
    if (loading) return;

    const name = settings.name || "Restaurante";
    const slogan = settings.slogan || "";

    // Title
    document.title = `${name} - Delivery de Qualidade`;

    // Meta description
    const desc = slogan
      ? `${slogan}. Peça pelo site com entrega rápida!`
      : `Os melhores pratos, entregues com rapidez e carinho.`;
    setMeta("description", desc);

    // Open Graph
    setMeta("og:title", `${name} - Delivery de Qualidade`, "property");
    setMeta("og:description", desc, "property");

    // Twitter
    setMeta("twitter:site", `@${name.replace(/\s+/g, "")}`, "name");

    // Author
    setMeta("author", name);
  }, [settings, loading]);
}

function setMeta(key: string, content: string, attr: "name" | "property" = "name") {
  let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.content = content;
}
