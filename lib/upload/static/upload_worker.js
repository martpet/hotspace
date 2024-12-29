addEventListener("message", ({ data }) => {
  if (data instanceof File) {
    new Uploader(data);
  }
});

class Uploader {
  constructor(file) {
    this.file = file;
  }
}
