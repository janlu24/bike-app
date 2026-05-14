import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { ItemRow } from "@/types/supabase";

export interface TourPacklistPDFProps {
  tourName: string;
  tourDate?: string | null;
  presetName?: string;
  bikeItem: ItemRow | null;
  bikeChildren: ItemRow[];
  gearItems: ItemRow[];
  clothingItems: ItemRow[];
  bikeSetupWeightG: number;
  payloadWeightG: number;
  totalWeightG: number;
  showWeights: boolean;
}

function fmt3dp(g: number): string {
  return `${(Math.round(g) / 1000).toFixed(3).replace(".", ",")} kg`;
}

function fmtWeight(g: number): string {
  const rounded = Math.round(g);
  if (rounded < 1000) return `${rounded} g`;
  return `${(rounded / 1000).toFixed(3).replace(".", ",").replace(/,?0+$/, "")} kg`;
}

function fmtDate(dateStr?: string | null): string {
  if (!dateStr) return "–";
  try {
    const [y, m, d] = dateStr.slice(0, 10).split("-");
    return `${d}.${m}.${y}`;
  } catch {
    return dateStr;
  }
}

const col = {
  bg: "#ffffff",
  surface: "#f9fafb",
  border: "#e5e7eb",
  text: "#111827",
  muted: "#6b7280",
  label: "#9ca3af",
  petrol: "#0d9488",
  amber: "#b45309",
  childBg: "#f3f4f6",
};

const s = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    backgroundColor: col.bg,
    paddingHorizontal: 40,
    paddingTop: 40,
    paddingBottom: 56,
    fontSize: 10,
    color: col.text,
  },
  // Header
  headerBlock: { marginBottom: 18 },
  tourName: { fontSize: 20, fontFamily: "Helvetica-Bold", color: col.text, marginBottom: 4 },
  metaRow: { flexDirection: "row", gap: 16, marginBottom: 2 },
  metaLabel: { fontSize: 8, color: col.label, textTransform: "uppercase" },
  metaValue: { fontSize: 9, color: col.muted },
  presetValue: { fontSize: 9, color: col.amber },
  // Weight bar
  weightBar: {
    flexDirection: "row",
    backgroundColor: col.surface,
    borderWidth: 1,
    borderColor: col.border,
    borderStyle: "solid",
    borderRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 20,
    alignItems: "center",
  },
  weightItem: { flex: 1 },
  weightItemLast: { flex: 1 },
  weightLabel: {
    fontSize: 7,
    color: col.label,
    fontFamily: "Helvetica-Bold",
    marginBottom: 3,
  },
  weightValue: { fontSize: 13, fontFamily: "Helvetica-Bold", color: col.text },
  weightValueAccent: { fontSize: 13, fontFamily: "Helvetica-Bold", color: col.petrol },
  weightSep: { width: 1, height: 30, backgroundColor: col.border, marginHorizontal: 12 },
  // Section
  section: { marginBottom: 18 },
  sectionTitle: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: col.muted,
    marginBottom: 6,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: col.border,
    borderBottomStyle: "solid",
  },
  // Table
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: col.border,
    borderBottomStyle: "solid",
  },
  tableRowEven: { backgroundColor: col.surface },
  childRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 5,
    paddingLeft: 28,
    paddingRight: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: col.border,
    borderBottomStyle: "solid",
    backgroundColor: col.childBg,
  },
  checkbox: {
    width: 11,
    height: 11,
    borderWidth: 1,
    borderColor: "#9ca3af",
    borderStyle: "solid",
    borderRadius: 2,
    marginRight: 9,
    flexShrink: 0,
  },
  itemName: { flex: 1, fontSize: 9.5, color: col.text },
  itemNameChild: { flex: 1, fontSize: 9, color: col.muted },
  itemCategory: { fontSize: 8, color: col.label, width: 72, textAlign: "right" },
  itemWeight: { fontSize: 9, color: col.muted, width: 60, textAlign: "right" },
  // Sum row
  sumRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingVertical: 5,
    paddingHorizontal: 8,
    backgroundColor: col.surface,
    borderBottomWidth: 0.5,
    borderBottomColor: col.border,
    borderBottomStyle: "solid",
  },
  sumLabel: { fontSize: 8, color: col.muted, marginRight: 8 },
  sumValue: { fontSize: 9, fontFamily: "Helvetica-Bold", width: 60, textAlign: "right" },
  // Footer
  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 0.5,
    borderTopColor: col.border,
    borderTopStyle: "solid",
    paddingTop: 6,
  },
  footerText: { fontSize: 8, color: col.label },
});

