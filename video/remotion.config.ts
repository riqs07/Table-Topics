// Remotion settings for the VoiceLab videos: share the app's drawings and keep one copy of React

// Load Remotion's settings and Node's path tools
import { Config } from "@remotion/cli/config";
import path from "node:path";

// Use a Chromium already on the machine when one is named (as the browser checks do), otherwise Remotion's own
Config.setBrowserExecutable(process.env.CHROMIUM_PATH ?? null);
// Write H.264 MP4, the format every short-video site takes
Config.setCodec("h264");
// Let the bundler find the app's code under "@" (so the blob and tiles are the very same components) and use this folder's React for both
Config.overrideWebpackConfig((config) => ({
  // Everything else as Remotion sets it
  ...config,
  // How imports are found
  resolve: {
    // Remotion's own settings
    ...config.resolve,
    // The shortcuts
    alias: {
      // Remotion's own shortcuts
      ...(config.resolve?.alias ?? {}),
      // The app's code, as the app names it
      "@": path.resolve(process.cwd(), "../src"),
      // One React for the app's components and the video, or hooks break
      react: path.resolve(process.cwd(), "node_modules/react"),
      // (and its DOM side)
      "react-dom": path.resolve(process.cwd(), "node_modules/react-dom"),
    },
  },
}));
