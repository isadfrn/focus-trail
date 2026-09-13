export interface Track {
  id: string;
  name: string;
  url: string;
}

function prettify(fileName: string): string {
  return fileName
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function toTracks(modules: Record<string, string>): Track[] {
  return Object.entries(modules)
    .map(([path, url]) => {
      const fileName = path.split("/").pop() ?? path;
      return { id: fileName.replace(/\.[^.]+$/, ""), name: prettify(fileName), url };
    })
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}

export function nextIndex(index: number, length: number): number {
  return length ? (index + 1) % length : 0;
}

export function prevIndex(index: number, length: number): number {
  return length ? (index - 1 + length) % length : 0;
}

const musicModules = import.meta.glob("../assets/music/*.{mp3,ogg,wav,m4a}", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

const effectModules = import.meta.glob("../assets/effects/*.{mp3,ogg,wav,m4a}", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

export const musicTracks = toTracks(musicModules);
export const effectTracks = toTracks(effectModules);
