import { JSX } from "preact/jsx-runtime";
import { asset } from "../../util/url.ts";

export default function ButtonDeleteInode(
  props: JSX.HTMLAttributes<HTMLButtonElement>,
) {
  return (
    <>
      <script type="module" src={asset("inodes/delete_inode.js")} />
      <button
        id="delete-inode-button"
        class="wait-disabled"
        disabled
        {...props}
      />
    </>
  );
}
