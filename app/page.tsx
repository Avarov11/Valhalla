import { getMenu } from "@/lib/menu/get-menu";
import { PageShell } from "@/components/PageShell";
import { Footer } from "@/components/Footer";

export const revalidate = 60;

export default async function Home() {
  const menu = await getMenu();

  return (
    <PageShell menu={menu}>
      <Footer />
    </PageShell>
  );
}
