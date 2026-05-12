/* eslint-disable init-declarations */
declare module '*.svg' {
  const content: import('next/image').StaticImageData
  export default content
}
