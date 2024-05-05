declare module "*.svg" {
  import type { FunctionalComponent } from "sinho";

  const Component: FunctionalComponent<any>;
  export default Component;
}
