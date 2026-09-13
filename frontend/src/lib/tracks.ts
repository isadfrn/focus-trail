export interface Track {
  id: string;
  name: string;
  url: string;
}

function baseName(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, "");
}

function toTracks(modules: Record<string, string>): Track[] {
  return Object.entries(modules)
    .map(([path, url]) => {
      const fileName = path.split("/").pop() ?? path;
      const name = baseName(fileName);
      return { id: name, name, url };
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
