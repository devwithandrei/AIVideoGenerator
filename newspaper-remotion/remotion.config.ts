import { Config } from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setOverwriteOutput(true);

// Use headless shell with explicit Chrome path
Config.setChromeMode('headless-shell');
