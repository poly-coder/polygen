import { loadGenerator } from "./configuration";
import { fsListDirectories, joinPaths } from "./file-utils";
import { IConfiguration, IGenerator, RequiredSearchOptionsOnly } from "./types";

function matchName(actualName: string, searchName?: string) {
  return (
    !searchName ||
    actualName.toLowerCase().indexOf(searchName.toLowerCase()) >= 0
  );
}

function matchTags(actualTags: string[], searchTags: string[]) {
  if (searchTags.length === 0) {
    return true;
  }

  let matchedAnyOptional = false;

  for (const searchTag of searchTags) {
    if (searchTag.startsWith('!')) {
      if (actualTags.includes(searchTag.substring(1))) {
        // Found a negative tag, so actual tags do not match
        return false;
      }
    } else if (searchTag.startsWith('*')) {
      if (!actualTags.includes(searchTag.substring(1))) {
        // Didn't found a positive tag, so actual tags do not match
        return false;
      }
      matchedAnyOptional = true;
    } else {
      if (actualTags.includes(searchTag)) {
        // Found a normal tag, so check true for now unless a negative or positive tag breaks earlier with false
        matchedAnyOptional = true;
      }
    }
  }

  return matchedAnyOptional;
}

export async function searchGenerators(
  configuration: IConfiguration,
  listOptions: RequiredSearchOptionsOnly,
  top?: number
): Promise<IGenerator[]> {
  const generators: IGenerator[] = [];

  for (const searchPath of [
    configuration.pcgenFolder,
    ...configuration.searchPaths,
  ]) {
    for (const directory of await fsListDirectories(searchPath)) {
      if (matchName(directory, listOptions.name)) {
        const generator = await loadGenerator(
          directory,
          joinPaths(searchPath, directory),
          configuration
        );

        if (generator && matchTags(generator.tags, listOptions.tag)) {
          generators.push(generator);

          if (top !== undefined && generators.length >= top) {
            break;
          }
        }
      }
    }
  }

  return generators;
}
