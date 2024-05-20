import customResource from "./custom-url?url";

const resourceConfig = {
  "custom-resource": {
    url: new URL(`${customResource}`, window.location.href).href,
    css: new URL(
      `${customResource.replace(".js", ".css")}`,
      window.location.href
    ).href,
  },
};
