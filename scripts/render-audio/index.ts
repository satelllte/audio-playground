import {chromium} from 'playwright';
import child_process from 'node:child_process';

logInfo('Starting webpage server');

// Quick temporary solution to run the webpage server.
// It's better to use fastify/express server for serving `out` dir and shut it down properly.
const proc = child_process.spawn('bun', ['run', 'start']);

proc.on('error', (error) => {
  logError('Webpage server error: ', error);
});

proc.stdout.on('data', async (data) => {
  const message = `${data}`.trim();
  if (!message) return;

  const regex = /.*accepting connections at (.+)/gi;
  const match = regex.exec(message);
  if (!match?.[1]) return;

  const baseUrl = match[1];
  logInfo(`Webpage server running at ${baseUrl}`);

  await render(baseUrl);

  logInfo('Closing webpage server');
  proc.kill(); // NOTE: It doesn't kill properly and the port remains in use
});

const render = async (baseUrl: string) => {
  logInfo('Creating browser instance');
  const browser = await chromium.launch();

  logInfo('Creating browser page instance');
  const page = await browser.newPage();

  logInfo('Going to page');
  await page.goto(`${baseUrl}/scenes/native/oscillator`);

  logInfo('Rendering audio');
  await page.getByRole('button', {name: 'Render'}).click();

  logInfo('Downloading audio file');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', {name: 'Download'}).click();
  const download = await downloadPromise;

  logInfo('Saving audio file');
  await download.saveAs(
    './playwright-artifacts/' + download.suggestedFilename(),
  );

  logInfo('Closing browser instance');
  await browser.close();
};

function logInfo(...messages: unknown[]) {
  console.info('\x1b[36m%s\x1b[0m', '[render audio]', ...messages);
}

function logError(...messages: unknown[]) {
  console.error('\x1b[31m%s\x1b[0m', '[render audio]', ...messages);
}
