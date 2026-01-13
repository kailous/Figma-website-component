declare module "figma:react" {
  export function defineProperties(component: any, props: any): void;
}

declare module "react" {
  export const useEffect: any;
  export const useRef: any;
  export const useState: any;
  const React: any;
  export default React;
}
