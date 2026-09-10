interface StructuredDataProps {
  type: "Organization" | "WebSite" | "SoftwareApplication" | "FAQPage";
  data: Record<string, unknown>;
}

function buildSchema(type: string, data: Record<string, unknown>): Record<string, unknown> {
  const base = {
    "@context": "https://schema.org",
    "@type": type,
    ...data,
  };

  if (type === "Organization") {
    return {
      ...base,
      name: data.name || "ClientRegit",
      url: data.url || "https://clientregit.com",
      logo: data.logo || "https://clientregit.com/logo.png",
      description:
        data.description ||
        "Client management platform for creative professionals",
      sameAs: data.sameAs || [],
    };
  }

  if (type === "WebSite") {
    return {
      ...base,
      name: data.name || "ClientRegit",
      url: data.url || "https://clientregit.com",
      description:
        data.description ||
        "Client management platform for creative professionals",
    };
  }

  if (type === "SoftwareApplication") {
    return {
      ...base,
      name: data.name || "ClientRegit",
      applicationCategory: data.applicationCategory || "BusinessApplication",
      operatingSystem: data.operatingSystem || "Web",
      description:
        data.description ||
        "Manage clients, projects, video reviews, revisions, and invoices from one workspace",
      url: data.url || "https://clientregit.com",
      offers: data.offers || {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
    };
  }

  if (type === "FAQPage") {
    const mainEntity = data.mainEntity;
    if (!Array.isArray(mainEntity) || mainEntity.length === 0) {
      return { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: [] };
    }
    return {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity,
    };
  }

  return base;
}

export function StructuredData({ type, data }: StructuredDataProps) {
  if (type === "FAQPage") {
    const mainEntity = data.mainEntity;
    if (!Array.isArray(mainEntity) || mainEntity.length === 0) {
      return null;
    }
  }

  const schema = buildSchema(type, data);

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
