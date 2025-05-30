import Page, { type PageProps } from "./Page.tsx";

export default function AdminPage(props: PageProps) {
  return (
    <Page
      {...props}
      header={{
        breadcrumb: true,
        breadcrumbProps: {
          noTrailingSlash: true,
        },
      }}
    >
      <h1>{props.title}</h1>
      {props.children}
    </Page>
  );
}
