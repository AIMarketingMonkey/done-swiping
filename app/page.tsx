import { getHumeAccessToken } from "@/utils/getHumeAccessToken";
import nextDynamic from "next/dynamic";

// Force this page to be rendered dynamically on every request so that a fresh,
// short-lived Hume access token is fetched each time. Without this, Next.js/Vercel
// may statically cache the rendered page (x-vercel-cache: HIT) along with an
// expired access token, causing the voice websocket to silently fail to connect.
export const dynamic = "force-dynamic";
export const revalidate = 0;

const Chat = nextDynamic(() => import("@/components/Chat"), {
  ssr: false,
});

export default async function Page() {
  const accessToken = await getHumeAccessToken();

  if (!accessToken) {
    throw new Error('Unable to get access token');
  }

  return (
    <div className="grow flex flex-col">
      <Chat accessToken={accessToken} />
    </div>
  );
}
