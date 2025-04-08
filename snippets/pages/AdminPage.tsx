import Page, { PageProps } from "../../snippets/pages/Page.tsx";
import { asset } from "../../util/url.ts";

interface Props extends PageProps {
}

export default function AdminPage(props: Props) {
  const head = (
    <>
      <link rel="stylesheet" href={asset("admin/admin.css")} />
      {props.head}
    </>
  );

  return (
    <Page
      {...props}
      head={head}
      header={{ breadcrumb: true }}
    />
  );
}