function ItemTableRow({ item, index }: { item: ItemRow; index: number }) {
  const name = `${item.brand}${item.model ? ` ${item.model}` : ""}`;
  return (
    <View style={[s.tableRow, index % 2 === 1 ? s.tableRowEven : {}]}>
      <View style={s.checkbox} />
      <Text style={s.itemName}>{name}</Text>
      {item.weight_g !== null && (
        <Text style={s.itemWeight}>{fmtWeight(item.weight_g)}</Text>
      )}
    </View>
  );
}

function ChildTableRow({ item, index }: { item: ItemRow; index: number }) {
  const name = `${item.brand}${item.model ? ` ${item.model}` : ""}`;
  return (
    <View style={[s.childRow, index % 2 === 1 ? { backgroundColor: "#efefef" } : {}]}>
      <View style={s.checkbox} />
      <Text style={s.itemNameChild}>{name}</Text>
      {item.weight_g !== null && (
        <Text style={s.itemWeight}>{fmtWeight(item.weight_g)}</Text>
      )}
    </View>
  );
}

function SectionWeightRow({ labelText, weightG }: { labelText: string; weightG: number }) {
  return (
    <View style={s.sumRow}>
      <Text style={s.sumLabel}>{labelText}</Text>
      <Text style={s.sumValue}>{fmt3dp(weightG)}</Text>
    </View>
  );
}

export function TourPacklistPDF({
  tourName,
  tourDate,
  presetName,
  bikeItem,
  bikeChildren,
  gearItems,
  clothingItems,
  bikeSetupWeightG,
  payloadWeightG,
  totalWeightG,
  showWeights,
}: TourPacklistPDFProps) {
  const today = new Date().toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return (
    <Document title={`Packliste – ${tourName}`} author="Setup Registry">
      <Page size="A4" style={s.page}>
        {/* ── Header ── */}
        <View style={s.headerBlock}>
          <Text style={s.tourName}>{tourName}</Text>
          <View style={s.metaRow}>
            <Text style={s.metaLabel}>Datum</Text>
            <Text style={s.metaValue}>{fmtDate(tourDate)}</Text>
            {presetName && (
              <>
                <Text style={s.metaLabel}>  |  Preset</Text>
                <Text style={s.presetValue}>{presetName}</Text>
              </>
            )}
          </View>
        </View>

        {/* ── Weight breakdown bar ── */}
        {showWeights && (
          <View style={s.weightBar}>
            {bikeItem !== null && (
              <View style={s.weightItem}>
                <Text style={s.weightLabel}>BIKE-SETUP</Text>
                <Text style={s.weightValue}>{fmt3dp(bikeSetupWeightG)}</Text>
              </View>
            )}
            {(gearItems.length > 0 || clothingItems.length > 0) && (
              <>
                <View style={s.weightSep} />
                <View style={s.weightItem}>
                  <Text style={s.weightLabel}>ZULADUNG</Text>
                  <Text style={s.weightValue}>{fmt3dp(payloadWeightG)}</Text>
                </View>
              </>
            )}
            {bikeItem !== null && (gearItems.length > 0 || clothingItems.length > 0) && (
              <>
                <View style={s.weightSep} />
                <View style={s.weightItemLast}>
                  <Text style={s.weightLabel}>GESAMT</Text>
                  <Text style={s.weightValueAccent}>{fmt3dp(totalWeightG)}</Text>
                </View>
              </>
            )}
          </View>
        )}

        {/* ── Bike-Setup section ── */}
        {(bikeItem || bikeChildren.length > 0) && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>BIKE-SETUP</Text>
            {bikeItem && <ItemTableRow item={bikeItem} index={0} />}
            {bikeChildren.map((child, i) => (
              <ChildTableRow key={child.id} item={child} index={i} />
            ))}
            {showWeights && (
              <SectionWeightRow
                labelText="Summe Bike-Setup"
                weightG={bikeSetupWeightG}
              />
            )}
          </View>
        )}

        {/* ── Equipment section ── */}
        {gearItems.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>EQUIPMENT</Text>
            {gearItems.map((item, i) => (
              <ItemTableRow key={item.id} item={item} index={i} />
            ))}
            {showWeights && (
              <SectionWeightRow
                labelText="Summe Equipment"
                weightG={gearItems.reduce((s, i) => s + (i.weight_g ?? 0), 0)}
              />
            )}
          </View>
        )}

        {/* ── Bekleidung section ── */}
        {clothingItems.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>BEKLEIDUNG</Text>
            {clothingItems.map((item, i) => (
              <ItemTableRow key={item.id} item={item} index={i} />
            ))}
            {showWeights && (
              <SectionWeightRow
                labelText="Summe Bekleidung"
                weightG={clothingItems.reduce((s, i) => s + (i.weight_g ?? 0), 0)}
              />
            )}
          </View>
        )}

        {/* ── Footer ── */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>Erstellt am {today}</Text>
          <Text style={s.footerText}>Setup Registry</Text>
        </View>
      </Page>
    </Document>
  );
}
