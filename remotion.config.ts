import { Config } from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setCodec('h264');
Config.setOverwriteOutput(true);
// Shader transitions use WebGL. "angle" uses the GPU; machines without one
// (CI runners) set REMOTION_GL=swangle for the software path.
Config.setChromiumOpenGlRenderer((process.env.REMOTION_GL as 'angle' | 'swangle') ?? 'angle');
