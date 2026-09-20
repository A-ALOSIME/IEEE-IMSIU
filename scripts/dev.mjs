import {spawn} from 'node:child_process';
const p=spawn(process.execPath,['node_modules/astro/bin/astro.mjs','dev','--host','127.0.0.1',...process.argv.slice(2)],{stdio:'inherit',env:{...process.env,CLOUDFLARE_ENV:'local',ASTRO_DEV_BACKGROUND:'1'}});p.on('exit',code=>process.exit(code??1));
