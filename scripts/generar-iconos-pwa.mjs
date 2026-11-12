// Genera iconos PNG para instalar Mazmorreo sin dependencias adicionales.
import { mkdirSync, writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { join } from 'node:path';
const dir = 'web/public/icons';
mkdirSync(dir, { recursive: true });
const crcTable = Array.from({ length: 256 }, (_, n) => { for(let k=0;k<8;k++) n = n & 1 ? 0xedb88320 ^ (n >>> 1) : n >>> 1; return n >>> 0; });
function chunk(type, data) {
  const tag=Buffer.from(type), len=Buffer.alloc(4), crc=Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  let c=0xffffffff;
  for(const b of Buffer.concat([tag,data])) c=crcTable[(c^b)&255]^(c>>>8);
  crc.writeUInt32BE((c^0xffffffff)>>>0);
  return Buffer.concat([len,tag,data,crc]);
}
function icon(n) {
  const rows=Buffer.alloc((n*4+1)*n);
  for(let y=0;y<n;y++) for(let x=0;x<n;x++) {
    const a=x/n,b=y/n, off=y*(n*4+1)+1+x*4;
    const arch=(a-.5)**2/.25**2+(b-.48)**2/.37**2;
    const door=a>.29&&a<.71&&b>.35&&b<.82&&((b>.48)||arch<1);
    const border=a>.24&&a<.76&&b>.27&&b<.87&&((b>.48)||((a-.5)**2/.29**2+(b-.48)**2/.42**2<1));
    const gold=border&&!door;
    const knob=door&&(a-.64)**2+(b-.61)**2<.012**2;
    const rgb=knob?[250,209,126]:gold?[175,126,65]:door?[18,15,20]:[27,21,24];
    rows[off]=rgb[0];rows[off+1]=rgb[1];rows[off+2]=rgb[2];rows[off+3]=255;
  }
  const header=Buffer.alloc(13);header.writeUInt32BE(n,0);header.writeUInt32BE(n,4);header[8]=8;header[9]=6;
  const png=Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',deflateSync(rows)),chunk('IEND',Buffer.alloc(0))]);
  writeFileSync(join(dir,`icon-${n}.png`),png);
}
icon(192);icon(512);
