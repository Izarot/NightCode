import LZString from 'lz-string';
export class SaveManager {
  private key = 'duality_save';
  public save(data: any) { 
    const json = JSON.stringify(data);
    const compressed = LZString.compressToUTF16(json);
    localStorage.setItem(this.key, compressed);
  }
  public load(): any { 
    const compressed = localStorage.getItem(this.key);
    if (!compressed) return null;
    const json = LZString.decompressFromUTF16(compressed);
    return JSON.parse(json);
  }
}
