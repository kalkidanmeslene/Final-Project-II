declare module "ethiopian-date" {
  export function toEthiopian(date: [number, number, number]): [number, number, number];
  export function toGregorian(date: [number, number, number]): [number, number, number];
}
