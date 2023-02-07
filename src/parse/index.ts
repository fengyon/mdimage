export const dealEmpty = (src: string): string =>
  src.replace(/^( *)(\t+)/gm, (_, leading, tabs) => leading + '    '.repeat(tabs.length))
