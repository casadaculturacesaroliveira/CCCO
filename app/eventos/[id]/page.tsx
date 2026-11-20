import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublishedEvent } from "../../../lib/public-events";

export const revalidate = 300;

type Props = { params: Promise<{ id: string }> };

function excerpt(value: string | null, limit = 155) {
  const clean = (value || "").replace(/\s+/g, " ").trim();
  return clean.length > limit ? clean.slice(0, limit - 1).trimEnd() + "…" : clean;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const event = await getPublishedEvent(id);
  if (!event) return { title: "Evento não encontrado", robots: { index: false, follow: false } };
  const title = event.title;
  const description = excerpt(event.description) || `Conheça ${title} na Casa da Cultura César Oliveira, em Oliveira do Hospital.`;
  const url = `https://ccco.pt/eventos/${event.id}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title,
      description,
      url,
      images: event.image_url?.startsWith("https://") ? [{ url: event.image_url }] : undefined,
    },
  };
}

export default async function EventPage({ params }: Props) {
  const { id } = await params;
  const event = await getPublishedEvent(id);
  if (!event) notFound();
  const date = event.starts_at ? new Date(event.starts_at) : null;
  const validDate = date && !Number.isNaN(date.getTime()) ? date : null;
  const formattedDate = validDate
    ? new Intl.DateTimeFormat("pt-PT", { dateStyle: "full", timeStyle: "short", timeZone: "Europe/Lisbon" }).format(validDate)
    : null;
  const url = `https://ccco.pt/eventos/${event.id}`;
  const schema = validDate ? {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description: event.description || undefined,
    startDate: validDate.toISOString(),
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    url,
    location: {
      "@type": "Place",
      name: event.location || "Casa da Cultura César Oliveira",
      address: { "@type": "PostalAddress", addressLocality: "Oliveira do Hospital", addressCountry: "PT" },
    },
    image: event.image_url?.startsWith("https://") ? [event.image_url] : undefined,
    organizer: { "@type": "Organization", name: "Casa da Cultura César Oliveira", url: "https://ccco.pt" },
    offers: event.ticket_url?.startsWith("https://") ? { "@type": "Offer", url: event.ticket_url } : undefined,
  } : null;
  return (
    <main style={{ maxWidth: 850, margin: "0 auto", padding: "clamp(24px, 5vw, 64px)", fontFamily: "inherit" }}>
      {schema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />}
      <nav aria-label="Navegação"><Link href="/">← Casa da Cultura César Oliveira</Link></nav>
      <article style={{ marginTop: 36 }}>
        {event.category && <p>{event.category}</p>}
        <h1>{event.title}</h1>
        {formattedDate && <p><strong>Data e hora:</strong> <time dateTime={validDate!.toISOString()}>{formattedDate}</time></p>}
        <p><strong>Local:</strong> {event.location || "Casa da Cultura César Oliveira, Oliveira do Hospital"}</p>
        {event.image_url?.startsWith("https://") && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={event.image_url} alt={`Cartaz de ${event.title}`} style={{ width: "100%", maxHeight: 560, objectFit: "contain", marginBlock: 24 }} />
        )}
        {event.description && <div style={{ whiteSpace: "pre-line", lineHeight: 1.7 }}>{event.description}</div>}
        {event.ticket_url?.startsWith("https://") && (
          <p style={{ marginTop: 32 }}><a href={event.ticket_url} target="_blank" rel="noopener noreferrer">Consultar bilhetes</a></p>
        )}
      </article>
    </main>
  );
}
