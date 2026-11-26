import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export type MenuOption = {
  name: string;
  price_delta: number;
};

export type MenuOptionGroup = {
  name: string;
  required: boolean;
  options: MenuOption[];
};

export type MenuItem = {
  name: string;
  description: string | null;
  category: string;
  price_pequena: number | null;
  price_media: number | null;
  price_grande: number | null;
  option_groups?: MenuOptionGroup[];
};

export type RestaurantInfo = {
  name: string;
  phone?: string | null;
  whatsapp?: string | null;
  address_full?: string | null;
  working_hours?: string | null;
};

const brl = (v: number | null | undefined) =>
  v == null || v === 0 ? "—" : `R$ ${Number(v).toFixed(2).replace(".", ",")}`;

export function exportMenuToPdf(items: MenuItem[], info: RestaurantInfo) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 40;

  // Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(info.name.toUpperCase(), marginX, 50);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(90);
  doc.text("Cardápio oficial — para importação 99food", marginX, 68);
  const today = new Date().toLocaleDateString("pt-BR");
  doc.text(`Gerado em ${today}`, marginX, 82);

  const contactBits: string[] = [];
  if (info.address_full) contactBits.push(info.address_full);
  if (info.phone) contactBits.push(`Tel: ${info.phone}`);
  if (info.whatsapp && info.whatsapp !== info.phone)
    contactBits.push(`WhatsApp: ${info.whatsapp}`);
  if (info.working_hours) contactBits.push(info.working_hours);
  if (contactBits.length) {
    doc.text(contactBits.join(" · "), marginX, 96, {
      maxWidth: pageWidth - marginX * 2,
    });
  }

  doc.setDrawColor(220);
  doc.line(marginX, 110, pageWidth - marginX, 110);

  // Group by category
  const byCategory = new Map<string, MenuItem[]>();
  for (const it of items) {
    const list = byCategory.get(it.category) ?? [];
    list.push(it);
    byCategory.set(it.category, list);
  }

  let cursorY = 130;

  for (const [category, list] of byCategory) {
    if (cursorY > 720) {
      doc.addPage();
      cursorY = 60;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(30);
    doc.text(category.toUpperCase(), marginX, cursorY);
    cursorY += 8;

    const body = list.map((it) => {
      const desc = it.description?.trim() ?? "";
      const opts =
        it.option_groups
          ?.flatMap((g) =>
            g.options.map(
              (o) =>
                `${o.name}${o.price_delta ? ` (+${brl(o.price_delta)})` : ""}`,
            ),
          )
          .join(", ") ?? "";
      const descWithOpts = [desc, opts && `Adicionais: ${opts}`]
        .filter(Boolean)
        .join("\n");
      return [
        it.name,
        descWithOpts,
        brl(it.price_pequena),
        brl(it.price_media),
        brl(it.price_grande),
      ];
    });

    autoTable(doc, {
      startY: cursorY,
      head: [["Item", "Descrição / Adicionais", "P", "M", "G"]],
      body,
      styles: { fontSize: 9, cellPadding: 5, valign: "top" },
      headStyles: { fillColor: [255, 140, 0], textColor: 255 },
      columnStyles: {
        0: { cellWidth: 110, fontStyle: "bold" },
        1: { cellWidth: "auto" },
        2: { cellWidth: 55, halign: "right" },
        3: { cellWidth: 55, halign: "right" },
        4: { cellWidth: 55, halign: "right" },
      },
      margin: { left: marginX, right: marginX },
    });
    // @ts-expect-error jspdf-autotable augments doc
    cursorY = (doc.lastAutoTable?.finalY ?? cursorY) + 24;
  }

  // Footer with page numbers
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(140);
    doc.text(
      `${info.name} · Página ${i} de ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 20,
      { align: "center" },
    );
  }

  const filename = `cardapio-${info.name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")}-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}
