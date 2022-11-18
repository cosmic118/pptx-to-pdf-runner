import dotenv from "dotenv";
import fs from "fs";
import { pipeline } from "stream";
import File from "fetch-blob/file";
import { promisify } from "util";
import { execFileSync, execSync } from "child_process";
import Jimp from "jimp";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { FormData } from "formdata-polyfill/esm.min";
import fetch, { fileFromSync } from "node-fetch";

dotenv.config();

const executable = `powerpoint-interop.exe`;

const sleep = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const font = await Jimp.loadFont(Jimp.FONT_SANS_64_BLACK);

// eslint-disable-next-line
while (true) {
  (async () => {
    console.log(`polling for resources`);
    const res = await fetch(
      process.env.SERVER + `/api/get-pptx?secret=${process.env.SECRET}`
    );

    if (res.status === 404) {
      console.log(`nothing found`);
      return;
    }

    try {
      fs.unlinkSync(`out.pdf`);
    } catch {
      // ignore this
    }
    const p = fs.createWriteStream(`./pptx-to-pdf.pptx`);

    if (res.body === null) {
      return;
    }

    await promisify(pipeline)(res.body, p);

    console.log(`converting`);

    const s = execFileSync(`${executable}`, [
      `powerpoint.pptx`,
      `out.pdf`,
    ]).toString();

    console.log(s);
    if (s.match(`error`)) return;

    // Find first file

    execSync(`magick -density 300 out.pdf[0] -quality 50% out.jpg`);

    const img = await Jimp.read(`out.jpg`);

    console.log(`writing watermark`);

    img.print(
      font,
      img.getWidth() - 600,
      img.getHeight() - 70,
      `powered by Yul Lee`
    );

    await img.writeAsync(`out.jpg`);

    console.log(`uploading`);

    const form = new FormData();

    form.append(`image`, fileFromSync(`out.jpg`));

    const uploadRes = await fetch(
      process.env.SERVER + `/api/upload-image?secret=${process.env.SECRET}`,
      {
        method: `POST`,
        body: form,
      }
    );

    if (uploadRes.status !== 200) {
      console.log(`upload failed`);
      console.log(await uploadRes.json());
      return;
    }
  })();
  await sleep(5000);
}

export {};
