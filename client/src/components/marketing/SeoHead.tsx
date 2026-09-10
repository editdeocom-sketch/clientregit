import { useEffect } from "react";

interface SeoHeadProps {
  title?: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: string;
}

function setMetaAttribute(property: string, content: string) {
  let element = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement | null;
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute("property", property);
    document.head.appendChild(element);
  }
  element.setAttribute("content", content);
}

function setNameAttribute(name: string, content: string) {
  let element = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute("name", name);
    document.head.appendChild(element);
  }
  element.setAttribute("content", content);
}

function setLinkAttribute(rel: string, href: string) {
  let element = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!element) {
    element = document.createElement("link");
    element.setAttribute("rel", rel);
    document.head.appendChild(element);
  }
  element.setAttribute("href", href);
}

export function SeoHead({
  title,
  description,
  canonical,
  ogImage,
  ogType = "website",
}: SeoHeadProps) {
  useEffect(() => {
    const siteName = "ClientRegit";
    const fullTitle = title ? `${title} | ${siteName}` : siteName;

    document.title = fullTitle;

    if (description) {
      setMetaAttribute("og:description", description);
      setNameAttribute("twitter:description", description);
    }

    setMetaAttribute("og:title", fullTitle);
    setMetaAttribute("og:type", ogType);
    setMetaAttribute("og:site_name", siteName);
    setNameAttribute("twitter:title", fullTitle);
    setNameAttribute("twitter:card", "summary_large_image");

    if (canonical) {
      setLinkAttribute("canonical", canonical);
      setMetaAttribute("og:url", canonical);
    }

    if (ogImage) {
      setMetaAttribute("og:image", ogImage);
      setNameAttribute("twitter:image", ogImage);
    }

    return () => {
      document.title = siteName;
    };
  }, [title, description, canonical, ogImage, ogType]);

  return null;
}
