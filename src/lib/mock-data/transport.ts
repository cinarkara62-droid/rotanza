import { TransportCity, MetroLine } from "@/lib/types";
import rawMetro from "@/lib/mock-data/generated/metro.json";

interface RawLine {
  ref: string;
  name: string;
  color: string | null;
  stations: Array<{ name: string; lat: number; lon: number }>;
}

const metroByCity = rawMetro as Record<string, RawLine[]>;

// OSM often models each direction of a line as a separate relation, which
// would otherwise show every line twice — keep only the most complete
// (most-stations) relation per ref. Relations tagged with a semicolon-joined
// ref (e.g. "DT;Z") represent through-running services across operators,
// not a real distinct line name, so they're dropped in favor of the base lines.
function dedupeByRef(lines: RawLine[]): RawLine[] {
  const best = new Map<string, RawLine>();
  for (const line of lines) {
    if (line.ref.includes(";")) continue;
    const existing = best.get(line.ref);
    if (!existing || line.stations.length > existing.stations.length) {
      best.set(line.ref, line);
    }
  }
  return [...best.values()];
}

function linesFor(cityId: string): MetroLine[] {
  return dedupeByRef(metroByCity[cityId] ?? []).map((l) => ({
    ref: l.ref,
    name: l.name,
    color: l.color ?? "",
    stations: l.stations,
  }));
}

interface CityMeta {
  cityId: string;
  systemName: string;
  tipsTr: string[];
  tipsEn: string[];
  ticketTr: string;
  ticketEn: string;
}

