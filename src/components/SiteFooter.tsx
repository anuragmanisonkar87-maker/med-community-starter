import Link from "next/link";

// Footer with SEBI/legal disclosure block — the reference site was missing this.
export default function SiteFooter() {
  return (
    <footer className="mt-10 bg-brand-ink text-gray-300">
      <div className="container-page grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-display text-lg font-semibold text-white">MedWealth Circle</p>
          <p className="mt-3 text-sm text-gray-400">
            A personal-finance community built for doctors in India.
          </p>
        </div>
        <FooterCol title="Learn" links={[["Watch", "/watch"], ["Courses", "/courses"], ["Blog", "/blog"], ["FIRE Calculator", "/calculators/fire"], ["FinnFit Quiz", "/quiz"]]} />
        <FooterCol title="Community" links={[["Join free", "/signup"], ["Sign in", "/login"], ["Forum", "/community"], ["Events", "/events"], ["Newsletters", "/newsletters"]]} />
        <FooterCol title="Company" links={[["About", "/about"], ["Contact", "/contact"], ["Terms", "/terms"], ["Privacy", "/privacy"]]} />
      </div>

      <div className="border-t border-white/10">
        <div className="container-page py-6 text-xs leading-relaxed text-gray-400">
          <p>
            <strong className="text-gray-200">Disclosure:</strong> Educational content only; not investment
            advice. Operated by [Your Legal Entity Pvt. Ltd.], SEBI Registered Investment Adviser
            Reg. No. [INAxxxxxxxxx]. Registered office: [Full address]. Investments are subject to
            market risks; read all related documents carefully.
          </p>
          <p className="mt-3">© {new Date().getFullYear()} MedWealth Circle. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <p className="text-sm font-semibold text-white">{title}</p>
      <ul className="mt-3 space-y-2 text-sm">
        {links.map(([label, href]) => (
          <li key={href}>
            <Link href={href} className="text-gray-400 hover:text-white">{label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
