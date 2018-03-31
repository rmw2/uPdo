import { parse } from 'pd-fileutils.parser';

export function parsePatch(patchString) {
  return parse(patchString);
}