const META: CityMeta[] = [
  {
    cityId: "istanbul",
    systemName: "İstanbul Metro, Tramvay & Marmaray",
    tipsTr: ["İstanbulkart tüm toplu taşımada geçerlidir ve her istasyonda satılır.", "Vapurlar Boğaz manzarası için hem pratik hem keyifli bir ulaşım seçeneğidir.", "Trafik yoğun saatlerde raylı sistem karayoluna göre çok daha hızlıdır.", "Aktarmalarda ikinci biniş indirimli ücretlendirilir."],
    tipsEn: ["The Istanbulkart works on all public transit and is sold at every station.", "Ferries are both practical and scenic for crossing the Bosphorus.", "Rail transit is far faster than roads during rush hour.", "Transfers within a time window get a discounted fare."],
    ticketTr: "Tekli biniş kart bakiyesinden düşer; İstanbulkart'a nakit veya kartla yükleme yapılabilir.",
    ticketEn: "Fares are deducted from your Istanbulkart balance; top up with cash or card at any station.",
  },
  {
    cityId: "paris",
    systemName: "Paris Métro & RER",
    tipsTr: ["Navigo Easy kartı turistler için en pratik seçenektir.", "Metro genelde havalimanından şehir merkezine RER'den daha ucuzdur.", "Son trenler gece 01:15 civarında kalkar, hafta sonu biraz daha geç."],
    tipsEn: ["The Navigo Easy card is the most practical option for tourists.", "The metro is usually cheaper than the RER from the airport to downtown.", "Last trains leave around 1:15 AM, a bit later on weekends."],
    ticketTr: "Tekli bilet veya 10'lu 'carnet' paketi alınabilir; temassız kartla da ödeme yapılabilir.",
    ticketEn: "Buy single tickets or a 10-pack 'carnet'; contactless card payment is also accepted.",
  },
  {
    cityId: "rome",
    systemName: "Roma Metropolitane",
    tipsTr: ["Tarihi merkez küçüktür, yürüyerek gezmek çoğu zaman en iyi seçenektir.", "Roma Pass toplu taşıma ve müzeleri bir arada sunar."],
    tipsEn: ["The historic center is compact — walking is often the best option.", "The Roma Pass bundles transit with museum entries."],
    ticketTr: "BIT bileti 100 dakika boyunca metro, otobüs ve tramvayda geçerlidir.",
    ticketEn: "The BIT ticket is valid on metro, bus, and tram for 100 minutes.",
  },
  {
    cityId: "tokyo",
    systemName: "Tokyo Metro & Toei Subway",
    tipsTr: ["Suica veya Pasmo kartı tüm şehir içi ulaşımda geçerlidir.", "Trenler dakikliğiyle ünlüdür, sefer saatlerine güvenebilirsiniz.", "Yoğun saatlerde vagonlar oldukça kalabalık olabilir.", "Tokyo Metro ve Toei ayrı şirketlerdir, aktarmada ek ücret çıkabilir."],
    tipsEn: ["A Suica or Pasmo card works across all city transit.", "Trains are famously punctual — you can trust the schedule.", "Cars can get very crowded during rush hour.", "Tokyo Metro and Toei are separate operators — transfers may add a small fee."],
    ticketTr: "IC kartına önceden bakiye yükleyip tüm hatlarda dokunarak geçebilirsiniz.",
    ticketEn: "Top up an IC card in advance and tap through on any line.",
  },
  {
    cityId: "barcelona",
    systemName: "TMB Metro Barcelona",
    tipsTr: ["T-Casual bileti 10 biniş için uygun fiyatlıdır.", "Plajlara yürüyerek de ulaşılabilir.", "L9 hattı havalimanına doğrudan bağlantı sağlar."],
    tipsEn: ["The T-Casual ticket offers 10 rides at a good price.", "Beaches are also reachable on foot from downtown.", "L9 offers a direct connection to the airport."],
    ticketTr: "T-Casual veya Hola BCN turist kartı metro, otobüs ve tramvayda geçerlidir.",
    ticketEn: "The T-Casual or Hola BCN tourist card covers metro, bus, and tram.",
  },
  {
    cityId: "london",
    systemName: "London Underground & Elizabeth line",
    tipsTr: ["Temassız banka kartınız Oyster kart gibi çalışır ve günlük ücret tavanı vardır.", "Zon 1-2 turistler için genelde yeterlidir."],
    tipsEn: ["Contactless bank cards work like an Oyster card with a daily fare cap.", "Zones 1-2 are usually enough for tourists."],
    ticketTr: "Oyster kart veya temassız kartla giriş-çıkış yaparak seyahat edin.",
    ticketEn: "Tap in and out with an Oyster card or contactless bank card.",
  },
  {
    cityId: "newyork",
    systemName: "New York City Subway",
    tipsTr: ["OMNY temassız ödeme artık jetondan daha yaygın.", "Metro 7/24 çalışır ama gece seferleri seyrektir.", "Ekspres ve lokal trenleri karıştırmamaya dikkat edin."],
    tipsEn: ["OMNY contactless payment is now more common than tokens.", "The subway runs 24/7, but night service is less frequent.", "Watch for express vs. local trains on the same line."],
    ticketTr: "OMNY ile banka kartınızı veya telefonunuzu okutarak binebilirsiniz.",
    ticketEn: "Tap your bank card or phone via OMNY to ride.",
  },
  {
    cityId: "amsterdam",
    systemName: "GVB Metro & Tram",
    tipsTr: ["Şehir küçük olduğu için bisiklet en hızlı ulaşım şeklidir.", "OV-chipkaart tramvay, otobüs ve metroda geçerlidir."],
    tipsEn: ["The city is compact, so cycling is often the fastest way around.", "The OV-chipkaart covers trams, buses, and the metro."],
    ticketTr: "OV-chipkaart'a bakiye yükleyip giriş-çıkışta kartınızı okutun.",
    ticketEn: "Top up an OV-chipkaart and tap in/out at readers.",
  },
];

export const transportCities: TransportCity[] = META.map((meta) => ({
  ...meta,
  lines: linesFor(meta.cityId),
}));

export function getTransportForCity(cityId: string) {
  return transportCities.find((t) => t.cityId === cityId);
}
