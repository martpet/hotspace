import { asset } from "$server";

interface Props {
  fileName: string;
}

export default function ButtonDeleteFile({ fileName }: Props) {
  return (
    <>
      <script type="module" src={asset("inodes/delete_file.js")} />
      <button
        id="delete-button"
        class="wait-disabled"
        disabled
        data-file-name={fileName}
      >
        Delete File
      </button>
    </>
  );
}
