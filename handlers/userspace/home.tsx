import UserSpace from "../../components/pages/UserSpace.tsx";
import type { Context } from "../../utils/types.ts";

export default function userSpaceHomeHandler({ url }: Context) {
  return (
    <UserSpace url={url}>
      <p>test 123</p>
    </UserSpace>
  );
}
