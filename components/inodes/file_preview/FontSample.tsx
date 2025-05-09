interface Props {
  src: string;
}

export default function FontSample(props: Props) {
  const { src } = props;

  const css = `
    @font-face {
      font-family: "FontSample";
      src: url("${src}");
    }
  `;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <p id="font-sample">
        The quick brown fox jumps over the lazy dog
      </p>
    </>
  );
}
