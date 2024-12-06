import { asset } from "../../lib/server/asset_path.ts";

interface Props {
  spaceId: string;
}

export default function ChatLazyLoad({ spaceId }: Props) {
  return (
    <>
      <script type="module" src={asset("chat/chat.js")} />
      <link rel="modulepreload" href={asset("db.js")} />
      <div id="chat_root" data-space-id={spaceId} class="spinner-sm" />
    </>
  );
}
