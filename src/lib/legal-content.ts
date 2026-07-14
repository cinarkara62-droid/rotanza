export interface LegalSection {
  heading: string;
  body: string;
}

export interface LegalDoc {
  title: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
}

const privacyTr: LegalDoc = {
  title: "Gizlilik Politikası",
  updated: "Son güncelleme: 2026",
  intro:
    "Rotanza olarak gizliliğinize önem veriyoruz. Bu sayfa, uygulamayı kullanırken hangi verilerin toplandığını ve nasıl kullanıldığını açıklar.",
  sections: [
    {
      heading: "Topladığımız veriler",
      body: "Hesap oluşturduğunuzda e-posta adresiniz, adınız (opsiyonel) ve şifrenizin şifrelenmiş bir özeti saklanır. Rota planlarınız, rezervasyonlarınız ve fiyat alarmlarınız gibi uygulama içi veriler, oturum açmadığınız sürece yalnızca tarayıcınızda (localStorage) tutulur.",
    },
    {
      heading: "Üçüncü taraf servisler",
      body: "Restoran, otel ve şehir arama sonuçları OpenStreetMap topluluğunun ücretsiz Nominatim ve Overpass servislerinden alınır. Ödeme işlemleri Stripe tarafından işlenir; kart bilgileriniz bizim sunucularımızdan geçmez. Uçuş/otel fiyat verisi eklendiğinde Amadeus for Developers servisi kullanılabilir.",
    },
    {
      heading: "Verilerinizi nasıl kullanırız",
      body: "Verileriniz yalnızca hizmeti sunmak, aboneliğinizi yönetmek ve (izin verdiyseniz) sizinle iletişim kurmak için kullanılır. Verileriniz satılmaz veya reklam amacıyla üçüncü taraflarla paylaşılmaz.",
    },
    {
      heading: "Haklarınız",
      body: "Hesabınızı ve ilişkili verilerinizi istediğiniz zaman silme talebinde bulunabilirsiniz. Verilerinize erişim veya düzeltme talepleri için bizimle iletişime geçebilirsiniz.",
    },
    {
      heading: "İletişim",
      body: "Gizlilikle ilgili sorularınız için: support@rotanza.example",
    },
  ],
};

const privacyEn: LegalDoc = {
  title: "Privacy Policy",
  updated: "Last updated: 2026",
  intro:
    "At Rotanza, we take your privacy seriously. This page explains what data is collected while using the app and how it's used.",
  sections: [
    {
      heading: "Data we collect",
      body: "When you create an account, we store your email, name (optional), and a hashed version of your password. In-app data like itineraries, reservations, and price alerts is kept only in your browser (localStorage) unless you're signed in.",
    },
    {
      heading: "Third-party services",
      body: "Restaurant, hotel, and city search results come from OpenStreetMap's free Nominatim and Overpass services. Payments are processed by Stripe — your card details never pass through our servers. When flight/hotel pricing is added, the Amadeus for Developers service may be used.",
    },
    {
      heading: "How we use your data",
      body: "Your data is used only to provide the service, manage your subscription, and (if you've opted in) communicate with you. We never sell your data or share it with third parties for advertising.",
    },
    {
      heading: "Your rights",
      body: "You can request deletion of your account and associated data at any time. Contact us for access or correction requests.",
    },
    {
      heading: "Contact",
      body: "For privacy questions: support@rotanza.example",
    },
  ],
};

const termsTr: LegalDoc = {
  title: "Kullanım Koşulları",
  updated: "Son güncelleme: 2026",
  intro: "Rotanza'yı kullanarak aşağıdaki koşulları kabul etmiş olursunuz.",
  sections: [
    {
      heading: "Hizmetin tanımı",
      body: "Rotanza; seyahat rotası planlama, restoran/otel keşfi, ulaşım rehberi, bütçe hesaplama, rezervasyon organizasyonu ve fiyat takibi özellikleri sunan bir web uygulamasıdır. Bazı özellikler ücretsiz plan ile sınırlıdır.",
    },
    {
      heading: "Abonelikler ve faturalandırma",
      body: "Pro ve Max abonelikleri aylık veya yıllık olarak faturalandırılır ve Stripe üzerinden işlenir. Aboneliğinizi istediğiniz zaman hesap ayarlarından iptal edebilirsiniz; iptal, mevcut faturalandırma döneminin sonunda geçerli olur.",
    },
    {
      heading: "Veri doğruluğu",
      body: "Restoran, otel ve ulaşım bilgileri OpenStreetMap gibi açık kaynaklardan alınır ve her zaman güncel veya eksiksiz olmayabilir. Seyahat kararlarınızı verirken resmi kaynakları da kontrol etmenizi öneririz.",
    },
    {
      heading: "Sorumluluk sınırlaması",
      body: "Rotanza, uygulamada gösterilen bilgilerin doğruluğu veya üçüncü taraf hizmetlerin kullanılabilirliği konusunda garanti vermez. Hizmet 'olduğu gibi' sunulur.",
    },
    {
      heading: "İletişim",
      body: "Sorularınız için: support@rotanza.example",
    },
  ],
};

const termsEn: LegalDoc = {
  title: "Terms of Service",
  updated: "Last updated: 2026",
  intro: "By using Rotanza, you agree to the following terms.",
  sections: [
    {
      heading: "Description of service",
      body: "Rotanza is a web app offering trip route planning, restaurant/hotel discovery, transit guides, budget calculation, reservation organization, and price tracking. Some features are limited on the Free plan.",
    },
    {
      heading: "Subscriptions and billing",
      body: "Pro and Max subscriptions are billed monthly or yearly and processed via Stripe. You can cancel your subscription at any time from your account settings; cancellation takes effect at the end of the current billing period.",
    },
    {
      heading: "Data accuracy",
      body: "Restaurant, hotel, and transit information is sourced from open data like OpenStreetMap and may not always be current or complete. We recommend checking official sources before making travel decisions.",
    },
    {
      heading: "Limitation of liability",
      body: "Rotanza makes no warranty about the accuracy of information shown in the app or the availability of third-party services. The service is provided \"as is.\"",
    },
    {
      heading: "Contact",
      body: "For questions: support@rotanza.example",
    },
  ],
};

const translationPendingNote: Record<string, string> = {
  de: "Diese Seite ist derzeit nur auf Türkisch und Englisch vollständig verfügbar. Unten sehen Sie die englische Version.",
  fr: "Cette page n'est actuellement disponible dans son intégralité qu'en turc et en anglais. La version anglaise est affichée ci-dessous.",
  es: "Esta página solo está completamente disponible en turco e inglés por ahora. A continuación se muestra la versión en inglés.",
  ar: "هذه الصفحة متوفرة بالكامل حاليًا باللغتين التركية والإنجليزية فقط. تُعرض النسخة الإنجليزية أدناه.",
};

export function getLegalDoc(kind: "privacy" | "terms", locale: string): { doc: LegalDoc; pendingNote?: string } {
  if (locale === "tr") return { doc: kind === "privacy" ? privacyTr : termsTr };
  if (locale === "en") return { doc: kind === "privacy" ? privacyEn : termsEn };
  return {
    doc: kind === "privacy" ? privacyEn : termsEn,
    pendingNote: translationPendingNote[locale],
  };
}
