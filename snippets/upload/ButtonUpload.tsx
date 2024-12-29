import { asset } from "$server";

export default function ButtonUpload() {
  return (
    <>
      <script type="module" src={asset("upload/upload.js")} />
      <input
        type="file"
        data-worker-path={asset(`/upload/worker.js`, { raw: true })}
      />
    </>
  );
}
