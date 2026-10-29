// Font files imported as their address (the bundler serves them)
declare module "*.woff2" {
  // The file's address
  const url: string;
  // Hand it back
  export default url;
}
// Stylesheets imported for their side effect
declare module "*.css";
